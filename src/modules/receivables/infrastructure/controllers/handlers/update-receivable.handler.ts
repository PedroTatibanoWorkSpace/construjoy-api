import { Body, Controller, Param, Patch } from '@nestjs/common';
import { UpdateReceivableUseCase } from '../../../application/use-cases/update-receivable.use-case';
import { UpdateReceivableDto } from '../dtos/update-receivable.dto';

@Controller('receivables')
export class UpdateReceivableHandler {
  constructor(private readonly updateReceivableUseCase: UpdateReceivableUseCase) {}

  @Patch('/:id')
  async execute(@Param('id') id: string, @Body() updateReceivableDto: UpdateReceivableDto) {
    const result = await this.updateReceivableUseCase.execute(id, updateReceivableDto);
    return {
      data: result,
      message: 'Conta a receber atualizada com sucesso.',
    };
  }
}
