import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/persistence/prisma/prisma.service';
import { Receivable } from 'src/modules/receivables/domain/entities/receivable.entity';
import { ReceivableRepositoryPort } from 'src/modules/receivables/domain/ports/receivable-repository.port';
import { Prisma } from '@prisma/client';
import { ReceivableMapper } from '../mappers/receivable.mapper';

@Injectable()
export class PrismaReceivableRepository implements ReceivableRepositoryPort {
  private readonly prisma;

  constructor(private readonly prismaService: PrismaService) {
    this.prisma = prismaService.getPrismaClient();
  }

  async create(receivable: Receivable): Promise<Receivable> {
    const prismaReceivable = await this.prisma.accountsReceivable.create({
      data: {
        ...ReceivableMapper.toPersistence(receivable),
        client: { connect: { id: receivable.clientId } },
      },
    });
    return ReceivableMapper.toDomain(prismaReceivable);
  }

  async findOne(where: Prisma.AccountsReceivableWhereInput): Promise<Receivable | null> {
    const prismaReceivable = await this.prisma.accountsReceivable.findFirst({
      where,
      include: { client: true, payments: true }, // Removido o campo `user`
    });
    return prismaReceivable ? ReceivableMapper.toDomain(prismaReceivable) : null;
  }

  async findAll(where?: Prisma.AccountsReceivableWhereInput): Promise<Receivable[]> {
    const prismaReceivables = await this.prisma.accountsReceivable.findMany({
      where,
      include: { client: true, payments: true },
    });
    return prismaReceivables.map(ReceivableMapper.toDomain);
  }

  async update(id: string, data: Partial<Receivable>): Promise<Receivable> {
    const prismaReceivable = await this.prisma.accountsReceivable.update({
      where: { id },
      data: {
        ...ReceivableMapper.toPersistence(data as Receivable),
        client: data.clientId ? { connect: { id: data.clientId } } : undefined,
      },
    });
    return ReceivableMapper.toDomain(prismaReceivable);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.accountsReceivable.delete({ where: { id } });
  }
}
