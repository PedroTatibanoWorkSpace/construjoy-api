import { Module } from '@nestjs/common';
import { PrismaPaymentRepository } from './infrastructure/adapters/database/repositories/prisma-payment.repository';
import { CreatePaymentUseCase } from './application/use-cases/create-payment.use-case';
import { UpdatePaymentUseCase } from './application/use-cases/update-payment.use-case';
import { DeletePaymentUseCase } from './application/use-cases/delete-payment.use-case';
import { FindPaymentByIdUseCase } from './application/use-cases/find-payment-by-id.use-case';
import { FindAllPaymentsUseCase } from './application/use-cases/find-all-payments.use-case';
import { CreatePaymentHandler } from './infrastructure/controllers/handlers/create-payment.handler';
import { UpdatePaymentHandler } from './infrastructure/controllers/handlers/update-payment.handler';
import { DeletePaymentHandler } from './infrastructure/controllers/handlers/delete-payment.handler';
import { FindPaymentByIdHandler } from './infrastructure/controllers/handlers/find-payment-by-id.handler';
import { FindAllPaymentsHandler } from './infrastructure/controllers/handlers/find-all-payments.handler';

@Module({
  providers: [
    {
      provide: 'PaymentRepositoryPort',
      useClass: PrismaPaymentRepository,
    },
    PrismaPaymentRepository,
    CreatePaymentUseCase,
    UpdatePaymentUseCase,
    DeletePaymentUseCase,
    FindPaymentByIdUseCase,
    FindAllPaymentsUseCase,
  ],
  controllers: [
    CreatePaymentHandler,
    UpdatePaymentHandler,
    DeletePaymentHandler,
    FindPaymentByIdHandler,
    FindAllPaymentsHandler,
  ],
  exports: [PrismaPaymentRepository],
})
export class PaymentModule {}
