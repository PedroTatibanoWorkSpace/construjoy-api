import { Module } from '@nestjs/common';
import { PrismaAnalyticsRepository } from './infrastructure/adapters/database/repositories/prisma-analytics.repository';
import { GetFinancialSummaryUseCase } from './application/use-cases/get-financial-summary.use-case';
import { GetReceivablesByMonthUseCase } from './application/use-cases/get-receivables-by-month.use-case';
import { GetReceivablesByStatusUseCase } from './application/use-cases/get-receivables-by-status.use-case';
import { GetTopClientsUseCase } from './application/use-cases/get-top-clients.use-case';
import { GetOverdueAgingUseCase } from './application/use-cases/get-overdue-aging.use-case';
import { GetMonthlyRevenueUseCase } from './application/use-cases/get-monthly-revenue.use-case';
import { GetFinancialSummaryHandler } from './infrastructure/controllers/handlers/get-financial-summary.handler';
import { GetReceivablesByMonthHandler } from './infrastructure/controllers/handlers/get-receivables-by-month.handler';
import { GetReceivablesByStatusHandler } from './infrastructure/controllers/handlers/get-receivables-by-status.handler';
import { GetTopClientsHandler } from './infrastructure/controllers/handlers/get-top-clients.handler';
import { GetOverdueAgingHandler } from './infrastructure/controllers/handlers/get-overdue-aging.handler';
import { GetRiskDistributionUseCase } from './application/use-cases/get-risk-distribution.use-case';
import { GetRiskDistributionHandler } from './infrastructure/controllers/handlers/get-risk-distribution.handler';
import { GetMonthlyRevenueHandler } from './infrastructure/controllers/handlers/get-monthly-revenue.handler';

@Module({
  providers: [
    PrismaAnalyticsRepository,
    GetFinancialSummaryUseCase,
    GetReceivablesByMonthUseCase,
    GetReceivablesByStatusUseCase,
    GetTopClientsUseCase,
    GetOverdueAgingUseCase,
    GetMonthlyRevenueUseCase,
    GetRiskDistributionUseCase,
  ],
  controllers: [
    GetFinancialSummaryHandler,
    GetReceivablesByMonthHandler,
    GetReceivablesByStatusHandler,
    GetTopClientsHandler,
    GetOverdueAgingHandler,
    GetMonthlyRevenueHandler,
    GetRiskDistributionHandler,
  ],
})
export class AnalyticsModule {}
