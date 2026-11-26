import { appEventEmitter } from '../eventEmitter';
import { TicketEventType } from '../ticketEvents';

export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: Date;
}

export const simulatedEmailOutbox: SimulatedEmail[] = [];

export function registerEmailNotifierListener(): void {
  appEventEmitter.onEvent(TicketEventType.TICKET_CREATED, (payload) => {
    const email: SimulatedEmail = {
      id: Math.random().toString(36).substring(2, 9),
      to: payload.actor.email,
      subject: `[Support Ticket #${payload.ticket.ticketNumber}] Ticket Received: ${payload.ticket.title}`,
      body: `Hello ${payload.actor.name},\n\nWe have received your ticket #${payload.ticket.ticketNumber} "${payload.ticket.title}". Our team has been notified and will review it shortly.\n\nStatus: ${payload.ticket.status}\nPriority: ${payload.ticket.priority}`,
      sentAt: new Date(),
    };
    simulatedEmailOutbox.unshift(email);
    console.log(`[Email Simulator] ✉️ Sent confirmation email to ${email.to}: "${email.subject}"`);
  });

  appEventEmitter.onEvent(TicketEventType.STATUS_CHANGED, (payload) => {
    const email: SimulatedEmail = {
      id: Math.random().toString(36).substring(2, 9),
      to: `user-${payload.ticket.userId}@helpdesk.internal`,
      subject: `[Support Ticket #${payload.ticket.ticketNumber}] Status updated to ${payload.newStatus}`,
      body: `Your ticket "${payload.ticket.title}" status has been changed from ${payload.oldStatus} to ${payload.newStatus} by ${payload.actor.name}.`,
      sentAt: new Date(),
    };
    simulatedEmailOutbox.unshift(email);
    console.log(`[Email Simulator] ✉️ Sent status change email: "${email.subject}"`);
  });

  appEventEmitter.onEvent(TicketEventType.TICKET_RESOLVED, (payload) => {
    const email: SimulatedEmail = {
      id: Math.random().toString(36).substring(2, 9),
      to: `user-${payload.ticket.userId}@helpdesk.internal`,
      subject: `[Support Ticket #${payload.ticket.ticketNumber}] Ticket Resolved!`,
      body: `Your ticket "${payload.ticket.title}" has been resolved by ${payload.actor.name}. Thank you for reaching out to Helpdesk support.`,
      sentAt: new Date(),
    };
    simulatedEmailOutbox.unshift(email);
    console.log(`[Email Simulator] ✉️ Sent ticket resolved email: "${email.subject}"`);
  });
}
