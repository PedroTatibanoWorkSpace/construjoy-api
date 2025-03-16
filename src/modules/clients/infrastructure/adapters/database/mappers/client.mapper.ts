import { Clients as PrismaClient, Status } from '@prisma/client'; // Importar o enum Status
import { Client } from 'src/modules/clients/domain/entities/client.entity';

export class ClientMapper {
  static toDomain(prismaClient: PrismaClient): Client {
    return new Client(
      prismaClient.id,
      prismaClient.email,
      prismaClient.name,
      prismaClient.phone,
      prismaClient.document,
      prismaClient.createdAt,
      prismaClient.status as Status,
      prismaClient.updateAt,
    );
  }

  static toPersistence(client: Client): PrismaClient {
    return {
      id: client.id,
      email: client.email,
      name: client.name,
      phone: client.phone,
      document: client.document,
      status: client.status, 
      createdAt: client.createdAt,
      updateAt: client.updatedAt ?? new Date(),
    };
  }
}
