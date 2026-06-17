import type { Response } from 'express';
import { User } from '../models/User.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password.' });
      return;
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Incorrect email or password.' });
      return;
    }

    // Generate tokens
    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    // Store refresh token in db
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    // Set HttpOnly Cookies
    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user info (exclude passwordHash)
    res.status(200).json({
      status: 'success',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        permissions: user.permissions,
        orgId: user.orgId,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
};

export const refresh = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token not found.' });
      return;
    }

    // Verify token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.id) {
      res.status(401).json({ message: 'Invalid or expired refresh token.' });
      return;
    }

    // Check if user exists and token is active
    const user = await User.findByPk(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ message: 'Token is invalid or has been revoked.' });
      return;
    }

    // Sign new access token
    const newAccessToken = signAccessToken({ id: user.id, role: user.role });

    // Set cookie
    res.cookie('accessToken', newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(200).json({
      status: 'success',
      message: 'Access token refreshed successfully.',
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Internal server error during token refresh.' });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded && decoded.id) {
        const user = await User.findByPk(decoded.id);
        if (user) {
          user.refreshToken = null;
          await user.save();
        }
      }
    }

    // Clear cookies
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error during logout.' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    res.status(200).json({
      status: 'success',
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        avatar: req.user.avatar,
        role: req.user.role,
        permissions: req.user.permissions,
        orgId: req.user.orgId,
        lastLoginAt: req.user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('Get Me error:', error);
    res.status(500).json({ message: 'Internal server error fetching profile.' });
  }
};
