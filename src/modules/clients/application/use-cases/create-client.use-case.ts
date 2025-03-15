import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ClientRepositoryPort } from '../../domain/ports/client-repository.port';
import { Client } from '../../domain/entities/client.entity';
import { CreateClientDto } from '../dtos/create-client.dto';

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject('ClientRepositoryPort')
    private readonly clientRepository: ClientRepositoryPort,
  ) {}

  async execute(createClientDto: CreateClientDto): Promise<Client> {
    try {

      const existingClient = await this.clientRepository.findOne({
        OR: [
          { email: createClientDto.email },
          { phone: createClientDto.phone },
          { document: createClientDto.document },
        ],
      });

      if (existingClient) {
        throw new ConflictException('Já existe um cliente com o mesmo email, telefone ou documento.');
      }

      const client = Client.create(createClientDto);
      return await this.clientRepository.create(client);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao criar cliente');
    }
  }
}
