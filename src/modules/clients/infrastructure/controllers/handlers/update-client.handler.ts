import { Body, Controller, Param, Patch } from '@nestjs/common';
import { UpdateClientUseCase } from '../../../application/use-cases/update-client.use-case';
import { UpdateClientDto } from '../../../application/dtos/update-client.dto';

@Controller('clients')
export class UpdateClientHandler {
  constructor(private readonly updateClientUseCase: UpdateClientUseCase) {}

  @Patch('/:id')
  async execute(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    const result = await this.updateClientUseCase.execute(id, updateClientDto);
    return {
      data: result,
      message: 'Cliente atualizado com sucesso.',
    };
  }
}
