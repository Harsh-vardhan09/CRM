import { Router } from "express";
import { adminController } from "../controllers/adminController.js";
import { protect, checkPermission } from "../middleware/authMiddleware.js";
import { validateAdminRequests } from "../middleware/adminValidationMiddleware.js";

const router: Router = Router();

// COMPANY ROUTES
router.post(
  "/companies",
  protect,
  checkPermission("admin", "full"),
  validateAdminRequests.validateCreateCompany,
  adminController.createCompany,
);

router.get(
  "/companies",
  protect,
  checkPermission("admin", "read"),
  adminController.listCompanies,
);

router.get(
  "/companies/:companyId",
  protect,
  checkPermission("admin", "read"),
  adminController.getCompany,
);

router.put(
  "/companies/:companyId",
  protect,
  checkPermission("admin", "write"),
  validateAdminRequests.validateUpdateCompany,
  adminController.updateCompany,
);

router.post(
  "/companies/:companyId/features",
  protect,
  checkPermission("admin", "full"),
  validateAdminRequests.validateAssignFeatures,
  adminController.assignFeatures,
);

// ROLE ROUTES
router.post(
  "/roles",
  protect,
  checkPermission("roles", "write"),
  validateAdminRequests.validateCreateRole,
  adminController.createRole,
);

router.get(
  "/roles",
  protect,
  checkPermission("roles", "read"),
  adminController.listRoles,
);

router.put(
  "/roles/:roleId/permissions",
  protect,
  checkPermission("roles", "full"),
  validateAdminRequests.validateAssignPermissions,
  adminController.assignPermissionsToRole,
);

// USER ROUTES
router.post(
  "/users",
  protect,
  checkPermission("users", "write"),
  validateAdminRequests.validateCreateUser,
  adminController.createUser,
);

router.get(
  "/users",
  protect,
  checkPermission("users", "read"),
  adminController.listUsers,
);

router.put(
  "/users/:userId/role",
  protect,
  checkPermission("users", "write"),
  validateAdminRequests.validateUpdateUserRole,
  adminController.updateUserRole,
);

router.delete(
  "/users/:userId",
  protect,
  checkPermission("users", "full"),
  adminController.deleteUser,
);

export default router;
