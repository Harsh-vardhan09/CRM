import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { prisma } from '../config/db.js';
import type { User, Organisation } from '@prisma/client';
import { hasPermission } from '../utils/modelHelpers.js';

export interface AuthenticatedRequest extends Request {
  user?: User & { organisation: Organisation | null };
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = '';

    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } 
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1] || '';
    }

    if (!token) {
      res.status(401).json({ message: 'You are not logged in. Please log in to get access.' });
      return;
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.id) {
      res.status(401).json({ message: 'Invalid or expired access token.' });
      return;
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { organisation: true },
    });

    if (!currentUser) {
      res.status(401).json({ message: 'The user belonging to this token no longer exists.' });
      return;
    }

    req.user = currentUser;
    next();
  } catch (error) {
    console.error('Auth protect middleware error:', error);
    res.status(500).json({ message: 'Internal server error during authentication.' });
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'You do not have permission to perform this action.' });
      return;
    }

    next();
  };
};

export const checkPermission = (permissionKey: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!hasPermission(req.user, permissionKey)) {
      res.status(403).json({ message: `Required permission '${permissionKey}' is missing.` });
      return;
    }

    next();
  };
};
