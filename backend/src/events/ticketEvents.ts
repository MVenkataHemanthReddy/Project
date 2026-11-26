import { Role, TicketStatus, Priority, Category } from '../types';

export enum TicketEventType {
  TICKET_CREATED = 'ticket:created',
  TICKET_UPDATED = 'ticket:updated',
  STATUS_CHANGED = 'ticket:status_changed',
  COMMENT_ADDED = 'ticket:comment_added',
  TICKET_RESOLVED = 'ticket:resolved',
}

export interface ActorInfo {
  id: string;
  name: string;
  email: string;
  role: Role | string;
}

export interface TicketCreatedPayload {
  ticket: {
    id: string;
    ticketNumber: number;
    title: string;
    description: string;
    category: Category | string;
    priority: Priority | string;
    status: TicketStatus | string;
    userId: string;
  };
  actor: ActorInfo;
}

export interface TicketUpdatedPayload {
  ticket: {
    id: string;
    ticketNumber: number;
    title: string;
    description: string;
    category: Category | string;
    priority: Priority | string;
    status: TicketStatus | string;
    userId: string;
  };
  changes: Record<string, { from: any; to: any }>;
  actor: ActorInfo;
}

export interface StatusChangedPayload {
  ticket: {
    id: string;
    ticketNumber: number;
    title: string;
    userId: string;
  };
  oldStatus: TicketStatus | string;
  newStatus: TicketStatus | string;
  actor: ActorInfo;
}

export interface CommentAddedPayload {
  ticket: {
    id: string;
    ticketNumber: number;
    title: string;
    userId: string;
  };
  comment: {
    id: string;
    content: string;
  };
  actor: ActorInfo;
}

export interface TicketResolvedPayload {
  ticket: {
    id: string;
    ticketNumber: number;
    title: string;
    userId: string;
  };
  resolvedAt: Date;
  actor: ActorInfo;
}
