import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/infrastructure/persistence/prisma/prisma.service';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { UserRepositoryPort } from 'src/modules/users/domain/ports/user-repository.port';
import { UserMapper } from '../mappers/user.mapper';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  private readonly prisma;

  constructor(private readonly prismaService: PrismaService) {
    this.prisma = prismaService.getPrismaClient();
  }

  async create(user: User): Promise<User> {
    const prismaUser = await this.prisma.users.create({
      data: UserMapper.toPersistence(user),
    });
    return UserMapper.toDomain(prismaUser);
  }

  async findOne(where: Prisma.UsersWhereInput): Promise<User | null> {
    const prismaUser = await this.prisma.users.findFirst({ where });
    return prismaUser ? UserMapper.toDomain(prismaUser) : null;
  }

  async findAll(where?: Prisma.UsersWhereInput): Promise<User[]> {
    const prismaUsers = await this.prisma.users.findMany({ where });
    return prismaUsers.map(UserMapper.toDomain);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const prismaUser = await this.prisma.users.update({
      where: { id },
      data: UserMapper.toPersistence(data as User),
    });
    return UserMapper.toDomain(prismaUser);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.users.delete({ where: { id } });
  }
}
