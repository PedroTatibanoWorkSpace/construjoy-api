import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ReceivableRepositoryPort } from '../../domain/ports/receivable-repository.port';
import { Receivable } from '../../domain/entities/receivable.entity';
import { UpdateReceivableUseCase } from './update-receivable.use-case';

@Injectable()
export class FindAllReceivablesUseCase {
  constructor(
    @Inject('ReceivableRepositoryPort')
    private readonly receivableRepository: ReceivableRepositoryPort,
    private readonly updateReceivableUseCase: UpdateReceivableUseCase,
  ) {}

  async execute(): Promise<Receivable[]> {
    try {
      const clients = await this.receivableRepository.findAll();
      const now = new Date();

      const updatePromises = clients
        .filter(client => client.validate < now && client.paymentStatus !== 'Atrasado')
        .map(client => 
          this.updateReceivableUseCase.execute(client.id, { paymentStatus: 'Atrasado' })
        );

      await Promise.all(updatePromises);

      return await this.receivableRepository.findAll();

    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar contas a receber');
    }
  }
}
