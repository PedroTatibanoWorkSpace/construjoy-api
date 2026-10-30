import { Body, Controller, Post } from '@nestjs/common';
import { CheckCreditUseCase } from '../../../application/use-cases/check-credit.use-case';
import { CreditCheckDto } from '../dtos/credit-check.dto';

@Controller('risk')
export class CheckCreditHandler {
  constructor(private readonly checkCreditUseCase: CheckCreditUseCase) {}

  @Post('credit-check')
  async execute(@Body() creditCheckDto: CreditCheckDto) {
    const result = await this.checkCreditUseCase.execute(creditCheckDto);
    return {
      data: result,
      message: 'Análise de crédito realizada com sucesso.',
    };
  }
}
