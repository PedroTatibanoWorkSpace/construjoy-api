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
      prismaPayment.internal_id ?? undefined,
      prismaPayment.updateAt ?? undefined,
    );
  }

  static toPersistence(payment: Payment): PrismaPayment {

    const persistence: Partial<PrismaPayment> = { id: payment.id,
      value: payment.value,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      createdAt: payment.createdAt,
      internal_id: payment.internalId ?? null,
      updateAt: payment.updatedAt ?? null
    }

    if (payment.internalId !== undefined) {
      persistence.internal_id = payment.internalId;
    }
    
    return persistence as PrismaPayment;

  }
}
