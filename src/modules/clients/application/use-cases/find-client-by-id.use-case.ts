import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ClientRepositoryPort } from '../../domain/ports/client-repository.port';
import { Client } from '../../domain/entities/client.entity';

@Injectable()
export class FindOneClientByIdUseCase {
  constructor(
    @Inject('ClientRepositoryPort')
    private readonly clientRepository: ClientRepositoryPort,
  ) {}

  async execute(id: string): Promise<Client | null> {
    try {
      const client = await this.clientRepository.findOne({ id });

      if (!client) {
        throw new NotFoundException('Cliente não encontrado');
      }
      return client;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new Error(`Falha ao buscar cliente: ${error.message}`);
      }
      throw new InternalServerErrorException();
    }
  }
}
