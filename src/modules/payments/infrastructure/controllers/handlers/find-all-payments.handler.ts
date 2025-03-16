import { Controller, Get } from '@nestjs/common';
import { FindAllPaymentsUseCase } from '../../../application/use-cases/find-all-payments.use-case';

@Controller('payments')
export class FindAllPaymentsHandler {
  constructor(private readonly findAllPaymentsUseCase: FindAllPaymentsUseCase) {}

  @Get()
  async execute() {
    const result = await this.findAllPaymentsUseCase.execute();
    return {
      data: result,
      message: 'Lista de pagamentos obtida com sucesso.',
    };
  }
}
