import type { Response, NextFunction } from "express";
import { resolveUserPermissions } from "../utils/permission.service";

const hierarchy = {
  none: 0,
  read: 1,
  write: 2,
  full: 3,
};

export function requirePermission(
  feature: string,
  access: keyof typeof hierarchy,
) {
  return async (req: any, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const permissions = await resolveUserPermissions(userId);
    const current = permissions[feature] as keyof typeof hierarchy;

    if (!current) {
      return res.status(403).json({
        message: "Permission denied",
      });
    }

    if (hierarchy[current] < hierarchy[access]) {
      return res.status(403).json({
        message: "Permission denied",
      });
    }

    next();
  };
}
