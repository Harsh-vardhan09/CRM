import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { replyToTicket, createTicket, getTickets, getTicketMessages } from '../controllers/supportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router: ExpressRouter = Router();

// /api/support/tickets
router.post('/tickets', protect, createTicket);
router.get('/tickets', protect, getTickets);

// /api/support/tickets/:ticketId/messages
router.get('/tickets/:ticketId/messages', protect, getTicketMessages);

// /api/support/tickets/:ticketId/reply
router.post('/tickets/:ticketId/reply', protect, replyToTicket);

export default router;
