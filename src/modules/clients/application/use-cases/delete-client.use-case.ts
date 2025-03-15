import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ClientRepositoryPort } from '../../domain/ports/client-repository.port';
import { FindOneClientByIdUseCase } from './find-client-by-id.use-case';

@Injectable()
export class DeleteClientUseCase {
  constructor(
    @Inject('ClientRepositoryPort')
    private readonly clientRepository: ClientRepositoryPort,
    private readonly findOneClientByIdUseCase: FindOneClientByIdUseCase,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      const client = await this.findOneClientByIdUseCase.execute(id);
      if (!client) {
        throw new NotFoundException('Cliente não encontrado');
      }

      client.delete();
      await this.clientRepository.update(id, client);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }
}
