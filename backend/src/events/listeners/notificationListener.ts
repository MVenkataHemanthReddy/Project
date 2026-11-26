import { prisma } from '../../config/db';
import { appEventEmitter } from '../eventEmitter';
import { TicketEventType } from '../ticketEvents';
import { Role } from '../../types';

export function registerNotificationListener(): void {
  // 1. Ticket Created -> Notify Admins
  appEventEmitter.onEvent(TicketEventType.TICKET_CREATED, async (payload) => {
    try {
      // Find all admins
      const admins = await prisma.user.findMany({
        where: { role: Role.ADMIN },
        select: { id: true },
      });

      if (admins.length === 0) return;

      const notifications = admins.map((admin) => ({
        userId: admin.id,
        ticketId: payload.ticket.id,
        type: 'TICKET_CREATED',
        title: `New Ticket #${payload.ticket.ticketNumber}`,
        message: `${payload.actor.name} submitted: "${payload.ticket.title}" (${payload.ticket.priority} priority)`,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      console.log(`[Event Action] Dispatched ${notifications.length} in-app notification(s) for TICKET_CREATED`);
    } catch (error) {
      console.error('[Event Error] Failed to create notifications for TICKET_CREATED:', error);
    }
  });

  // 2. Status Changed -> Notify Ticket Owner
  appEventEmitter.onEvent(TicketEventType.STATUS_CHANGED, async (payload) => {
    try {
      // If the actor is not the ticket owner, notify the owner
      if (payload.actor.id !== payload.ticket.userId) {
        await prisma.notification.create({
          data: {
            userId: payload.ticket.userId,
            ticketId: payload.ticket.id,
            type: 'STATUS_CHANGED',
            title: `Ticket #${payload.ticket.ticketNumber} Status Update`,
            message: `Your ticket "${payload.ticket.title}" status changed to ${payload.newStatus} by ${payload.actor.name}.`,
          },
        });
        console.log(`[Event Action] Dispatched in-app notification to ticket owner for STATUS_CHANGED`);
      }
    } catch (error) {
      console.error('[Event Error] Failed to create notification for STATUS_CHANGED:', error);
    }
  });

  // 3. Comment Added -> Notify the counter-party
  appEventEmitter.onEvent(TicketEventType.COMMENT_ADDED, async (payload) => {
    try {
      const isOwner = payload.actor.id === payload.ticket.userId;

      if (isOwner) {
        // User commented: notify all admins
        const admins = await prisma.user.findMany({
          where: { role: Role.ADMIN },
          select: { id: true },
        });

        const notifications = admins.map((admin) => ({
          userId: admin.id,
          ticketId: payload.ticket.id,
          type: 'COMMENT_ADDED',
          title: `New User Comment on #${payload.ticket.ticketNumber}`,
          message: `${payload.actor.name} commented on "${payload.ticket.title}"`,
        }));

        if (notifications.length > 0) {
          await prisma.notification.createMany({ data: notifications });
        }
      } else {
        // Admin commented: notify the ticket owner
        await prisma.notification.create({
          data: {
            userId: payload.ticket.userId,
            ticketId: payload.ticket.id,
            type: 'COMMENT_ADDED',
            title: `Admin Response on #${payload.ticket.ticketNumber}`,
            message: `${payload.actor.name} replied to your ticket "${payload.ticket.title}"`,
          },
        });
      }
      console.log('[Event Action] Dispatched in-app notification for COMMENT_ADDED');
    } catch (error) {
      console.error('[Event Error] Failed to create notification for COMMENT_ADDED:', error);
    }
  });

  // 4. Ticket Resolved -> Notify Ticket Owner
  appEventEmitter.onEvent(TicketEventType.TICKET_RESOLVED, async (payload) => {
    try {
      if (payload.actor.id !== payload.ticket.userId) {
        await prisma.notification.create({
          data: {
            userId: payload.ticket.userId,
            ticketId: payload.ticket.id,
            type: 'TICKET_RESOLVED',
            title: `Ticket #${payload.ticket.ticketNumber} Resolved 🎉`,
            message: `Your ticket "${payload.ticket.title}" has been marked as resolved by ${payload.actor.name}.`,
          },
        });
        console.log('[Event Action] Dispatched in-app notification for TICKET_RESOLVED');
      }
    } catch (error) {
      console.error('[Event Error] Failed to create notification for TICKET_RESOLVED:', error);
    }
  });
}
