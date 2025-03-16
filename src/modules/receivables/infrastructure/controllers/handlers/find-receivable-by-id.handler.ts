import { Controller, Get, Param } from '@nestjs/common';
import { FindReceivableByIdUseCase } from '../../../application/use-cases/find-receivable-by-id.use-case';

@Controller('receivables')
export class FindReceivableByIdHandler {
  constructor(private readonly findReceivableByIdUseCase: FindReceivableByIdUseCase) {}

  @Get('/:id')
  async execute(@Param('id') id: string) {
    const result = await this.findReceivableByIdUseCase.execute(id);
    return {
      data: result,
      message: 'Conta a receber encontrada com sucesso.',
    };
  }
}
