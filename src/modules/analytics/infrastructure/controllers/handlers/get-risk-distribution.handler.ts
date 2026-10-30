import { Controller, Get } from '@nestjs/common';
import { GetRiskDistributionUseCase } from '../../../application/use-cases/get-risk-distribution.use-case';

@Controller('analytics')
export class GetRiskDistributionHandler {
  constructor(private readonly useCase: GetRiskDistributionUseCase) {}

  @Get('risk-distribution')
  async execute() {
    const result = await this.useCase.execute();
    return {
      data: result,
      message: 'Distribuição de risco obtida com sucesso.',
    };
  }
}
