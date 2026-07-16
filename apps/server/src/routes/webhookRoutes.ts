import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { handleIncomingWhatsApp } from '../controllers/webhookController.js';

const router: ExpressRouter = Router();

// /api/webhooks/whatsapp
router.post('/whatsapp', handleIncomingWhatsApp);

export default router;
