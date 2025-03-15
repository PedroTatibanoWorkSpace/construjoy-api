import { Users as PrismaUser } from '@prisma/client';
import { User } from 'src/modules/users/domain/entities/user.entity';

export class UserMapper {
  static toDomain(prismaUser: PrismaUser): User {
    return new User(
      prismaUser.id,
      prismaUser.name,
      prismaUser.email,
      prismaUser.phone,
      prismaUser.createdAt,
      prismaUser.updateAt,
    );
  }

  static toPersistence(user: User): PrismaUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      updateAt: user.updatedAt ?? new Date(),
    };
  }
}
