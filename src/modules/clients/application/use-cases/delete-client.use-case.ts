import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ClientRepositoryPort } from '../../domain/ports/client-repository.port';
import { FindOneClientByIdUseCase } from './find-client-by-id.use-case';
import { DeleteReceivableUseCase } from 'src/modules/receivables/application/use-cases/delete-receivable.use-case';

@Injectable()
export class DeleteClientUseCase {
  constructor(
    @Inject('ClientRepositoryPort')
    private readonly clientRepository: ClientRepositoryPort,
    private readonly findOneClientByIdUseCase: FindOneClientByIdUseCase,
    private readonly deleteReceivableUseCase: DeleteReceivableUseCase,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      const client = await this.findOneClientByIdUseCase.execute(id);
      if (!client) {
        throw new NotFoundException('Cliente não encontrado');
      }

      const receivables = client.receivables;

      if (receivables && receivables.length > 0) {
        const deletePromisses = receivables.map((receivable) =>
          this.deleteReceivableUseCase.execute(receivable.id),
        );
        await Promise.all(deletePromisses);
      }

      client.delete();
      await this.clientRepository.update(id, client);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao inativar cliente');
    }
  }
}
