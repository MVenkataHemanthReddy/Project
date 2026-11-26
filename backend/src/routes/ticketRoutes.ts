import { Router } from 'express';
import { TicketController } from '../controllers/ticketController';
import { CommentController } from '../controllers/commentController';
import { authenticate } from '../middlewares/authMiddleware';
import { validateBody, validateQuery } from '../middlewares/validateMiddleware';
import {
  createTicketSchema,
  createCommentSchema,
  ticketQuerySchema,
} from '../validators';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// All ticket routes require authentication
router.use(authenticate);

// Ticket CRUD
router.post('/', validateBody(createTicketSchema), asyncHandler(TicketController.createTicket));
router.get('/', validateQuery(ticketQuerySchema), asyncHandler(TicketController.getTickets));
router.get('/:id', asyncHandler(TicketController.getTicketById));
router.patch('/:id', asyncHandler(TicketController.updateTicket));
router.delete('/:id', asyncHandler(TicketController.deleteTicket));

// Ticket Comments
router.post('/:id/comments', validateBody(createCommentSchema), asyncHandler(CommentController.addComment));
router.get('/:id/comments', asyncHandler(CommentController.getComments));

export default router;
