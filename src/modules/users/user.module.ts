import { Module } from '@nestjs/common';
import { PrismaUserRepository } from './infrastructure/adapters/database/repositories/prisma-user.repository';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { FindUserByIdUseCase } from './application/use-cases/find-user-by-id.use-case';
import { FindAllUsersUseCase } from './application/use-cases/find-all-users.use-case';
import { CreateUserHandler } from './infrastructure/controllers/handlers/create-user.handler';
import { UpdateUserHandler } from './infrastructure/controllers/handlers/update-user.handler';
import { DeleteUserHandler } from './infrastructure/controllers/handlers/delete-user.handler';
import { FindUserByIdHandler } from './infrastructure/controllers/handlers/find-user-by-id.handler';
import { FindAllUsersHandler } from './infrastructure/controllers/handlers/find-all-users.handler';
@Module({
  providers: [
    {
      provide: 'UserRepositoryPort',
      useClass: PrismaUserRepository,
    },
    PrismaUserRepository,
    CreateUserUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    FindUserByIdUseCase,
    FindAllUsersUseCase,
  ],
  controllers: [
    CreateUserHandler,
    UpdateUserHandler,
    DeleteUserHandler,
    FindUserByIdHandler,
    FindAllUsersHandler,
  ],
  exports: [PrismaUserRepository],
})
export class UserModule {}
