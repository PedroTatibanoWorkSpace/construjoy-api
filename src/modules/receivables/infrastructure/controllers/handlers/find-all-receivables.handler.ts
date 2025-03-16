import { Controller, Get } from '@nestjs/common';
import { FindAllReceivablesUseCase } from '../../../application/use-cases/find-all-receivables.use-case';

@Controller('receivables')
export class FindAllReceivablesHandler {
  constructor(private readonly findAllReceivablesUseCase: FindAllReceivablesUseCase) {}

  @Get()
  async execute() {
    const result = await this.findAllReceivablesUseCase.execute();
    return {
      data: result,
      message: 'Lista de contas a receber obtida com sucesso.',
    };
  }
}
