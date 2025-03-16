import { AccountsReceivable as PrismaReceivable, Status } from '@prisma/client';
import { Receivable } from 'src/modules/receivables/domain/entities/receivable.entity';

export class ReceivableMapper {
  static toDomain(prismaReceivable: PrismaReceivable): Receivable {
    return new Receivable(
      prismaReceivable.id,
      prismaReceivable.id_user,
      prismaReceivable.id_client,
      prismaReceivable.value,
      prismaReceivable.description,
      prismaReceivable.installmentNumber,
      prismaReceivable.validate,
      prismaReceivable.paymentDate,
      prismaReceivable.status as Status,
      prismaReceivable.createdAt,
      prismaReceivable.updateAt,
    );
  }

  static toPersistence(receivable: Receivable): PrismaReceivable {
    return {
      id: receivable.id,
      id_user: receivable.userId,
      id_client: receivable.clientId,
      value: receivable.value,
      description: receivable.description,
      installmentNumber: receivable.installmentNumber,
      validate: receivable.validate,
      paymentDate: receivable.paymentDate,
      status: receivable.status,
      createdAt: receivable.createdAt,
      updateAt: receivable.updatedAt ?? new Date(),
    };
  }
}
