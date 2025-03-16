import { Module } from '@nestjs/common';
import { PrismaReceivableRepository } from './infrastructure/adapters/database/repositories/prisma-receivable.repository';
import { CreateReceivableUseCase } from './application/use-cases/create-receivable.use-case';
import { UpdateReceivableUseCase } from './application/use-cases/update-receivable.use-case';
import { DeleteReceivableUseCase } from './application/use-cases/delete-receivable.use-case';
import { FindReceivableByIdUseCase } from './application/use-cases/find-receivable-by-id.use-case';
import { FindAllReceivablesUseCase } from './application/use-cases/find-all-receivables.use-case';
import { CreateReceivableHandler } from './infrastructure/controllers/handlers/create-receivable.handler';
import { UpdateReceivableHandler } from './infrastructure/controllers/handlers/update-receivable.handler';
import { DeleteReceivableHandler } from './infrastructure/controllers/handlers/delete-receivable.handler';
import { FindReceivableByIdHandler } from './infrastructure/controllers/handlers/find-receivable-by-id.handler';
import { FindAllReceivablesHandler } from './infrastructure/controllers/handlers/find-all-receivables.handler';

@Module({
  providers: [
    {
      provide: 'ReceivableRepositoryPort',
      useClass: PrismaReceivableRepository,
    },
    PrismaReceivableRepository,
    CreateReceivableUseCase,
    UpdateReceivableUseCase,
    DeleteReceivableUseCase,
    FindReceivableByIdUseCase,
    FindAllReceivablesUseCase,
  ],
  controllers: [
    CreateReceivableHandler,
    UpdateReceivableHandler,
    DeleteReceivableHandler,
    FindReceivableByIdHandler,
    FindAllReceivablesHandler,
  ],
  exports: [PrismaReceivableRepository],
})
export class ReceivableModule {}
