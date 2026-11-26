import { prisma } from '../config/db';
import { appEventEmitter } from '../events/eventEmitter';
import { TicketEventType } from '../events/ticketEvents';
import { Role, TicketStatus, Priority, Category, JWTPayload, FilterOptions } from '../types';
import { AppError } from '../middlewares/errorHandler';

export class TicketService {
  /**
   * Calculate next auto-incrementing human readable ticket number
   */
  private static async getNextTicketNumber(): Promise<number> {
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { ticketNumber: 'desc' },
      select: { ticketNumber: true },
    });
    return (lastTicket?.ticketNumber || 1000) + 1;
  }

  /**
   * Create a new ticket (User or Admin)
   */
  static async createTicket(
    user: JWTPayload,
    data: {
      title: string;
      description: string;
      category?: Category;
      priority?: Priority;
    }
  ) {
    const actor = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!actor) {
      throw new AppError('User not found', 404);
    }

    const ticketNumber = await this.getNextTicketNumber();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category || Category.GENERAL,
        priority: data.priority || Priority.MEDIUM,
        status: TicketStatus.OPEN,
        userId: user.userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Fire Event-Driven Action
    appEventEmitter.emitEvent(TicketEventType.TICKET_CREATED, {
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        userId: ticket.userId,
      },
      actor: {
        id: actor.id,
        name: actor.name,
        email: actor.email,
        role: actor.role,
      },
    });

    return ticket;
  }

  /**
   * Get tickets with filtering, search, sorting & pagination
   */
  static async getTickets(user: JWTPayload, filters: FilterOptions) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // RBAC: Standard users can only view their own tickets
    if (user.role !== Role.ADMIN) {
      where.userId = user.userId;
    } else if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      where.OR = [
        { title: { contains: searchTerm } },
        { description: { contains: searchTerm } },
      ];
    }

    const orderBy: any = {};
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { comments: true, activityLogs: true },
          },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get single ticket by ID with full details, comments, and audit trail
   */
  static async getTicketById(ticketId: string, user: JWTPayload) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            actor: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    // Role-based authorization
    if (user.role !== Role.ADMIN && ticket.userId !== user.userId) {
      throw new AppError('You do not have permission to view this ticket', 403);
    }

    return ticket;
  }

  /**
   * Update ticket (User or Admin)
   */
  static async updateTicket(
    ticketId: string,
    user: JWTPayload,
    data: {
      title?: string;
      description?: string;
      category?: Category;
      priority?: Priority;
      status?: TicketStatus;
      assignedToId?: string | null;
    }
  ) {
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!existingTicket) {
      throw new AppError('Ticket not found', 404);
    }

    const actor = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!actor) {
      throw new AppError('User not found', 404);
    }

    const changes: Record<string, { from: any; to: any }> = {};
    const updateData: any = {};

    // Standard User permissions
    if (user.role !== Role.ADMIN) {
      if (existingTicket.userId !== user.userId) {
        throw new AppError('You can only edit your own tickets', 403);
      }

      if (
        existingTicket.status === TicketStatus.RESOLVED ||
        existingTicket.status === TicketStatus.CLOSED
      ) {
        throw new AppError('Cannot modify tickets that are already resolved or closed', 400);
      }

      if (data.title && data.title !== existingTicket.title) {
        changes.title = { from: existingTicket.title, to: data.title };
        updateData.title = data.title;
      }
      if (data.description && data.description !== existingTicket.description) {
        changes.description = { from: existingTicket.description, to: data.description };
        updateData.description = data.description;
      }
      if (data.category && data.category !== existingTicket.category) {
        changes.category = { from: existingTicket.category, to: data.category };
        updateData.category = data.category;
      }
      if (data.priority && data.priority !== existingTicket.priority) {
        changes.priority = { from: existingTicket.priority, to: data.priority };
        updateData.priority = data.priority;
      }
    } else {
      // Admin permissions
      if (data.title && data.title !== existingTicket.title) {
        changes.title = { from: existingTicket.title, to: data.title };
        updateData.title = data.title;
      }
      if (data.description && data.description !== existingTicket.description) {
        changes.description = { from: existingTicket.description, to: data.description };
        updateData.description = data.description;
      }
      if (data.category && data.category !== existingTicket.category) {
        changes.category = { from: existingTicket.category, to: data.category };
        updateData.category = data.category;
      }
      if (data.priority && data.priority !== existingTicket.priority) {
        changes.priority = { from: existingTicket.priority, to: data.priority };
        updateData.priority = data.priority;
      }
      if (data.status && data.status !== existingTicket.status) {
        changes.status = { from: existingTicket.status, to: data.status };
        updateData.status = data.status;

        if (data.status === TicketStatus.RESOLVED && !existingTicket.resolvedAt) {
          updateData.resolvedAt = new Date();
        } else if (data.status !== TicketStatus.RESOLVED && existingTicket.status === TicketStatus.RESOLVED) {
          updateData.resolvedAt = null;
        }
      }
      if (data.assignedToId !== undefined && data.assignedToId !== existingTicket.assignedToId) {
        changes.assignedTo = { from: existingTicket.assignedToId, to: data.assignedToId };
        updateData.assignedToId = data.assignedToId;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return existingTicket;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    // Fire Events
    if (changes.status) {
      appEventEmitter.emitEvent(TicketEventType.STATUS_CHANGED, {
        ticket: {
          id: updatedTicket.id,
          ticketNumber: updatedTicket.ticketNumber,
          title: updatedTicket.title,
          userId: updatedTicket.userId,
        },
        oldStatus: changes.status.from,
        newStatus: changes.status.to,
        actor: {
          id: actor.id,
          name: actor.name,
          email: actor.email,
          role: actor.role,
        },
      });

      if (changes.status.to === TicketStatus.RESOLVED) {
        appEventEmitter.emitEvent(TicketEventType.TICKET_RESOLVED, {
          ticket: {
            id: updatedTicket.id,
            ticketNumber: updatedTicket.ticketNumber,
            title: updatedTicket.title,
            userId: updatedTicket.userId,
          },
          resolvedAt: updatedTicket.resolvedAt || new Date(),
          actor: {
            id: actor.id,
            name: actor.name,
            email: actor.email,
            role: actor.role,
          },
        });
      }
    }

    const nonStatusChanges = { ...changes };
    delete nonStatusChanges.status;
    if (Object.keys(nonStatusChanges).length > 0) {
      appEventEmitter.emitEvent(TicketEventType.TICKET_UPDATED, {
        ticket: {
          id: updatedTicket.id,
          ticketNumber: updatedTicket.ticketNumber,
          title: updatedTicket.title,
          description: updatedTicket.description,
          category: updatedTicket.category,
          priority: updatedTicket.priority,
          status: updatedTicket.status,
          userId: updatedTicket.userId,
        },
        changes: nonStatusChanges,
        actor: {
          id: actor.id,
          name: actor.name,
          email: actor.email,
          role: actor.role,
        },
      });
    }

    return updatedTicket;
  }

  /**
   * Delete ticket
   */
  static async deleteTicket(ticketId: string, user: JWTPayload) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    if (user.role !== Role.ADMIN) {
      if (ticket.userId !== user.userId) {
        throw new AppError('You can only delete your own tickets', 403);
      }
      if (ticket.status !== TicketStatus.OPEN) {
        throw new AppError('You can only delete tickets that are in OPEN status', 400);
      }
    }

    await prisma.ticket.delete({
      where: { id: ticketId },
    });

    return { id: ticketId, ticketNumber: ticket.ticketNumber };
  }
}
