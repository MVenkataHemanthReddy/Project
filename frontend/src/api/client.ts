import axios, { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { INITIAL_TICKETS, DEMO_USERS, INITIAL_NOTIFICATIONS, INITIAL_EMAILS } from './mockData';
import { Ticket, TicketStatus, User, Notification, SimulatedEmail } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('helpdesk_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Storage helpers for zero-friction client-side simulation on static hosting (GitHub Pages)
function getStoredTickets(): Ticket[] {
  const saved = localStorage.getItem('helpdesk_mock_tickets');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem('helpdesk_mock_tickets', JSON.stringify(INITIAL_TICKETS));
  return INITIAL_TICKETS;
}

function saveStoredTickets(tickets: Ticket[]) {
  localStorage.setItem('helpdesk_mock_tickets', JSON.stringify(tickets));
}

function getStoredNotifications(): Notification[] {
  const saved = localStorage.getItem('helpdesk_mock_notifs');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem('helpdesk_mock_notifs', JSON.stringify(INITIAL_NOTIFICATIONS));
  return INITIAL_NOTIFICATIONS;
}

function saveStoredNotifications(notifs: Notification[]) {
  localStorage.setItem('helpdesk_mock_notifs', JSON.stringify(notifs));
}

function getStoredEmails(): SimulatedEmail[] {
  const saved = localStorage.getItem('helpdesk_mock_emails');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem('helpdesk_mock_emails', JSON.stringify(INITIAL_EMAILS));
  return INITIAL_EMAILS;
}

function addSimulatedEmail(email: SimulatedEmail) {
  const list = getStoredEmails();
  list.unshift(email);
  localStorage.setItem('helpdesk_mock_emails', JSON.stringify(list));
}

// Universal Mock Engine Router
function handleMockRequest(config: InternalAxiosRequestConfig | any): { data: any; status: number } | null {
  const url = (config.url || '').replace(/^\/api/, '');
  const method = (config.method || 'get').toLowerCase();
  let tickets = getStoredTickets();
  const currentUser: User =
    JSON.parse(localStorage.getItem('helpdesk_user') || 'null') || DEMO_USERS.admin;

  let body: any = {};
  if (config.data) {
    try {
      body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    } catch {
      body = {};
    }
  }

  // 1. GET /auth/me
  if (url === '/auth/me' && method === 'get') {
    return { status: 200, data: { success: true, data: currentUser } };
  }

  // 2. POST /auth/login
  if (url === '/auth/login' && method === 'post') {
    const email = (body.email || '').toLowerCase().trim();
    let matchedUser = DEMO_USERS.admin;

    if (email.includes('john') || email.includes('user')) {
      matchedUser = DEMO_USERS.john;
    } else if (email.includes('alice')) {
      matchedUser = DEMO_USERS.alice;
    } else if (email.includes('admin')) {
      matchedUser = DEMO_USERS.admin;
    } else {
      matchedUser = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0] || 'Demo Customer',
        email: email || 'customer@example.com',
        role: 'USER',
      };
    }

    localStorage.setItem('helpdesk_token', 'mock-jwt-token-preview');
    localStorage.setItem('helpdesk_user', JSON.stringify(matchedUser));

    return {
      status: 200,
      data: {
        success: true,
        data: {
          user: matchedUser,
          token: 'mock-jwt-token-preview',
        },
      },
    };
  }

  // 3. POST /auth/register
  if (url === '/auth/register' && method === 'post') {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: body.name || 'New Member',
      email: body.email || 'user@example.com',
      role: body.role || 'USER',
    };
    localStorage.setItem('helpdesk_token', 'mock-jwt-token-preview');
    localStorage.setItem('helpdesk_user', JSON.stringify(newUser));

    return {
      status: 201,
      data: {
        success: true,
        data: {
          user: newUser,
          token: 'mock-jwt-token-preview',
        },
      },
    };
  }

  // 4. GET /tickets
  if (url === '/tickets' && method === 'get') {
    const params = config.params || {};
    let filtered = [...tickets];

    // Filter by role if customer
    if (currentUser.role !== 'ADMIN') {
      filtered = filtered.filter((t) => t.userId === currentUser.id);
    }

    // Filter by status
    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter((t) => t.status === params.status);
    }

    // Filter by priority
    if (params.priority && params.priority !== 'ALL') {
      filtered = filtered.filter((t) => t.priority === params.priority);
    }

    // Filter by category
    if (params.category && params.category !== 'ALL') {
      filtered = filtered.filter((t) => t.category === params.category);
    }

    // Search query
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          String(t.ticketNumber).includes(q)
      );
    }

    return {
      status: 200,
      data: {
        success: true,
        data: filtered,
        pagination: {
          page: 1,
          limit: 10,
          total: filtered.length,
          totalPages: Math.max(1, Math.ceil(filtered.length / 10)),
        },
      },
    };
  }

  // 5. GET /tickets/:id
  if (url.startsWith('/tickets/') && method === 'get' && !url.includes('/comments')) {
    const parts = url.split('/');
    const id = parts[2];
    const ticket = tickets.find((t) => t.id === id) || tickets[0];
    return { status: 200, data: { success: true, data: ticket } };
  }

  // 6. POST /tickets
  if (url === '/tickets' && method === 'post') {
    const newId = `ticket-${Date.now()}`;
    const newTicket: Ticket = {
      id: newId,
      ticketNumber: 1000 + tickets.length + 1,
      title: body.title || 'Untitled Ticket',
      description: body.description || '',
      category: body.category || 'GENERAL',
      priority: body.priority || 'MEDIUM',
      status: 'OPEN',
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: currentUser,
      comments: [],
      activityLogs: [
        {
          id: `act-${Date.now()}`,
          ticketId: newId,
          actorId: currentUser.id,
          action: 'TICKET_CREATED',
          details: `Ticket created by ${currentUser.name} (${currentUser.role})`,
          createdAt: new Date().toISOString(),
          actor: currentUser,
        },
      ],
      _count: { comments: 0, activityLogs: 1 },
    };

    tickets.unshift(newTicket);
    saveStoredTickets(tickets);

    // Event listener simulation: Outbound email notification
    addSimulatedEmail({
      id: `email-${Date.now()}`,
      to: 'support@helpdesk.com',
      subject: `[New Ticket #${newTicket.ticketNumber}] ${newTicket.title}`,
      body: `A new support request has been registered by ${currentUser.name} (${currentUser.email}):\n\n${newTicket.description}`,
      sentAt: new Date().toISOString(),
    });

    return { status: 201, data: { success: true, data: newTicket } };
  }

  // 7. PATCH /tickets/:id
  if (url.startsWith('/tickets/') && method === 'patch') {
    const parts = url.split('/');
    const id = parts[2];
    const idx = tickets.findIndex((t) => t.id === id);

    if (idx !== -1) {
      const oldStatus = tickets[idx].status;
      const oldPriority = tickets[idx].priority;

      tickets[idx] = {
        ...tickets[idx],
        ...body,
        updatedAt: new Date().toISOString(),
        resolvedAt: body.status === 'RESOLVED' ? new Date().toISOString() : tickets[idx].resolvedAt,
      };

      if (body.status && body.status !== oldStatus) {
        tickets[idx].activityLogs = [
          ...(tickets[idx].activityLogs || []),
          {
            id: `act-${Date.now()}`,
            ticketId: id,
            actorId: currentUser.id,
            action:
              body.status === 'RESOLVED'
                ? 'TICKET_RESOLVED'
                : body.status === 'CLOSED'
                ? 'TICKET_CLOSED'
                : 'STATUS_CHANGED',
            details: `Status transitioned from ${oldStatus} to ${body.status} by ${currentUser.name}`,
            createdAt: new Date().toISOString(),
            actor: currentUser,
          },
        ];

        addSimulatedEmail({
          id: `email-${Date.now()}`,
          to: tickets[idx].user?.email || 'customer@example.com',
          subject: `[Ticket #${tickets[idx].ticketNumber}] Status updated to ${body.status}`,
          body: `Hi ${tickets[idx].user?.name || 'Customer'},\n\nYour ticket status has been changed to ${body.status} by ${currentUser.name}.`,
          sentAt: new Date().toISOString(),
        });
      }

      if (body.priority && body.priority !== oldPriority) {
        tickets[idx].activityLogs = [
          ...(tickets[idx].activityLogs || []),
          {
            id: `act-${Date.now()}`,
            ticketId: id,
            actorId: currentUser.id,
            action: 'PRIORITY_CHANGED',
            details: `Priority altered from ${oldPriority} to ${body.priority} by ${currentUser.name}`,
            createdAt: new Date().toISOString(),
            actor: currentUser,
          },
        ];
      }

      saveStoredTickets(tickets);
      return { status: 200, data: { success: true, data: tickets[idx] } };
    }
  }

  // 8. POST /tickets/:id/comments
  if (url.includes('/comments') && method === 'post') {
    const parts = url.split('/');
    const id = parts[2];
    const idx = tickets.findIndex((t) => t.id === id);

    if (idx !== -1) {
      const newComment = {
        id: `comm-${Date.now()}`,
        content: body.content,
        ticketId: id,
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: currentUser,
      };

      tickets[idx].comments = [...(tickets[idx].comments || []), newComment];
      tickets[idx].activityLogs = [
        ...(tickets[idx].activityLogs || []),
        {
          id: `act-${Date.now()}`,
          ticketId: id,
          actorId: currentUser.id,
          action: 'COMMENT_ADDED',
          details: `New message posted by ${currentUser.name}`,
          createdAt: new Date().toISOString(),
          actor: currentUser,
        },
      ];
      saveStoredTickets(tickets);

      const recipient =
        currentUser.role === 'ADMIN'
          ? tickets[idx].user?.email || 'customer@example.com'
          : 'support@helpdesk.com';

      addSimulatedEmail({
        id: `email-${Date.now()}`,
        to: recipient,
        subject: `[Ticket #${tickets[idx].ticketNumber}] New response posted`,
        body: `${currentUser.name} posted a new response on ticket #${tickets[idx].ticketNumber}:\n\n${body.content}`,
        sentAt: new Date().toISOString(),
      });

      return { status: 201, data: { success: true, data: newComment } };
    }
  }

  // 9. GET /stats/overview
  if (url.includes('/stats/overview')) {
    const openCount = tickets.filter((t) => t.status === 'OPEN').length;
    const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
    const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED').length;
    const closedCount = tickets.filter((t) => t.status === 'CLOSED').length;
    const finishedCount = resolvedCount + closedCount;

    return {
      status: 200,
      data: {
        success: true,
        data: {
          summary: {
            totalTickets: tickets.length,
            openTickets: openCount,
            inProgressTickets: inProgressCount,
            resolvedTickets: resolvedCount,
            closedTickets: closedCount,
            totalUsers: 3,
            resolutionRate: tickets.length ? Math.round((finishedCount / tickets.length) * 100) : 100,
            avgResolutionHours: 2.4,
          },
          byPriority: [
            { priority: 'URGENT', count: tickets.filter((t) => t.priority === 'URGENT').length },
            { priority: 'HIGH', count: tickets.filter((t) => t.priority === 'HIGH').length },
            { priority: 'MEDIUM', count: tickets.filter((t) => t.priority === 'MEDIUM').length },
            { priority: 'LOW', count: tickets.filter((t) => t.priority === 'LOW').length },
          ],
          byCategory: [
            { category: 'TECHNICAL', count: tickets.filter((t) => t.category === 'TECHNICAL').length },
            { category: 'BILLING', count: tickets.filter((t) => t.category === 'BILLING').length },
            { category: 'ACCOUNT', count: tickets.filter((t) => t.category === 'ACCOUNT').length },
            {
              category: 'FEATURE_REQUEST',
              count: tickets.filter((t) => t.category === 'FEATURE_REQUEST').length,
            },
            { category: 'GENERAL', count: tickets.filter((t) => t.category === 'GENERAL').length },
          ],
          recentActivity: tickets
            .flatMap((t) => t.activityLogs || [])
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10),
        },
      },
    };
  }

  // 10. Notifications
  if (url === '/notifications' && method === 'get') {
    return { status: 200, data: { success: true, data: getStoredNotifications() } };
  }

  if (url === '/notifications/unread-count' && method === 'get') {
    const unread = getStoredNotifications().filter((n) => !n.isRead).length;
    return { status: 200, data: { success: true, data: { unreadCount: unread } } };
  }

  if (url.startsWith('/notifications/') && url.endsWith('/read') && method === 'patch') {
    const notifs = getStoredNotifications();
    const id = url.split('/')[2];
    const n = notifs.find((item) => item.id === id);
    if (n) n.isRead = true;
    saveStoredNotifications(notifs);
    return { status: 200, data: { success: true, data: n } };
  }

  if (url === '/notifications/read-all' && method === 'patch') {
    const notifs = getStoredNotifications().map((n) => ({ ...n, isRead: true }));
    saveStoredNotifications(notifs);
    return { status: 200, data: { success: true, message: 'All marked as read' } };
  }

  // 11. Simulator Outbox
  if (url === '/simulator/emails' && method === 'get') {
    return { status: 200, data: { success: true, data: getStoredEmails() } };
  }

  return null;
}

// Check if running on static hosting (GitHub Pages, etc.)
const isStaticHosting =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('github.io') ||
    window.location.hostname.includes('pages.dev') ||
    window.location.protocol === 'file:');

// Custom adapter that cleanly routes static hosting requests directly through mock engine
const defaultAdapter = axios.defaults.adapter;

api.defaults.adapter = async (config) => {
  if (isStaticHosting) {
    const mock = handleMockRequest(config);
    if (mock) {
      return {
        data: mock.data,
        status: mock.status,
        statusText: 'OK',
        headers: {},
        config,
      };
    }
  }

  try {
    // Normal request against local/production API server
    // @ts-ignore
    return await defaultAdapter(config);
  } catch (err: any) {
    // If backend is unreachable or returns 404/405/5xx, gracefully fallback
    const isOfflineOrUnsupported =
      !err.response ||
      err.code === 'ERR_NETWORK' ||
      err.response?.status === 404 ||
      err.response?.status === 405 ||
      err.response?.status >= 500;

    if (isOfflineOrUnsupported) {
      const mock = handleMockRequest(config);
      if (mock) {
        return {
          data: mock.data,
          status: mock.status,
          statusText: 'OK',
          headers: {},
          config,
        };
      }
    }
    throw err;
  }
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        localStorage.removeItem('helpdesk_token');
        localStorage.removeItem('helpdesk_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;