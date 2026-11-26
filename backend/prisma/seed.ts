import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seeding...');

  // Clean existing records
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('admin123', saltRounds);
  const userPassword = await bcrypt.hash('user123', saltRounds);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Connor (Lead Admin)',
      email: 'admin@helpdesk.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // 2. Create Standard Users
  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: userPassword,
      role: 'USER',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Alice Smith',
      email: 'alice@example.com',
      password: userPassword,
      role: 'USER',
    },
  });

  console.log('[Seed] Users seeded successfully:');
  console.log(` - Admin: ${admin.email} (password: admin123)`);
  console.log(` - User 1: ${user1.email} (password: user123)`);
  console.log(` - User 2: ${user2.email} (password: user123)`);

  // 3. Create Sample Tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 1001,
      title: 'Payment processed twice for subscription renewal',
      description: 'I noticed two identical charges of $49.00 on my credit card statement dated Nov 24. Please investigate and issue a refund for the duplicate transaction.',
      category: 'BILLING',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      userId: user1.id,
      assignedToId: admin.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      ticketNumber: 1002,
      title: 'Unable to connect to WebSocket in EU-Central region',
      description: 'Our backend cluster in Frankfurt is intermittently experiencing connection resets when dialing wss://stream.api.internal:8443. Ping spikes to >450ms.',
      category: 'TECHNICAL',
      priority: 'URGENT',
      status: 'OPEN',
      userId: user2.id,
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      ticketNumber: 1003,
      title: 'Enable Multi-Factor Authentication (MFA) reset request',
      description: 'I recently upgraded to a new smartphone and lost access to my Google Authenticator seed. Need an admin to reset my MFA device.',
      category: 'ACCOUNT',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      resolvedAt: new Date(),
      userId: user1.id,
      assignedToId: admin.id,
    },
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      ticketNumber: 1004,
      title: 'Request: Dark mode theme support for analytics dashboard',
      description: 'Would love to see an OLED black or dark theme option for the data reporting pages. Working late nights strains the eyes.',
      category: 'FEATURE_REQUEST',
      priority: 'LOW',
      status: 'OPEN',
      userId: user2.id,
    },
  });

  // 4. Create Comments
  await prisma.comment.createMany({
    data: [
      {
        ticketId: ticket1.id,
        userId: admin.id,
        content: 'Hi John, thank you for reaching out. We have located the duplicate charge in our Stripe ledger and have initiated a void. It will reflect on your bank within 2-3 business days.',
      },
      {
        ticketId: ticket1.id,
        userId: user1.id,
        content: 'Awesome, thanks for the quick turnaround Sarah!',
      },
      {
        ticketId: ticket3.id,
        userId: admin.id,
        content: 'Identity verified via secondary contact. MFA has been reset. Please log in and scan the new QR code.',
      },
    ],
  });

  // 5. Create Activity Logs (Event History)
  await prisma.activityLog.createMany({
    data: [
      {
        ticketId: ticket1.id,
        actorId: user1.id,
        action: 'TICKET_CREATED',
        details: 'Ticket #1001 created by John Doe (USER)',
        metadata: JSON.stringify({ priority: 'HIGH', category: 'BILLING' }),
      },
      {
        ticketId: ticket1.id,
        actorId: admin.id,
        action: 'STATUS_CHANGED',
        details: 'Status changed from OPEN to IN_PROGRESS by Sarah Connor',
        metadata: JSON.stringify({ from: 'OPEN', to: 'IN_PROGRESS' }),
      },
      {
        ticketId: ticket3.id,
        actorId: admin.id,
        action: 'STATUS_CHANGED',
        details: 'Status changed from IN_PROGRESS to RESOLVED by Sarah Connor',
        metadata: JSON.stringify({ from: 'IN_PROGRESS', to: 'RESOLVED' }),
      },
      {
        ticketId: ticket3.id,
        actorId: admin.id,
        action: 'TICKET_RESOLVED',
        details: 'Ticket #1003 marked as RESOLVED by Sarah Connor',
        metadata: JSON.stringify({ resolvedAt: new Date() }),
      },
    ],
  });

  // 6. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        ticketId: ticket2.id,
        type: 'TICKET_CREATED',
        title: 'New Urgent Ticket #1002',
        message: 'Alice Smith submitted: "Unable to connect to WebSocket in EU-Central region"',
        isRead: false,
      },
      {
        userId: user1.id,
        ticketId: ticket1.id,
        type: 'STATUS_CHANGED',
        title: 'Ticket #1001 Status Update',
        message: 'Your ticket status changed to IN_PROGRESS by Sarah Connor (Lead Admin).',
        isRead: true,
      },
      {
        userId: user1.id,
        ticketId: ticket3.id,
        type: 'TICKET_RESOLVED',
        title: 'Ticket #1003 Resolved 🎉',
        message: 'Your ticket has been marked as resolved.',
        isRead: false,
      },
    ],
  });

  console.log('[Seed] Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
