import { prisma } from "@repo/db";

class DashboardService {
  async getStats(companyId: number): Promise<any> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // groupBy is not covered by the soft-delete extension — add deletedAt: null explicitly
    const [
      totalLeads,
      activeLeads,
      inactiveLeads,
      leadsByStatus,
      leadsByPriority,
      totalClients,
      openTickets,
      msgs7days,
      msgs30days,
      recentActivity,
    ] = await Promise.all([
      prisma.lead.count({ where: { companyId } }),
      prisma.lead.count({ where: { companyId, isActive: true } }),
      prisma.lead.count({ where: { companyId, isActive: false } }),

      prisma.lead.groupBy({
        by: ["status"],
        where: { companyId, deletedAt: null },
        _count: { _all: true },
      }),

      prisma.lead.groupBy({
        by: ["priority"],
        where: { companyId, deletedAt: null },
        _count: { _all: true },
      }),

      prisma.client.count({ where: { companyId } }),

      prisma.ticket.count({ where: { companyId, status: "open" } }),

      prisma.message.groupBy({
        by: ["channel", "direction"],
        where: { companyId, createdAt: { gte: sevenDaysAgo } },
        _count: { _all: true },
      }),

      prisma.message.groupBy({
        by: ["channel", "direction"],
        where: { companyId, createdAt: { gte: thirtyDaysAgo } },
        _count: { _all: true },
      }),

      prisma.message.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          direction: true,
          channel: true,
          sender: true,
          recipient: true,
          subject: true,
          body: true,
          status: true,
          createdAt: true,
          lead: { select: { id: true, name: true } },
          ticket: { select: { id: true, customerNum: true } },
        },
      }),
    ]);

    const sumChannel = (rows: typeof msgs7days, dir: string) =>
      rows.filter((r) => r.direction === dir).reduce((s, r) => s + r._count._all, 0);

    return {
      leads: {
        total: totalLeads,
        active: activeLeads,
        inactive: inactiveLeads,
        byStatus: leadsByStatus.map((g) => ({ status: g.status, count: g._count._all })),
        byPriority: leadsByPriority.map((g) => ({ priority: g.priority, count: g._count._all })),
      },
      clients: { total: totalClients },
      tickets: { open: openTickets },
      messages: {
        last7Days: {
          sent: sumChannel(msgs7days, "outbound"),
          received: sumChannel(msgs7days, "inbound"),
          byChannel: msgs7days.map((m) => ({ channel: m.channel, direction: m.direction, count: m._count._all })),
        },
        last30Days: {
          sent: sumChannel(msgs30days, "outbound"),
          received: sumChannel(msgs30days, "inbound"),
          byChannel: msgs30days.map((m) => ({ channel: m.channel, direction: m.direction, count: m._count._all })),
        },
      },
      recentActivity,
    };
  }

  async getPipeline(companyId: number): Promise<any> {
    const [byStatus, byOriginChannel] = await Promise.all([
      prisma.lead.groupBy({
        by: ["status"],
        where: { companyId, deletedAt: null },
        _count: { _all: true },
      }),

      prisma.lead.groupBy({
        by: ["originChannel"],
        where: { companyId, deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    return {
      byStatus: byStatus.map((g) => ({ status: g.status, count: g._count._all })),
      byOriginChannel: byOriginChannel.map((g) => ({ channel: g.originChannel, count: g._count._all })),
    };
  }
}

export const dashboardService = new DashboardService();
