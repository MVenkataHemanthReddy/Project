import { prisma } from '../../config/db';
import { appEventEmitter } from '../eventEmitter';
import { TicketEventType } from '../ticketEvents';

export function registerActivityLogListener(): void {
  // Ticket Created
  appEventEmitter.onEvent(TicketEventType.TICKET_CREATED, async (payload) => {
    try {
      await prisma.activityLog.create({
        data: {
          ticketId: payload.ticket.id,
          actorId: payload.actor.id,
          action: 'TICKET_CREATED',
          details: `Ticket #${payload.ticket.ticketNumber} created by ${payload.actor.name} (${payload.actor.role})`,
          metadata: JSON.stringify({
            title: payload.ticket.title,
            category: payload.ticket.category,
            priority: payload.ticket.priority,
            status: payload.ticket.status,
          }),
        },
      });
      console.log(`[Event Action] ActivityLog saved for Ticket #${payload.ticket.ticketNumber} (CREATED)`);
    } catch (error) {
      console.error('[Event Error] Failed to log TICKET_CREATED activity:', error);
    }
  });

  // Ticket Updated
  appEventEmitter.onEvent(TicketEventType.TICKET_UPDATED, async (payload) => {
    try {
      const changeKeys = Object.keys(payload.changes).join(', ');
      await prisma.activityLog.create({
        data: {
          ticketId: payload.ticket.id,
          actorId: payload.actor.id,
          action: 'TICKET_UPDATED',
          details: `Ticket #${payload.ticket.ticketNumber} modified [${changeKeys}] by ${payload.actor.name}`,
          metadata: JSON.stringify(payload.changes),
        },
      });
      console.log(`[Event Action] ActivityLog saved for Ticket #${payload.ticket.ticketNumber} (UPDATED)`);
    } catch (error) {
      console.error('[Event Error] Failed to log TICKET_UPDATED activity:', error);
    }
  });

  // Status Changed
  appEventEmitter.onEvent(TicketEventType.STATUS_CHANGED, async (payload) => {
    try {
      await prisma.activityLog.create({
        data: {
          ticketId: payload.ticket.id,
          actorId: payload.actor.id,
          action: 'STATUS_CHANGED',
          details: `Status changed from ${payload.oldStatus} to ${payload.newStatus} by ${payload.actor.name}`,
          metadata: JSON.stringify({
            from: payload.oldStatus,
            to: payload.newStatus,
          }),
        },
      });
      console.log(`[Event Action] ActivityLog saved for Ticket #${payload.ticket.ticketNumber} (STATUS_CHANGED: ${payload.oldStatus} -> ${payload.newStatus})`);
    } catch (error) {
      console.error('[Event Error] Failed to log STATUS_CHANGED activity:', error);
    }
  });

  // Comment Added
  appEventEmitter.onEvent(TicketEventType.COMMENT_ADDED, async (payload) => {
    try {
      await prisma.activityLog.create({
        data: {
          ticketId: payload.ticket.id,
          actorId: payload.actor.id,
          action: 'COMMENT_ADDED',
          details: `New response posted by ${payload.actor.name} (${payload.actor.role})`,
          metadata: JSON.stringify({
            commentId: payload.comment.id,
            snippet: payload.comment.content.slice(0, 100),
          }),
        },
      });
      console.log(`[Event Action] ActivityLog saved for Ticket #${payload.ticket.ticketNumber} (COMMENT_ADDED)`);
    } catch (error) {
      console.error('[Event Error] Failed to log COMMENT_ADDED activity:', error);
    }
  });

  // Ticket Resolved
  appEventEmitter.onEvent(TicketEventType.TICKET_RESOLVED, async (payload) => {
    try {
      await prisma.activityLog.create({
        data: {
          ticketId: payload.ticket.id,
          actorId: payload.actor.id,
          action: 'TICKET_RESOLVED',
          details: `Ticket #${payload.ticket.ticketNumber} marked as RESOLVED by ${payload.actor.name}`,
          metadata: JSON.stringify({
            resolvedAt: payload.resolvedAt,
          }),
        },
      });
      console.log(`[Event Action] ActivityLog saved for Ticket #${payload.ticket.ticketNumber} (RESOLVED)`);
    } catch (error) {
      console.error('[Event Error] Failed to log TICKET_RESOLVED activity:', error);
    }
  });
}
