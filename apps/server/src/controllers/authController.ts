import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import {
  toSafeUserJSON,
  hashRefreshToken,
  verifyRefreshTokenHash
} from '../utils/modelHelpers.js';

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

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ message: 'Incorrect email or password.' });
      return;
    }

    const accessToken = signAccessToken({ id: user.id, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: hashRefreshToken(refreshToken),
        refreshToken: null,
        lastLoginAt: new Date(),
      },
    });

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: 'success',
      user: toSafeUserJSON(updatedUser),
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

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.id) {
      res.status(401).json({ message: 'Invalid or expired refresh token.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !verifyRefreshTokenHash(user, refreshToken)) {
      res.status(401).json({ message: 'Token is invalid or has been revoked.' });
      return;
    }

    const newAccessToken = signAccessToken({ id: user.id, role: user.role });

    res.cookie('accessToken', newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
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
        await prisma.user.updateMany({
          where: { id: decoded.id },
          data: {
            refreshToken: null,
            refreshTokenHash: null,
          },
        });
      }
    }

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
      user: toSafeUserJSON(req.user),
    });
  } catch (error) {
    console.error('Get Me error:', error);
    res.status(500).json({ message: 'Internal server error fetching profile.' });
  }
};
