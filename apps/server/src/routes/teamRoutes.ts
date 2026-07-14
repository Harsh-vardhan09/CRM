import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { getActiveTeam, assignUserRole } from '../controllers/teamController.js';
import { protect, requireAdminOrOwner } from '../middleware/authMiddleware.js';

const router: ExpressRouter = Router();

// Apply protect and requireAdminOrOwner to all team routes
router.use(protect);
router.use(requireAdminOrOwner);

// GET /api/team/active
router.get('/active', getActiveTeam);

// PATCH /api/team/users/:userId/role
router.patch('/users/:userId/role', assignUserRole);

export default router;
