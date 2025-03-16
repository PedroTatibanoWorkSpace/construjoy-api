import { Controller, Delete, Param } from '@nestjs/common';
import { DeleteReceivableUseCase } from '../../../application/use-cases/delete-receivable.use-case';

@Controller('receivables')
export class DeleteReceivableHandler {
  constructor(private readonly deleteReceivableUseCase: DeleteReceivableUseCase) {}

  @Delete('/:id')
  async execute(@Param('id') id: string) {
    await this.deleteReceivableUseCase.execute(id);
    return {
      message: 'Conta a receber inativada com sucesso.',
    };
  }
}
