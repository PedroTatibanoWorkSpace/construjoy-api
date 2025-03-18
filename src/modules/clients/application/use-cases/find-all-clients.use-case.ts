import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientRepositoryPort } from '../../domain/ports/client-repository.port';
import { Client } from '../../domain/entities/client.entity';

@Injectable()
export class FindAllClientsUseCase {
  constructor(
    @Inject('ClientRepositoryPort')
    private readonly clientRepository: ClientRepositoryPort,
  ) {}

  async execute(): Promise<Client[]> {
    try {
      return this.clientRepository.findAll();
    } catch (error) {
      throw new InternalServerErrorException("Erro ao achar os clients");
    }
  }
}
