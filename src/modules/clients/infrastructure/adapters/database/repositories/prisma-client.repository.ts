import { Injectable } from "@nestjs/common";
import { Client } from "src/modules/clients/domain/entities/client.entity";
import { ClientRepositoryPort } from "src/modules/clients/domain/ports/client-repository.port";
import { PrismaService } from "src/shared/infrastructure/persistence/prisma/prisma.service";
import { ClientMapper } from "../mappers/client.mapper";
import { Prisma } from "@prisma/client";

@Injectable()
export class PrismaClientRepository implements ClientRepositoryPort {
  private readonly prisma;

  constructor(private readonly prismaService: PrismaService) {
    this.prisma = prismaService.getPrismaClient();
  }

  async create(client: Client): Promise<Client> {
    try {
      const prismaClient = await this.prisma.clients.create({
        data: ClientMapper.toPersistence(client),
      });
      return ClientMapper.toDomain(prismaClient);
    } catch (error) {
      throw error;
    }
  }

  async findOne(where: Prisma.ClientsWhereInput): Promise<Client | null> {
    const prismaClient = await this.prisma.clients.findFirst({
      where,
      include: {
        accountsReceivable: {
          where: { status: 'Active' }, 
        },
      },
    });
    return prismaClient
      ? ClientMapper.toDomain({
          ...prismaClient,
          receivables: prismaClient.accountsReceivable, 
        })
      : null;
  }

  async findAll(where?: Prisma.ClientsWhereInput, order?: Prisma.ClientsOrderByWithRelationInput): Promise<Client[]> {
    const prismaClients = await this.prisma.clients.findMany({
      where: { ...where, status: 'Active' },
      orderBy: order || { createdAt: 'desc' },
      include: {
        accountsReceivable: {
          where: { status: 'Active' },
        },
      },
    });
    return prismaClients.map(ClientMapper.toDomain);
  }

  async update(id: string, data: Partial<Client>): Promise<Client> {
    const prismaClient = await this.prisma.clients.update({
      where: { id },
      data: ClientMapper.toPersistence(data as Client),
    });
    return ClientMapper.toDomain(prismaClient);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.clients.delete({ where: { id } });
  }
}