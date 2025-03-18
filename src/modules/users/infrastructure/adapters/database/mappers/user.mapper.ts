import { Users as PrismaUser, Status } from '@prisma/client'; // Importar o enum Status
import { User } from 'src/modules/users/domain/entities/user.entity';

export class UserMapper {
  static toDomain(prismaUser: PrismaUser): User {
    return new User(
      prismaUser.id,
      prismaUser.name,
      prismaUser.email,
      prismaUser.phone,
      prismaUser.createdAt,
      prismaUser.status as Status,
      prismaUser.internal_id ?? undefined,
      prismaUser.updateAt ?? undefined, 
    );
  }

  static toPersistence(user: User): PrismaUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      internal_id: user.internalId ?? null,
      updateAt: user.updatedAt ?? null,
      status: user.status,
    };
  }
}
