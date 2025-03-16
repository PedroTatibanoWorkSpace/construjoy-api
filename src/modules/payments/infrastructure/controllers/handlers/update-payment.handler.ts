import { Body, Controller, Param, Patch } from '@nestjs/common';
import { UpdatePaymentUseCase } from '../../../application/use-cases/update-payment.use-case';
import { UpdatePaymentDto } from '../dtos/update-payment.dto';

@Controller('payments')
export class UpdatePaymentHandler {
  constructor(private readonly updatePaymentUseCase: UpdatePaymentUseCase) {}

  @Patch('/:id')
  async execute(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    const result = await this.updatePaymentUseCase.execute(id, updatePaymentDto);
    return {
      data: result,
      message: 'Pagamento atualizado com sucesso.',
    };
  }
}
