import { Controller, Post } from '@nestjs/common';
import { RefreshAllRisksUseCase } from '../../../application/use-cases/refresh-all-risks.use-case';

@Controller('risk')
export class RefreshAllRisksHandler {
  constructor(private readonly refreshAllRisksUseCase: RefreshAllRisksUseCase) {}

  @Post('refresh')
  async execute() {
    const result = await this.refreshAllRisksUseCase.execute();
    return {
      data: result,
      message: 'Scores de risco atualizados com sucesso.',
    };
  }
}
