import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma, toSafeUserJSON, hashRefreshToken, verifyRefreshTokenHash, getFrontendPermissions } from '@repo/db';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.js';


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};

function formatUserForResponse(user: any) {
  const safeUser = toSafeUserJSON(user);
  
  // Map the dynamic role name to the static roles expected by the frontend
  let roleName = 'sales_rep';
  if (user.isSuperAdmin) {
    roleName = 'super_admin';
  } else if (user.role?.name.toLowerCase().includes('admin')) {
    roleName = 'admin';
  }

  return {
    ...safeUser,
    role: roleName,
    permissions: getFrontendPermissions(user),
    orgId: user.companyId ? String(user.companyId) : undefined,
  };
}

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Please provide email and password.' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: {
        company: true,
        role: {
          include: {
            permissions: {
              include: {
                feature: true,
              },
            },
          },
        },
      },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ message: 'Incorrect email or password.' });
      return;
    }

    // Check company status
    if (user.company && user.company.status !== 'active') {
      res.status(403).json({ message: 'Your organization account is suspended.' });
      return;
    }

    const roleName = user.isSuperAdmin ? 'super_admin' : (user.role?.name.toLowerCase().includes('admin') ? 'admin' : 'sales_rep');
    const accessToken = signAccessToken({ id: user.id, role: roleName });
    const refreshToken = signRefreshToken({ id: user.id });

    // Format permissions on the user object so formatUserForResponse has them
    const permissions: Record<string, any> = {};
    if (user.isSuperAdmin) {
      // Super admins bypass check
    } else if (user.role?.permissions) {
      for (const p of user.role.permissions) {
        permissions[p.feature.code] = p.accessLevel;
      }
    }
    const userWithPermissions = { ...user, permissions };

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: hashRefreshToken(refreshToken),
        lastLoginAt: new Date(),
      },
      include: {
        company: true,
        role: {
          include: {
            permissions: {
              include: {
                feature: true,
              },
            },
          },
        },
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
      user: formatUserForResponse({ ...updatedUser, permissions }),
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

    const user = await prisma.user.findFirst({
      where: { id: decoded.id, deletedAt: null },
      include: { role: true },
    });
    
    if (!user || !verifyRefreshTokenHash(user, refreshToken)) {
      res.status(401).json({ message: 'Token is invalid or has been revoked.' });
      return;
    }

    const roleName = user.isSuperAdmin ? 'super_admin' : (user.role?.name.toLowerCase().includes('admin') ? 'admin' : 'sales_rep');
    const newAccessToken = signAccessToken({ id: user.id, role: roleName });

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
      user: formatUserForResponse(req.user),
    });
  } catch (error) {
    console.error('Get Me error:', error);
    res.status(500).json({ message: 'Internal server error fetching profile.' });
  }
};
