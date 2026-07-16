import type { Request, Response, NextFunction } from "express";

class AdminValidationMiddleware {
  validateCreateCompany(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const { name, status } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "name is required and must be a string",
      });
      return;
    }
    if (name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "name cannot be empty",
      });
      return;
    }
    if (name.length > 255) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "name must be max 255 characters",
      });
      return;
    }
    if (status && !["active", "suspended"].includes(status)) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "status must be one of: active, suspended",
      });
      return;
    }
    next();
  }

  validateUpdateCompany(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const { name, status } = req.body;
    if (!name && !status) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "at least one field (name, status) is required",
      });
      return;
    }
    if (name !== undefined) {
      if (typeof name !== "string") {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          details: "name must be a string",
        });
        return;
      }
      if (name.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          details: "name cannot be empty",
        });
        return;
      }
      if (name.length > 255) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          details: "name must be max 255 characters",
        });
        return;
      }
    }
    if (status && !["active", "suspended"].includes(status)) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "status must be one of: active, suspended",
      });
      return;
    }
    next();
  }

  validateCreateRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "name is required and must be a string",
      });
      return;
    }
    if (name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "name cannot be empty",
      });
      return;
    }
    if (name.length > 100) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "name must be max 100 characters",
      });
      return;
    }
    next();
  }

  validateAssignPermissions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "permissions must be an array",
      });
      return;
    }
    if (permissions.length === 0) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "permissions array cannot be empty",
      });
      return;
    }
    const validAccessLevels = ["read", "write", "full"];
    for (let i = 0; i < permissions.length; i++) {
      const perm = permissions[i];
      if (!perm || typeof perm !== "object") {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          details: `permissions[${i}] must be an object`,
        });
        return;
      }
      if (!Number.isInteger(perm.featureId)) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          details: `permissions[${i}].featureId must be an integer`,
        });
        return;
      }
      if (!validAccessLevels.includes(perm.accessLevel)) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          details: `permissions[${i}].accessLevel must be one of: read, write, full`,
        });
        return;
      }
    }
    next();
  }

  validateCreateUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const { email, name, roleId, password } = req.body;
    if (!email || typeof email !== "string") {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "email is required and must be a string",
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "email must be a valid email address",
      });
      return;
    }
    if (!name || typeof name !== "string") {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "name is required and must be a string",
      });
      return;
    }
    if (name.trim().length === 0) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "name cannot be empty",
      });
      return;
    }
    if (!Number.isInteger(roleId)) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "roleId is required and must be an integer",
      });
      return;
    }
    if (password !== undefined) {
      if (typeof password !== "string") {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          details: "password must be a string",
        });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          details: "password must be at least 8 characters",
        });
        return;
      }
    }
    next();
  }

  validateUpdateUserRole(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const { roleId } = req.body;
    if (!Number.isInteger(roleId)) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "roleId is required and must be an integer",
      });
      return;
    }
    next();
  }

  validateAssignFeatures(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const { featureIds } = req.body;
    if (!Array.isArray(featureIds)) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "featureIds must be an array",
      });
      return;
    }
    if (featureIds.length === 0) {
      res.status(400).json({
        success: false,
        error: "Validation Error",
        details: "featureIds array cannot be empty",
      });
      return;
    }
    for (let i = 0; i < featureIds.length; i++) {
      if (!Number.isInteger(featureIds[i])) {
        res.status(400).json({
          success: false,
          error: "Validation Error",
          details: `featureIds[${i}] must be an integer`,
        });
        return;
      }
    }
    next();
  }
}

export const validateAdminRequests = new AdminValidationMiddleware();
