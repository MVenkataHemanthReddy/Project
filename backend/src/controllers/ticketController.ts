import { Response } from 'express';
import { TicketService } from '../services/ticketService';
import { sendSuccess } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class TicketController {
  static async createTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    const ticket = await TicketService.createTicket(req.user!, req.body);
    sendSuccess(res, 201, ticket, 'Support ticket created successfully');
  }

  static async getTickets(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { tickets, pagination } = await TicketService.getTickets(req.user!, req.query as any);
    sendSuccess(res, 200, tickets, undefined, pagination);
  }

  static async getTicketById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const ticket = await TicketService.getTicketById(req.params.id, req.user!);
    sendSuccess(res, 200, ticket);
  }

  static async updateTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    const updated = await TicketService.updateTicket(req.params.id, req.user!, req.body);
    sendSuccess(res, 200, updated, 'Ticket updated successfully');
  }

  static async deleteTicket(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await TicketService.deleteTicket(req.params.id, req.user!);
    sendSuccess(res, 200, result, 'Ticket deleted successfully');
  }
}
