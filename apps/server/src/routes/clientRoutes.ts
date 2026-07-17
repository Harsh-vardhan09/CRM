import { Router } from "express";
import { clientController } from "../controllers/clientController.js";
import { protect, checkPermission } from "../middleware/authMiddleware.js";

const router: Router = Router();

router.post("/", protect, checkPermission("clients", "write"), clientController.createClient);
router.get("/", protect, checkPermission("clients", "read"), clientController.listClients);
router.get("/:id", protect, checkPermission("clients", "read"), clientController.getClient);
router.put("/:id", protect, checkPermission("clients", "write"), clientController.updateClient);
router.delete("/:id", protect, checkPermission("clients", "full"), clientController.deleteClient);

export default router;
