import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/db';

const app = createApp();

describe('Tickets API & RBAC Integration Tests', () => {
  let userToken: string;
  let adminToken: string;
  let createdTicketId: string;

  beforeAll(async () => {
    // Login seed user
    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'user123' });
    userToken = userRes.body.data.token;

    // Login seed admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@helpdesk.com', password: 'admin123' });
    adminToken = adminRes.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/tickets should allow a user to create a ticket', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Integration Test Ticket for CI/CD',
        description: 'Detailed description explaining the issue in full depth for test validation.',
        category: 'TECHNICAL',
        priority: 'HIGH',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Integration Test Ticket for CI/CD');
    expect(res.body.data.status).toBe('OPEN');
    createdTicketId = res.body.data.id;
  });

  it('GET /api/tickets should return tickets list scoped to user', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('POST /api/tickets/:id/comments should add a comment to the ticket', async () => {
    const res = await request(app)
      .post(`/api/tickets/${createdTicketId}/comments`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        content: 'This is an automated test comment verifying comment threads.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toContain('automated test comment');
  });

  it('PATCH /api/tickets/:id should allow admin to update ticket status', async () => {
    const res = await request(app)
      .patch(`/api/tickets/${createdTicketId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'RESOLVED',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('RESOLVED');
  });

  it('GET /api/stats/overview should allow admin but block standard user', async () => {
    // User attempt (should be 403 Forbidden)
    const userAttempt = await request(app)
      .get('/api/stats/overview')
      .set('Authorization', `Bearer ${userToken}`);
    expect(userAttempt.status).toBe(403);

    // Admin attempt (should be 200 OK)
    const adminAttempt = await request(app)
      .get('/api/stats/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminAttempt.status).toBe(200);
    expect(adminAttempt.body.data.summary).toBeDefined();
  });
});
