import { prisma } from '../config/db';
import { appEventEmitter } from '../events/eventEmitter';
import { TicketEventType } from '../events/ticketEvents';
import { Role, JWTPayload } from '../types';
import { AppError } from '../middlewares/errorHandler';

export class CommentService {
  static async addComment(
    ticketId: string,
    user: JWTPayload,
    content: string
  ) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        userId: true,
      },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    // Role-based access: User can only comment on own ticket, Admin on any
    if (user.role !== Role.ADMIN && ticket.userId !== user.userId) {
      throw new AppError('You can only comment on your own tickets', 403);
    }

    const actor = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!actor) {
      throw new AppError('User not found', 404);
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        ticketId,
        userId: user.userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Touch ticket updatedAt
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    // Fire Event
    appEventEmitter.emitEvent(TicketEventType.COMMENT_ADDED, {
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        userId: ticket.userId,
      },
      comment: {
        id: comment.id,
        content: comment.content,
      },
      actor: {
        id: actor.id,
        name: actor.name,
        email: actor.email,
        role: actor.role,
      },
    });

    return comment;
  }

  static async getComments(ticketId: string, user: JWTPayload) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { userId: true },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    if (user.role !== Role.ADMIN && ticket.userId !== user.userId) {
      throw new AppError('You do not have access to comments for this ticket', 403);
    }

    return prisma.comment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }
}
