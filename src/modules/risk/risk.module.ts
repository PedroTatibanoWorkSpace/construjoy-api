import { Module } from '@nestjs/common';
import { PrismaClientRepository } from '../clients/infrastructure/adapters/database/repositories/prisma-client.repository';
import { PrismaReceivableRepository } from '../receivables/infrastructure/adapters/database/repositories/prisma-receivable.repository';
import { HttpRiskScoringAdapter } from './infrastructure/adapters/http/http-risk-scoring.adapter';
import { RefreshClientRiskUseCase } from './application/use-cases/refresh-client-risk.use-case';
import { RefreshAllRisksUseCase } from './application/use-cases/refresh-all-risks.use-case';
import { CheckCreditUseCase } from './application/use-cases/check-credit.use-case';
import { RefreshAllRisksHandler } from './infrastructure/controllers/handlers/refresh-all-risks.handler';
import { RefreshClientRiskHandler } from './infrastructure/controllers/handlers/refresh-client-risk.handler';
import { CheckCreditHandler } from './infrastructure/controllers/handlers/check-credit.handler';

@Module({
  providers: [
    {
      provide: 'ClientRepositoryPort',
      useClass: PrismaClientRepository,
    },
    {
      provide: 'ReceivableRepositoryPort',
      useClass: PrismaReceivableRepository,
    },
    {
      provide: 'RiskScoringPort',
      useClass: HttpRiskScoringAdapter,
    },
    RefreshClientRiskUseCase,
    RefreshAllRisksUseCase,
    CheckCreditUseCase,
  ],
  controllers: [
    RefreshAllRisksHandler,
    RefreshClientRiskHandler,
    CheckCreditHandler,
  ],
})
export class RiskModule {}
