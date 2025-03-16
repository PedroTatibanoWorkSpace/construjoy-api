import { Controller, Delete, Param } from '@nestjs/common';
import { DeletePaymentUseCase } from '../../../application/use-cases/delete-payment.use-case';

@Controller('payments')
export class DeletePaymentHandler {
  constructor(private readonly deletePaymentUseCase: DeletePaymentUseCase) {}

  @Delete('/:id')
  async execute(@Param('id') id: string) {
    await this.deletePaymentUseCase.execute(id);
    return {
      message: 'Pagamento deletado com sucesso.',
    };
  }
}
