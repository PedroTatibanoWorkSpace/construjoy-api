import { Controller, Patch, Param, Body } from '@nestjs/common';
import { PaidReceivableUseCase } from 'src/modules/receivables/application/use-cases/paid-receivable.use-case';
import { PaidReceivableDto } from '../dtos/paid-receivable.dto';

@Controller("receivables")
export class PaidReceivableHandler {
  constructor(private readonly paidReceivableUseCase: PaidReceivableUseCase) {}

  @Patch('/paid/:id')
  async execute(
    @Param('id') id: string,
    @Body() paidReceivableDto: PaidReceivableDto,
  ) {
    paidReceivableDto.id = id;
    const result = await this.paidReceivableUseCase.execute(paidReceivableDto);
    return {
        data: result,
        message: 'Conta a receber paga com sucesso.'
    };
  }
}