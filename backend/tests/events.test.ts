import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/db';
import { simulatedEmailOutbox } from '../src/events/listeners/emailNotifierListener';

const app = createApp();

describe('Event-Driven Architecture & Action Handlers Tests', () => {
  let userToken: string;
  let adminToken: string;
  let testTicketId: string;

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'user123' });
    userToken = userRes.body.data.token;

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@helpdesk.com', password: 'admin123' });
    adminToken = adminRes.body.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Creating a ticket fires TICKET_CREATED event, writing an ActivityLog and sending notification', async () => {
    const initialEmailCount = simulatedEmailOutbox.length;

    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Event test ticket - checking event emitter',
        description: 'Verifying that events trigger activity log creation and notifications.',
        category: 'FEATURE_REQUEST',
        priority: 'LOW',
      });

    expect(res.status).toBe(201);
    testTicketId = res.body.data.id;

    // Small delay to allow async event loop to process listeners
    await new Promise((r) => setTimeout(r, 200));

    // 1. Check ActivityLog was created
    const activityLogs = await prisma.activityLog.findMany({
      where: { ticketId: testTicketId },
    });
    expect(activityLogs.length).toBeGreaterThan(0);
    expect(activityLogs[0].action).toBe('TICKET_CREATED');

    // 2. Check Simulated Email was dispatched
    expect(simulatedEmailOutbox.length).toBeGreaterThan(initialEmailCount);
  });

  it('Changing status triggers STATUS_CHANGED event, creating log & in-app notification', async () => {
    const res = await request(app)
      .patch(`/api/tickets/${testTicketId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);

    await new Promise((r) => setTimeout(r, 200));

    // Verify activity log captured status change
    const logs = await prisma.activityLog.findMany({
      where: { ticketId: testTicketId, action: 'STATUS_CHANGED' },
    });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].details).toContain('IN_PROGRESS');

    // Verify in-app notification was delivered
    const notifications = await prisma.notification.findMany({
      where: { ticketId: testTicketId, type: 'STATUS_CHANGED' },
    });
    expect(notifications.length).toBeGreaterThan(0);
  });

  it('Resolving ticket triggers TICKET_RESOLVED event and timestamps resolvedAt', async () => {
    const res = await request(app)
      .patch(`/api/tickets/${testTicketId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(200);
    expect(res.body.data.resolvedAt).toBeDefined();

    await new Promise((r) => setTimeout(r, 200));

    const resolvedLogs = await prisma.activityLog.findMany({
      where: { ticketId: testTicketId, action: 'TICKET_RESOLVED' },
    });
    expect(resolvedLogs.length).toBeGreaterThan(0);
  });
});
