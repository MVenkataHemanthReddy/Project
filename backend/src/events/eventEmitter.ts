import { EventEmitter } from 'events';
import {
  TicketEventType,
  TicketCreatedPayload,
  TicketUpdatedPayload,
  StatusChangedPayload,
  CommentAddedPayload,
  TicketResolvedPayload,
} from './ticketEvents';

class TypedEventEmitter extends EventEmitter {
  emitEvent(event: TicketEventType.TICKET_CREATED, payload: TicketCreatedPayload): boolean;
  emitEvent(event: TicketEventType.TICKET_UPDATED, payload: TicketUpdatedPayload): boolean;
  emitEvent(event: TicketEventType.STATUS_CHANGED, payload: StatusChangedPayload): boolean;
  emitEvent(event: TicketEventType.COMMENT_ADDED, payload: CommentAddedPayload): boolean;
  emitEvent(event: TicketEventType.TICKET_RESOLVED, payload: TicketResolvedPayload): boolean;
  emitEvent(event: string, payload: any): boolean {
    return super.emit(event, payload);
  }

  onEvent(event: TicketEventType.TICKET_CREATED, listener: (payload: TicketCreatedPayload) => void): this;
  onEvent(event: TicketEventType.TICKET_UPDATED, listener: (payload: TicketUpdatedPayload) => void): this;
  onEvent(event: TicketEventType.STATUS_CHANGED, listener: (payload: StatusChangedPayload) => void): this;
  onEvent(event: TicketEventType.COMMENT_ADDED, listener: (payload: CommentAddedPayload) => void): this;
  onEvent(event: TicketEventType.TICKET_RESOLVED, listener: (payload: TicketResolvedPayload) => void): this;
  onEvent(event: string, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}

export const appEventEmitter = new TypedEventEmitter();
