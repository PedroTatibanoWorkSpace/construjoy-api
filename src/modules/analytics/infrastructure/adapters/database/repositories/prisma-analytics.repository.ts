import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/persistence/prisma/prisma.service';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaAnalyticsRepository {
  private readonly prisma: PrismaClient;

  constructor(private readonly prismaService: PrismaService) {
    this.prisma = prismaService.getPrismaClient();
  }

  async getFinancialSummary(startDate?: string, endDate?: string) {
    const where: Prisma.AccountsReceivableWhereInput = { status: 'Active' };
    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) where.purchaseDate.gte = new Date(startDate);
      if (endDate) where.purchaseDate.lte = new Date(endDate);
    }

    const all = await this.prisma.accountsReceivable.aggregate({
      where,
      _sum: { value: true },
      _count: true,
    });

    const byStatus = await this.prisma.accountsReceivable.groupBy({
      by: ['paymentStatus'],
      where,
      _sum: { value: true },
      _count: true,
    });

    const totalValue = all._sum.value || 0;
    const totalCount = all._count || 0;

    const statusMap: Record<string, { total: number; count: number }> = {};
    for (const item of byStatus) {
      statusMap[item.paymentStatus] = {
        total: item._sum.value || 0,
        count: item._count || 0,
      };
    }

    const paidTotal = statusMap['Pago']?.total || 0;
    const pendingTotal = statusMap['Pendente']?.total || 0;
    const overdueTotal = statusMap['Atrasado']?.total || 0;

    const collectionRate = totalValue > 0 ? (paidTotal / totalValue) * 100 : 0;

    return {
      totalReceivables: totalValue,
      totalPaid: paidTotal,
      totalPending: pendingTotal,
      totalOverdue: overdueTotal,
      totalCount,
      collectionRate: Math.round(collectionRate * 100) / 100,
    };
  }

  async getReceivablesByMonth(startDate?: string, endDate?: string) {
    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = `AND "purchaseDate" >= $1 AND "purchaseDate" <= $2`;
      params.push(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      dateFilter = `AND "purchaseDate" >= $1`;
      params.push(new Date(startDate));
    } else if (endDate) {
      dateFilter = `AND "purchaseDate" <= $1`;
      params.push(new Date(endDate));
    }

    const result = await this.prisma.$queryRawUnsafe<
      Array<{ month: Date; status: string; total: number; count: bigint }>
    >(
      `SELECT
        DATE_TRUNC('month', "purchaseDate") as month,
        "paymentStatus" as status,
        COALESCE(SUM(value), 0) as total,
        COUNT(*) as count
      FROM "AccountsReceivable"
      WHERE status = 'Active' ${dateFilter}
      GROUP BY DATE_TRUNC('month', "purchaseDate"), "paymentStatus"
      ORDER BY month ASC`,
      ...params,
    );

    return result.map((row) => ({
      month: row.month,
      status: row.status,
      total: Number(row.total),
      count: Number(row.count),
    }));
  }

  async getReceivablesByStatus() {
    const result = await this.prisma.accountsReceivable.groupBy({
      by: ['paymentStatus'],
      where: { status: 'Active' },
      _sum: { value: true },
      _count: true,
    });

    return result.map((item) => ({
      status: item.paymentStatus,
      total: item._sum.value || 0,
      count: item._count || 0,
    }));
  }

  async getTopClients(limit: number = 10) {
    const result = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; name: string; document: string; total_debt: number; overdue_count: bigint; pending_count: bigint }>
    >(
      `SELECT
        c.id,
        c.name,
        c.document,
        COALESCE(SUM(ar.value), 0) as total_debt,
        COUNT(CASE WHEN ar."paymentStatus" = 'Atrasado' THEN 1 END) as overdue_count,
        COUNT(CASE WHEN ar."paymentStatus" = 'Pendente' THEN 1 END) as pending_count
      FROM "Clients" c
      INNER JOIN "AccountsReceivable" ar ON ar.id_client = c.id
      WHERE ar.status = 'Active' AND ar."paymentStatus" != 'Pago' AND c.status = 'Active'
      GROUP BY c.id, c.name, c.document
      ORDER BY total_debt DESC
      LIMIT $1`,
      limit,
    );

    return result.map((row) => ({
      id: row.id,
      name: row.name,
      document: row.document,
      totalDebt: Number(row.total_debt),
      overdueCount: Number(row.overdue_count),
      pendingCount: Number(row.pending_count),
    }));
  }

  async getOverdueAging() {
    const result = await this.prisma.$queryRawUnsafe<
      Array<{ range: string; count: bigint; total: number }>
    >(
      `SELECT
        CASE
          WHEN EXTRACT(DAY FROM NOW() - validate) BETWEEN 1 AND 30 THEN '1-30'
          WHEN EXTRACT(DAY FROM NOW() - validate) BETWEEN 31 AND 60 THEN '31-60'
          WHEN EXTRACT(DAY FROM NOW() - validate) BETWEEN 61 AND 90 THEN '61-90'
          ELSE '90+'
        END as range,
        COUNT(*) as count,
        COALESCE(SUM(value), 0) as total
      FROM "AccountsReceivable"
      WHERE status = 'Active' AND "paymentStatus" = 'Atrasado'
      GROUP BY range
      ORDER BY range ASC`,
    );

    const ranges = ['1-30', '31-60', '61-90', '90+'];
    return ranges.map((range) => {
      const found = result.find((r) => r.range === range);
      return {
        range,
        count: found ? Number(found.count) : 0,
        total: found ? Number(found.total) : 0,
      };
    });
  }

  async getMonthlyRevenue(startDate?: string, endDate?: string) {
    let dateFilter = '';
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = `AND "createdAt" >= $1 AND "createdAt" <= $2`;
      params.push(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      dateFilter = `AND "createdAt" >= $1`;
      params.push(new Date(startDate));
    } else if (endDate) {
      dateFilter = `AND "createdAt" <= $1`;
      params.push(new Date(endDate));
    }

    const result = await this.prisma.$queryRawUnsafe<
      Array<{ month: Date; total: number; count: bigint }>
    >(
      `SELECT
        DATE_TRUNC('month', "createdAt") as month,
        COALESCE(SUM(value), 0) as total,
        COUNT(*) as count
      FROM "Payments"
      WHERE status = 'Active' ${dateFilter}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month ASC`,
      ...params,
    );

    return result.map((row) => ({
      month: row.month,
      total: Number(row.total),
      count: Number(row.count),
    }));
  }

  async getRiskDistribution() {
    const result = await this.prisma.$queryRawUnsafe<
      Array<{ level: string; count: bigint; total_open: number }>
    >(
      `SELECT
        COALESCE(c."riskLevel", 'Sem score') as level,
        COUNT(DISTINCT c.id) as count,
        COALESCE(SUM(ar.value), 0) as total_open
      FROM "Clients" c
      LEFT JOIN "AccountsReceivable" ar
        ON ar.id_client = c.id
        AND ar.status = 'Active'
        AND ar."paymentStatus" IN ('Pendente', 'Atrasado')
      WHERE c.status = 'Active'
      GROUP BY COALESCE(c."riskLevel", 'Sem score')
      ORDER BY level ASC`,
    );

    return result.map((row) => ({
      level: row.level,
      count: Number(row.count),
      totalOpen: Number(row.total_open),
    }));
  }
}
