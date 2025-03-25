import { AccountsReceivable as PrismaReceivable, Status } from '@prisma/client';
import { Receivable } from 'src/modules/receivables/domain/entities/receivable.entity';
import { Client } from 'src/modules/clients/domain/entities/client.entity';

export class ReceivableMapper {
  static toDomain(prismaReceivable: PrismaReceivable & { client?: Client }): Receivable {
    return new Receivable(
      prismaReceivable.id,
      prismaReceivable.id_client,
      prismaReceivable.value,
      prismaReceivable.description,
      prismaReceivable.validate,
      prismaReceivable.purchaseDate,
      prismaReceivable.paymentStatus,
      prismaReceivable.status as Status,
      prismaReceivable.createdAt,
      prismaReceivable.paymentDate ?? undefined,
      prismaReceivable.internal_id ?? undefined,
      prismaReceivable.updateAt ?? undefined,
      prismaReceivable.client 
        ? new Client(
            prismaReceivable.client.id,
            prismaReceivable.client.email,
            prismaReceivable.client.name,
            prismaReceivable.client.phone,
            prismaReceivable.client.document,
            prismaReceivable.client.createdAt,
            prismaReceivable.client.status,
            prismaReceivable.client.internalId ?? undefined,
            prismaReceivable.client.updatedAt ?? undefined
          )
        : undefined
    );
  }


  static toPersistence(receivable: Receivable): PrismaReceivable {
    const persistence: Partial<PrismaReceivable> = {
      id: receivable.id,
      value: receivable.value,
      description: receivable.description,
      validate: receivable.validate,
      purchaseDate: receivable.purchaseDate ?? null,
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
