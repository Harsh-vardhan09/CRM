import { Router } from "express";
import { protect, checkPermission } from "../middleware/authMiddleware.js";
import { automationController } from "../controllers/automationController.js";

const router: Router = Router();

router.get("/", protect, checkPermission("automations", "read"), automationController.listAutomations);
router.get("/:id", protect, checkPermission("automations", "read"), automationController.getAutomation);
router.post("/", protect, checkPermission("automations", "write"), automationController.createAutomation);
router.put("/:id", protect, checkPermission("automations", "write"), automationController.updateAutomation);
router.delete("/:id", protect, checkPermission("automations", "full"), automationController.deleteAutomation);

export default router;
