import { Inject, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ReceivableRepositoryPort } from '../../domain/ports/receivable-repository.port';

@Injectable()
export class DeleteReceivableUseCase {
  constructor(
    @Inject('ReceivableRepositoryPort')
    private readonly receivableRepository: ReceivableRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      const receivable = await this.receivableRepository.findOne({ id });
      if (!receivable) {
        throw new NotFoundException('Conta a receber não encontrada');
      }

      receivable.delete(); 
      await this.receivableRepository.update(id, receivable);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao inativar conta a receber');
    }
  }
}
