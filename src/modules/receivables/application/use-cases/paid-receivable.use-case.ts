import { PaidReceivableDto } from './../dtos/paid-receivable.dto';
import { Injectable, Inject } from '@nestjs/common';
import { UpdateReceivableUseCase } from './update-receivable.use-case';
import { Receivable } from '../../domain/entities/receivable.entity';

@Injectable()
export class PaidReceivableUseCase {
  constructor(
    private readonly updateReceivableUseCase: UpdateReceivableUseCase,
  ) {}

  async execute(paidReceivableDto: PaidReceivableDto): Promise<Receivable> {

    const receivable = await this.updateReceivableUseCase.execute(
      paidReceivableDto.id,
      { paymentDate: paidReceivableDto.paymentDate, paymentStatus: 'Pago' },
    );
    return receivable;
  }
}
