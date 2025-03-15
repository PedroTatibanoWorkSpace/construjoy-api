import { Clients as PrismaClient } from '@prisma/client';
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
      prismaClient.status.toLowerCase(),
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
      status: client.status.charAt(0).toUpperCase() + client.status.slice(1).toLowerCase() as PrismaClient['status'], // Corrige o formato do status
      createdAt: client.createdAt,
      updateAt: client.updatedAt ?? new Date(),
    };
  }
}
