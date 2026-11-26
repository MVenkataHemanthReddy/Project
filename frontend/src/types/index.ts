export type Role = 'USER' | 'ADMIN';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type Category = 'TECHNICAL' | 'BILLING' | 'ACCOUNT' | 'FEATURE_REQUEST' | 'GENERAL';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface ActivityLog {
  id: string;
  ticketId: string;
  actorId?: string | null;
  action: string;
  details: string;
  metadata?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
}

export interface Comment {
  id: string;
  content: string;
  ticketId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface Ticket {
  id: string;
  ticketNumber: number;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: TicketStatus;
  userId: string;
  assignedToId?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  assignedTo?: User | null;
  comments?: Comment[];
  activityLogs?: ActivityLog[];
  _count?: {
    comments: number;
    activityLogs: number;
  };
}

export interface Notification {
  id: string;
  userId: string;
  ticketId?: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface OverviewStats {
  summary: {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    totalUsers: number;
    resolutionRate: number;
    avgResolutionHours: number;
  };
  byPriority: Array<{ priority: Priority; count: number }>;
  byCategory: Array<{ category: Category; count: number }>;
  recentActivity: Array<ActivityLog & { ticket?: { ticketNumber: number; title: string } }>;
}

export interface SimulatedEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
