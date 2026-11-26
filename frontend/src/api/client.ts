import axios from 'axios';
import { INITIAL_TICKETS, DEMO_USERS } from './mockData';
import { Ticket, TicketStatus } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 4000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('helpdesk_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper for local mock storage in static environments
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If backend is unreachable (e.g. static GitHub Pages deployment), fall back to graceful mock engine
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.response?.status === 404;

    if (isNetworkError && error.config) {
      const url = error.config.url || '';
      const method = (error.config.method || 'get').toLowerCase();
      let tickets = getStoredTickets();
      const currentUser = JSON.parse(localStorage.getItem('helpdesk_user') || 'null') || DEMO_USERS.admin;

      // GET /auth/me
      if (url.includes('/auth/me')) {
        return { data: { success: true, data: currentUser } };
      }

      // POST /auth/login
      if (url.includes('/auth/login') && method === 'post') {
        const body = JSON.parse(error.config.data || '{}');
        const user = Object.values(DEMO_USERS).find((u) => u.email === body.email) || DEMO_USERS.admin;
        return {
          data: {
            success: true,
            data: { user, token: 'mock-jwt-token-preview' },
          },
        };
      }

      // GET /tickets
      if (url === '/tickets' && method === 'get') {
        const params = error.config.params || {};
        let filtered = [...tickets];
        if (currentUser.role !== 'ADMIN') {
          filtered = filtered.filter((t) => t.userId === currentUser.id);
        }
        if (params.status && params.status !== 'ALL') {
          filtered = filtered.filter((t) => t.status === params.status);
        }
        if (params.priority && params.priority !== 'ALL') {
          filtered = filtered.filter((t) => t.priority === params.priority);
        }
        if (params.category && params.category !== 'ALL') {
          filtered = filtered.filter((t) => t.category === params.category);
        }
        if (params.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(
            (t) => t.title.toLowerCase().includes(s) || t.description.toLowerCase().includes(s)
          );
        }
        return {
          data: {
            success: true,
            data: filtered,
            pagination: { page: 1, limit: 10, total: filtered.length, totalPages: 1 },
          },
        };
      }

      // GET /tickets/:id
      if (url.startsWith('/tickets/') && method === 'get' && !url.includes('/comments')) {
        const id = url.split('/')[2];
        const t = tickets.find((item) => item.id === id) || tickets[0];
        return { data: { success: true, data: t } };
      }

      // POST /tickets
      if (url === '/tickets' && method === 'post') {
        const body = JSON.parse(error.config.data || '{}');
        const newTicket: Ticket = {
          id: `ticket-${Date.now()}`,
          ticketNumber: 1000 + tickets.length + 1,
          title: body.title,
          description: body.description,
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
              ticketId: `ticket-${Date.now()}`,
              actorId: currentUser.id,
              action: 'TICKET_CREATED',
              details: `Ticket created by ${currentUser.name}`,
              createdAt: new Date().toISOString(),
            },
          ],
        };
        tickets.unshift(newTicket);
        saveStoredTickets(tickets);
        return { data: { success: true, data: newTicket } };
      }

      // PATCH /tickets/:id
      if (url.startsWith('/tickets/') && method === 'patch') {
        const id = url.split('/')[2];
        const body = JSON.parse(error.config.data || '{}');
        const idx = tickets.findIndex((t) => t.id === id);
        if (idx !== -1) {
          tickets[idx] = {
            ...tickets[idx],
            ...body,
            updatedAt: new Date().toISOString(),
            resolvedAt: body.status === 'RESOLVED' ? new Date().toISOString() : tickets[idx].resolvedAt,
          };
          saveStoredTickets(tickets);
          return { data: { success: true, data: tickets[idx] } };
        }
      }

      // POST /tickets/:id/comments
      if (url.includes('/comments') && method === 'post') {
        const id = url.split('/')[2];
        const body = JSON.parse(error.config.data || '{}');
        const idx = tickets.findIndex((t) => t.id === id);
        if (idx !== -1) {
          const newComm = {
            id: `comm-${Date.now()}`,
            content: body.content,
            ticketId: id,
            userId: currentUser.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: currentUser,
          };
          tickets[idx].comments = [...(tickets[idx].comments || []), newComm];
          saveStoredTickets(tickets);
          return { data: { success: true, data: newComm } };
        }
      }

      // GET /stats/overview
      if (url.includes('/stats/overview')) {
        return {
          data: {
            success: true,
            data: {
              summary: {
                totalTickets: tickets.length,
                openTickets: tickets.filter((t) => t.status === 'OPEN').length,
                inProgressTickets: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
                resolvedTickets: tickets.filter((t) => t.status === 'RESOLVED').length,
                closedTickets: tickets.filter((t) => t.status === 'CLOSED').length,
                totalUsers: 3,
                resolutionRate: Math.round(
                  (tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length /
                    (tickets.length || 1)) *
                    100
                ),
                avgResolutionHours: 2.5,
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
                { category: 'FEATURE_REQUEST', count: tickets.filter((t) => t.category === 'FEATURE_REQUEST').length },
              ],
              recentActivity: [
                {
                  id: 'act-demo-1',
                  action: 'TICKET_CREATED',
                  details: 'New inquiry submitted by customer',
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          },
        };
      }

      // GET /notifications
      if (url === '/notifications') {
        return { data: { success: true, data: [] } };
      }
      if (url === '/notifications/unread-count') {
        return { data: { success: true, data: { unreadCount: 0 } } };
      }
      if (url === '/simulator/emails') {
        return { data: { success: true, data: [] } };
      }
    }

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
