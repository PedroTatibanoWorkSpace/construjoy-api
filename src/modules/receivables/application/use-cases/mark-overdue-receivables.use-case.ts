import { Inject, Injectable } from '@nestjs/common';
import { ReceivableRepositoryPort } from '../../domain/ports/receivable-repository.port';

@Injectable()
export class MarkOverdueReceivablesUseCase {
  constructor(
    @Inject('ReceivableRepositoryPort')
    private readonly receivableRepository: ReceivableRepositoryPort,
  ) {}

  async execute(now: Date = new Date()): Promise<number> {
    const overdue = await this.receivableRepository.findAll({
      validate: { lt: now },
      paymentStatus: { notIn: ['Atrasado', 'Pago'] },
    });

    await Promise.all(
      overdue.map((receivable) => {
        receivable.update({ paymentStatus: 'Atrasado' });
        return this.receivableRepository.update(receivable.id, receivable);
      }),
    );

    return overdue.length;
  }
}
