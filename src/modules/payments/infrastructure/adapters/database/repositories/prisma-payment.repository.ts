import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/persistence/prisma/prisma.service';
import { Payment } from 'src/modules/payments/domain/entities/payment.entity';
import { PaymentRepositoryPort } from 'src/modules/payments/domain/ports/payment-repository.port';
import { PaymentMapper } from '../mappers/payment.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaPaymentRepository implements PaymentRepositoryPort {
  private readonly prisma;

  constructor(private readonly prismaService: PrismaService) {
    this.prisma = prismaService.getPrismaClient();
  }

  async create(payment: Payment): Promise<Payment> {
    const prismaPayment = await this.prisma.payments.create({
      data: {
        ...PaymentMapper.toPersistence(payment),
        receivable: { connect: { id: payment.idReceivable } },
      },
    });
    return PaymentMapper.toDomain(prismaPayment);
  }

  async findOne(where: Prisma.PaymentsWhereInput): Promise<Payment | null> {
    const prismaPayment = await this.prisma.payments.findFirst({ where });
    return prismaPayment ? PaymentMapper.toDomain(prismaPayment) : null;
  }

  async findAll(where?: Prisma.PaymentsWhereInput): Promise<Payment[]> {
    const prismaPayments = await this.prisma.payments.findMany({ where });
    return prismaPayments.map(PaymentMapper.toDomain);
  }

  async update(id: string, data: Partial<Payment>): Promise<Payment> {
    const prismaPayment = await this.prisma.payments.update({
      where: { id },
      data: {
        ...PaymentMapper.toPersistence(data as Payment),
        receivable: data.idReceivable ? { connect: { id: data.idReceivable } } : undefined, 
      },
    });
    return PaymentMapper.toDomain(prismaPayment);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.payments.delete({ where: { id } });
  }
}
