import type { Response } from "express";
import { adminService } from "../services/admin.service.js";
import type { AdminRequest } from "../types/admin.types.js";

class AdminController {
  createCompany = async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const result = await adminService.createCompany(req.body);
      res.status(201).json({
        success: true,
        message: "Company created successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: "Bad Request",
        details: error.message,
      });
    }
  };

  listCompanies = async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await adminService.listCompanies(page, limit);
      res.status(200).json({
        success: true,
        message: "Companies retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        details: error.message,
      });
    }
  };

  getCompany = async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const companyId = parseInt(req.params.companyId as string);
      const result = await adminService.getCompany(companyId);
      res.status(200).json({
        success: true,
        message: "Company retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: "Not Found",
        details: error.message,
      });
    }
  };

  updateCompany = async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const companyId = parseInt(req.params.companyId as string);
      const result = await adminService.updateCompany(companyId, req.body);
      res.status(200).json({
        success: true,
        message: "Company updated successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: "Bad Request",
        details: error.message,
      });
    }
  };

  assignFeatures = async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const companyId = parseInt(req.params.companyId as string);
      const { featureIds } = req.body;
      await adminService.assignFeatures(companyId, featureIds);
      res.status(200).json({
        success: true,
        message: "Features assigned successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: "Bad Request",
        details: error.message,
      });
    }
  };

  createRole = async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          error: "Bad Request",
          details: "Company context missing from user",
        });
        return;
      }
      const result = await adminService.createRole(companyId, req.body);
      res.status(201).json({
        success: true,
        message: "Role created successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: "Bad Request",
        details: error.message,
      });
    }
  };

  listRoles = async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          error: "Bad Request",
          details: "Company context missing from user",
        });
        return;
      }
      const result = await adminService.listRoles(companyId);
      res.status(200).json({
        success: true,
        message: "Roles retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        details: error.message,
      });
    }
  };

  assignPermissionsToRole = async (
    req: AdminRequest,
    res: Response,
  ): Promise<void> => {
    try {
      const roleId = parseInt(req.params.roleId as string);
      await adminService.assignPermissionsToRole(roleId, req.body);
      res.status(200).json({
        success: true,
        message: "Permissions assigned to role successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: "Bad Request",
        details: error.message,
      });
    }
  };

  createUser = async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          error: "Bad Request",
          details: "Company context missing from user",
        });
        return;
      }
      const result = await adminService.createUser(companyId, req.body);
      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: "Bad Request",
        details: error.message,
      });
    }
  };

  listUsers = async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          error: "Bad Request",
          details: "Company context missing from user",
        });
        return;
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await adminService.listUsers(companyId, page, limit);
      res.status(200).json({
        success: true,
        message: "Users retrieved successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
        details: error.message,
      });
    }
  };

  updateUserRole = async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId as string);
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          error: "Bad Request",
          details: "Company context missing from user",
        });
        return;
      }
      const { roleId } = req.body;
      const result = await adminService.updateUserRole(
        userId,
        companyId,
        roleId,
      );
      res.status(200).json({
        success: true,
        message: "User role updated successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: "Bad Request",
        details: error.message,
      });
    }
  };

  deleteUser = async (req: AdminRequest, res: Response): Promise<void> => {
    try {
      const userId = parseInt(req.params.userId as string);
      const companyId = req.user?.companyId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          error: "Bad Request",
          details: "Company context missing from user",
        });
        return;
      }
      await adminService.deleteUser(userId, companyId);
      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: "Bad Request",
        details: error.message,
      });
    }
  };
}

export const adminController = new AdminController();
