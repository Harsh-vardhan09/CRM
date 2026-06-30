// middleware/authMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { prisma, getRolePermissions } from "@repo/db";
import type { AccessLevel } from "@repo/db";

// ─── Request augmentation ─────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  avatar: string | null;
  companyId: number | null;
  roleId: number | null;
  roleName: string | null; // Keeps role name for direct string checks if needed
  status: string;
  isOwner: boolean;
  isSuperAdmin: boolean;
  /** Feature code → AccessLevel map; populated by `protect` middleware */
  permissions: Record<string, AccessLevel>;
}

/** A Request that has been passed through the `protect` middleware. */
export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };

// ─── protect ─────────────────────────────────────────────────────────────────

/**
 * JWT guard — attaches `req.user` with full permission map.
 * Reads token from: Authorization: Bearer <token>  OR  cookie: accessToken
 */
export async function protect(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // 1. Extract raw token
    let token: string | undefined;
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      res.status(401).json({ message: "No access token provided" });
      return;
    }

    // 2. Verify signature + expiry (RS256)
    const payload = verifyAccessToken(token);
    if (!payload?.id) {
      res.status(401).json({ message: "Invalid or expired token" });
      return;
    }

    // 3. Load user from DB — includes company status and role definitions
    const user = await prisma.user.findFirst({
      where: { id: payload.id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        companyId: true,
        roleId: true,
        status: true,
        isOwner: true,
        isSuperAdmin: true,
        lastLoginAt: true,
        company: { select: { status: true } },
        role: { select: { name: true } }, // Fetches dynamic role name
      },
    });

    if (!user) {
      res.status(401).json({ message: "User not found or deactivated" });
      return;
    }

    // Tenant isolation: block suspended company users
    if (user.company && user.company.status !== "active") {
      res
        .status(403)
        .json({ message: "Your organization account is suspended." });
      return;
    }

    if (user.status === "pending") {
      res
        .status(403)
        .json({ message: "Your account is pending administrator approval." });
      return;
    }

    if (user.status === "rejected") {
      res.status(403).json({
        message: "Your access request to this organisation has been rejected.",
      });
      return;
    }

    // 4. Build permission map
    let permissions: Record<string, AccessLevel> = {};

    if (user.isSuperAdmin) {
      // Super admins bypass all feature gates, so permissions map can be empty
      permissions = {};
    } else if (user.roleId) {
      permissions = await getRolePermissions(prisma, user.roleId);
    }

    // 5. Attach to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      companyId: user.companyId,
      roleId: user.roleId,
      roleName: user.role?.name || null,
      status: user.status,
      isOwner: user.isOwner,
      isSuperAdmin: user.isSuperAdmin,
      permissions,
    };

    next();
  } catch (err) {
    next(err);
  }
}

// ─── checkPermission ─────────────────────────────────────────────────────────

/**
 * Route-level permission gate. Handles access hierarchy (full > write > read).
 */
export function checkPermission(
  featureCode: string,
  required: AccessLevel = "read",
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    // Super admin bypasses all checks
    if (user.isSuperAdmin) {
      next();
      return;
    }

    const LEVEL_RANK: Record<AccessLevel, number> = {
      read: 1,
      write: 2,
      full: 3,
    };
    const granted = user.permissions[featureCode];

    if (!granted || (LEVEL_RANK[granted] ?? 0) < (LEVEL_RANK[required] ?? 0)) {
      res.status(403).json({
        message: `Requires '${required}' access to feature '${featureCode}'`,
      });
      return;
    }

    next();
  };
}

// ─── restrictTo ──────────────────────────────────────────────────────────────

/**
 * Role-level restriction gate (e.g. restrictTo('Admin', 'Sales Rep')).
 */
export function restrictTo(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    // Super Admin bypasses role checks
    if (req.user.isSuperAdmin) {
      next();
      return;
    }

    const roleName = req.user.roleName;

    if (!roleName || !roles.includes(roleName)) {
      res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
      return;
    }

    next();
  };
}

// ─── requireOwner ─────────────────────────────────────────────────────────────

/** Gate to company owner (billing / CEO contact). Must come after protect(). */
export function requireOwner(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ message: "Unauthenticated" });
    return;
  }
  if (!req.user.isOwner && !req.user.isSuperAdmin) {
    res.status(403).json({ message: "Owner access required" });
    return;
  }
  next();
}

// ─── requireSuperAdmin ────────────────────────────────────────────────────────

/** Gate to platform super_admin only. Must come after protect(). */
export function requireSuperAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user?.isSuperAdmin) {
    res.status(403).json({ message: "Super-admin access required" });
    return;
  }
  next();
}
