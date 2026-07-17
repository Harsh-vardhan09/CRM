import { Router } from "express";
import { protect, checkPermission } from "../middleware/authMiddleware.js";
import { leadController } from "../controllers/leadController.js";

const router: Router = Router();

router.post("/", protect, checkPermission("leads_management", "write"), leadController.createLead);
router.get("/", protect, checkPermission("leads_management", "read"), leadController.listLeads);
router.get("/:id", protect, checkPermission("leads_management", "read"), leadController.getLead);
router.put("/:id", protect, checkPermission("leads_management", "write"), leadController.updateLead);
router.delete("/:id", protect, checkPermission("leads_management", "full"), leadController.deleteLead);
router.get("/:id/messages", protect, checkPermission("leads_management", "read"), leadController.getLeadMessages);
router.post("/:id/messages", protect, checkPermission("leads_management", "write"), leadController.sendLeadMessage);

export default router;
