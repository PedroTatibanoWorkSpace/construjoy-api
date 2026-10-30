import { Controller, Param, Post } from '@nestjs/common';
import { RefreshClientRiskUseCase } from '../../../application/use-cases/refresh-client-risk.use-case';

@Controller('risk')
export class RefreshClientRiskHandler {
  constructor(private readonly refreshClientRiskUseCase: RefreshClientRiskUseCase) {}

  @Post('refresh/:clientId')
  async execute(@Param('clientId') clientId: string) {
    const result = await this.refreshClientRiskUseCase.execute(clientId);
    return {
      data: result,
      message: 'Score de risco do cliente atualizado com sucesso.',
    };
  }
}
