import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ReceivableRepositoryPort } from '../../domain/ports/receivable-repository.port';
import { Receivable } from '../../domain/entities/receivable.entity';
import { CreateReceivableDto } from '../dtos/create-receivable.dto';

@Injectable()
export class CreateReceivableUseCase {
  constructor(
    @Inject('ReceivableRepositoryPort')
    private readonly receivableRepository: ReceivableRepositoryPort,
  ) {}

  async execute(createReceivableDto: CreateReceivableDto): Promise<Receivable> {
    try {
      const receivable = Receivable.create(createReceivableDto);
      return await this.receivableRepository.create(receivable);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao criar conta a receber');
    }
  }
}
