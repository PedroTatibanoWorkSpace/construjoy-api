import { Controller, Get, Param } from '@nestjs/common';
import { FindPaymentByIdUseCase } from '../../../application/use-cases/find-payment-by-id.use-case';

@Controller('payments')
export class FindPaymentByIdHandler {
  constructor(private readonly findPaymentByIdUseCase: FindPaymentByIdUseCase) {}

  @Get('/:id')
  async execute(@Param('id') id: string) {
    const result = await this.findPaymentByIdUseCase.execute(id);
    return {
      data: result,
      message: 'Pagamento encontrado com sucesso.',
    };
  }
}
