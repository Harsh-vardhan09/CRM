import { Router } from "express";
import { protect, checkPermission } from "../middleware/authMiddleware.js";
import { dashboardController } from "../controllers/dashboardController.js";

const router: Router = Router();

router.get("/stats", protect, checkPermission("analytics", "read"), dashboardController.getStats);
router.get("/pipeline", protect, checkPermission("analytics", "read"), dashboardController.getPipeline);

export default router;
