import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ClientRepositoryPort } from '../../domain/ports/client-repository.port';
import { Client } from '../../domain/entities/client.entity';
import { FindOneClientByIdUseCase } from './find-client-by-id.use-case';
import { UpdateClientDto } from '../dtos/update-client.dto';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject('ClientRepositoryPort')
    private readonly clientRepository: ClientRepositoryPort,
    private readonly findOneClientByIdUseCase: FindOneClientByIdUseCase,
  ) {}

  async execute(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    try {
      const client = await this.findOneClientByIdUseCase.execute(id);
      if (!client) {
        throw new NotFoundException('Cliente não encontrado');
      }

      client.update(updateClientDto);
      return this.clientRepository.update(id, client);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }
}
