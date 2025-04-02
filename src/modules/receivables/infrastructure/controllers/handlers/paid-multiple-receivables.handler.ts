import { Controller, Patch, Param, Body } from '@nestjs/common';
import { PaidMultipleReceivablesUseCase } from 'src/modules/receivables/application/use-cases/paid-multiple-receivables.use-case';
import { PaidMultipleReceivablesDto } from '../dtos/paid-multiple-receivables.dto';

@Controller("receivables")
export class PaidMultipleReceivablesHandler {
  constructor(private readonly paidMultipleReceivablesUseCase: PaidMultipleReceivablesUseCase) {}

  @Patch('/paid-multiple/:id')
  async execute(
    @Param('id') id: string,
    @Body() paidMultipleReceivablesDto: PaidMultipleReceivablesDto,
  ) {
    paidMultipleReceivablesDto.clientId = id;
    const result = await this.paidMultipleReceivablesUseCase.execute(paidMultipleReceivablesDto);
    return {
        data: result,
        message: 'Contas pagas.'
    };
  }
}