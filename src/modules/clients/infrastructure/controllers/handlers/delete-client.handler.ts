import { Controller, Delete, Param } from '@nestjs/common';
import { DeleteClientUseCase } from '../../../application/use-cases/delete-client.use-case';

@Controller('clients')
export class DeleteClientHandler {
  constructor(private readonly deleteClientUseCase: DeleteClientUseCase) {}

  @Delete(':id')
  async execute(@Param('id') id: string) {
    await this.deleteClientUseCase.execute(id);
    return {
      message: 'Cliente deletado com sucesso.',
    };
  }
}
