import { Inject, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ReceivableRepositoryPort } from '../../domain/ports/receivable-repository.port';
import { Receivable } from '../../domain/entities/receivable.entity';
import { UpdateReceivableDto } from '../dtos/update-receivable.dto';

@Injectable()
export class UpdateReceivableUseCase {
  constructor(
    @Inject('ReceivableRepositoryPort')
    private readonly receivableRepository: ReceivableRepositoryPort,
  ) {}

  async execute(id: string, updateReceivableDto: UpdateReceivableDto): Promise<Receivable> {
    try {
      const receivable = await this.receivableRepository.findOne({ id });
      if (!receivable) {
        throw new NotFoundException('Conta a receber não encontrada');
      }

      receivable.update(updateReceivableDto);
      const updatedReceivable = await this.receivableRepository.update(id, receivable);
      return updatedReceivable;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao atualizar conta a receber:', error);
      throw new InternalServerErrorException('Erro ao atualizar conta a receber');
    }
  }
}
