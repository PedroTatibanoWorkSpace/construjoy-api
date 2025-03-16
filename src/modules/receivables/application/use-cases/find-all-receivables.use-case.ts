import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ReceivableRepositoryPort } from '../../domain/ports/receivable-repository.port';
import { Receivable } from '../../domain/entities/receivable.entity';

@Injectable()
export class FindAllReceivablesUseCase {
  constructor(
    @Inject('ReceivableRepositoryPort')
    private readonly receivableRepository: ReceivableRepositoryPort,
  ) {}

  async execute(): Promise<Receivable[]> {
    try {
      return await this.receivableRepository.findAll();
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar contas a receber');
    }
  }
}
