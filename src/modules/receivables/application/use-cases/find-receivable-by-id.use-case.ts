import { Inject, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ReceivableRepositoryPort } from '../../domain/ports/receivable-repository.port';
import { Receivable } from '../../domain/entities/receivable.entity';

@Injectable()
export class FindReceivableByIdUseCase {
  constructor(
    @Inject('ReceivableRepositoryPort')
    private readonly receivableRepository: ReceivableRepositoryPort,
  ) {}

  async execute(id: string): Promise<Receivable | null> {
    try {
      const receivable = await this.receivableRepository.findOne({ id });
      if (!receivable) {
        throw new NotFoundException('Conta a receber não encontrada');
      }
      return receivable;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao buscar conta a receber');
    }
  }
}
