import { Module } from '@nestjs/common';
import { PrismaClientRepository } from './infrastructure/adapters/database/repositories/prisma-client.repository';
import { CreateClientUseCase } from './application/use-cases/create-client.use-case';
import { UpdateClientUseCase } from './application/use-cases/update-client.use-case';
import { DeleteClientUseCase } from './application/use-cases/delete-client.use-case';
import { FindOneClientByIdUseCase } from './application/use-cases/find-client-by-id.use-case';
import { FindAllClientsUseCase } from './application/use-cases/find-all-clients.use-case';
import { CreateClientHandler } from './infrastructure/controllers/handlers/create-client.handler';
import { UpdateClientHandler } from './infrastructure/controllers/handlers/update-client.handler';
import { DeleteClientHandler } from './infrastructure/controllers/handlers/delete-client.handler';
import { FindOneClientByIdHandler } from './infrastructure/controllers/handlers/find-one-client-by-id.handler';
import { FindAllClientsHandler } from './infrastructure/controllers/handlers/find-all-clients.handler';

@Module({
  providers: [
    {
      provide: 'ClientRepositoryPort',
      useClass: PrismaClientRepository,
    },
    PrismaClientRepository,
    CreateClientUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,
    FindOneClientByIdUseCase,
    FindAllClientsUseCase,
  ],
  controllers: [
    CreateClientHandler,
    UpdateClientHandler,
    DeleteClientHandler,
    FindOneClientByIdHandler,
    FindAllClientsHandler,
  ],
  exports: [PrismaClientRepository],
})
export class ClientsModule {}
