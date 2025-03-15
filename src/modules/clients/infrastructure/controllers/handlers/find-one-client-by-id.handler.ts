import { Controller, Get, Param } from '@nestjs/common';
import { FindOneClientByIdUseCase } from '../../../application/use-cases/find-client-by-id.use-case';

@Controller('clients')
export class FindOneClientByIdHandler {
  constructor(private readonly findOneClientByIdUseCase: FindOneClientByIdUseCase) {}

  @Get(':id')
  async execute(@Param('id') id: string) {
    const result = await this.findOneClientByIdUseCase.execute(id);
    return {
      data: result,
      message: 'Cliente encontrado com sucesso.',
    };
  }
}
