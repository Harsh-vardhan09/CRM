import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { Organisation } from '../models/Organisation.js';

// Extend Express Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = '';

    // 1. Check for token in cookies
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } 
    // 2. Check for token in Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1] || '';
    }

    if (!token) {
      res.status(401).json({ message: 'You are not logged in. Please log in to get access.' });
      return;
    }

    // 3. Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded || !decoded.id) {
      res.status(401).json({ message: 'Invalid or expired access token.' });
      return;
    }

    // 4. Find user in database with associated organisation
    const currentUser = await User.findByPk(decoded.id, {
      include: [{ model: Organisation, as: 'organisation' }],
    });

    if (!currentUser) {
      res.status(401).json({ message: 'The user belonging to this token no longer exists.' });
      return;
    }

    // 5. Grant access
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

export const checkPermission = (permissionKey: keyof User['permissions']) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!req.user.hasPerm(permissionKey)) {
      res.status(403).json({ message: `Required permission '${permissionKey}' is missing.` });
      return;
    }

    next();
  };
};
