import { Body, Controller, Post } from '@nestjs/common';
import { CreatePaymentUseCase } from '../../../application/use-cases/create-payment.use-case';
import { CreatePaymentDto } from '../dtos/create-payment.dto';

@Controller('payments')
export class CreatePaymentHandler {
  constructor(private readonly createPaymentUseCase: CreatePaymentUseCase) {}

  @Post()
  async execute(@Body() createPaymentDto: CreatePaymentDto) {
    const result = await this.createPaymentUseCase.execute(createPaymentDto);
    return {
      data: result,
      message: 'Pagamento criado com sucesso.',
    };
  }
}
