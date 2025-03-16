import { Payments as PrismaPayment, Status } from '@prisma/client';
import { Payment } from 'src/modules/payments/domain/entities/payment.entity';

export class PaymentMapper {
  static toDomain(prismaPayment: PrismaPayment): Payment {
    return new Payment(
      prismaPayment.id,
      prismaPayment.id_receivable,
      prismaPayment.value,
      prismaPayment.paymentMethod,
      prismaPayment.status as Status,
      prismaPayment.createdAt,
      prismaPayment.updateAt,
    );
  }

  static toPersistence(payment: Payment): PrismaPayment {
    return {
      id: payment.id,
      id_receivable: payment.idReceivable,
      value: payment.value,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      createdAt: payment.createdAt,
      updateAt: payment.updatedAt ?? new Date(),
    };
  }
}
