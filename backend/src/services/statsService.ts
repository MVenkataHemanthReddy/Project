import { prisma } from '../config/db';
import { TicketStatus } from '../types';

export class StatsService {
  static async getOverviewStats() {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      totalUsers,
      ticketsByPriority,
      ticketsByCategory,
      recentActivity,
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: TicketStatus.OPEN } }),
      prisma.ticket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      prisma.ticket.count({ where: { status: TicketStatus.RESOLVED } }),
      prisma.ticket.count({ where: { status: TicketStatus.CLOSED } }),
      prisma.user.count(),
      prisma.ticket.groupBy({
        by: ['priority'],
        _count: { priority: true },
      }),
      prisma.ticket.groupBy({
        by: ['category'],
        _count: { category: true },
      }),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          ticket: { select: { ticketNumber: true, title: true } },
          actor: { select: { name: true, role: true } },
        },
      }),
    ]);

    // Calculate resolution rate
    const closedOrResolved = resolvedTickets + closedTickets;
    const resolutionRate = totalTickets > 0 ? Math.round((closedOrResolved / totalTickets) * 100) : 0;

    // Calculate average resolution time for resolved tickets
    const resolvedWithDates = await prisma.ticket.findMany({
      where: {
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let avgResolutionHours = 0;
    if (resolvedWithDates.length > 0) {
      const totalMillis = resolvedWithDates.reduce((acc, curr) => {
        if (curr.resolvedAt) {
          return acc + (curr.resolvedAt.getTime() - curr.createdAt.getTime());
        }
        return acc;
      }, 0);
      avgResolutionHours = Math.round((totalMillis / resolvedWithDates.length / (1000 * 60 * 60)) * 10) / 10;
    }

    return {
      summary: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        totalUsers,
        resolutionRate,
        avgResolutionHours,
      },
      byPriority: ticketsByPriority.map((item) => ({
        priority: item.priority,
        count: item._count.priority,
      })),
      byCategory: ticketsByCategory.map((item) => ({
        category: item.category,
        count: item._count.category,
      })),
      recentActivity,
    };
  }
}
