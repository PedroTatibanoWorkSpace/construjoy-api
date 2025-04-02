import { Clients as PrismaClient, Status } from '@prisma/client';
import { Client } from 'src/modules/clients/domain/entities/client.entity';
import { Receivable } from 'src/modules/receivables/domain/entities/receivable.entity';

export class ClientMapper {

  static toDomain(prismaClient: PrismaClient & { accountsReceivable?: any[] }): Client {
    const receivables = prismaClient.accountsReceivable
      ? prismaClient.accountsReceivable.map(receivable => {
          return new Receivable(
            receivable.id,
            receivable.id_client,
            receivable.value,
            receivable.description,
            receivable.validate,
            receivable.purchaseDate,
            receivable.paymentStatus,
            receivable.status,
            receivable.createdAt,
            receivable.paymentDate,
            receivable.internal_id,
            receivable.updateAt,
          );
        })
      : [];

    return new Client(
      prismaClient.id,
      prismaClient.email,
      prismaClient.name,
      prismaClient.phone,
      prismaClient.document,
      prismaClient.createdAt,
      prismaClient.status as Status,
      prismaClient.internal_id ?? undefined,
      prismaClient.updateAt ?? undefined,
      receivables, 
    );
  }

  static toPersistence(client: Client): PrismaClient {
    const persistence: Partial<PrismaClient> = {
      id: client.id,
      email: client.email,
      name: client.name,
      phone: client.phone,
      document: client.document,
      status: client.status,
      createdAt: client.createdAt,
      updateAt: client.updatedAt ?? null,
    };

    if (client.internalId !== undefined) {
      persistence.internal_id = client.internalId;
    }

    return persistence as PrismaClient;
  }
}
