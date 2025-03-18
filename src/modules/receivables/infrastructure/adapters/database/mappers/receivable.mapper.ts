import { AccountsReceivable as PrismaReceivable, Status } from '@prisma/client';
import { Receivable } from 'src/modules/receivables/domain/entities/receivable.entity';

export class ReceivableMapper {
  static toDomain(prismaReceivable: PrismaReceivable): Receivable {
    return new Receivable(
      prismaReceivable.id,
      prismaReceivable.id_client,
      prismaReceivable.value,
      prismaReceivable.description,
      prismaReceivable.validate,
      prismaReceivable.paymentStatus,
      prismaReceivable.status as Status,
      prismaReceivable.createdAt,
      prismaReceivable.paymentDate ?? undefined,
      prismaReceivable.internal_id ?? undefined,
      prismaReceivable.updateAt ?? undefined,
    );
  }

  static toPersistence(receivable: Receivable): PrismaReceivable {
    const persistence: Partial<PrismaReceivable> = {
      id: receivable.id,
      value: receivable.value,
      description: receivable.description,
      validate: receivable.validate,
      paymentDate: receivable.paymentDate ?? null,
      status: receivable.status,
      createdAt: receivable.createdAt,
      paymentStatus: receivable.paymentStatus,
      internal_id: receivable.internalId ?? null,
      updateAt: receivable.updatedAt ?? null,
    };

    if (receivable.internalId !== undefined) {
      persistence.internal_id = receivable.internalId;
    }

    return persistence as PrismaReceivable;
  }
}
