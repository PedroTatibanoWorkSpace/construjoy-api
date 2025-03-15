import { Controller, Get } from '@nestjs/common';
import { FindAllClientsUseCase } from '../../../application/use-cases/find-all-clients.use-case';

@Controller('clients')
export class FindAllClientsHandler {
  constructor(private readonly findAllClientsUseCase: FindAllClientsUseCase) {}

  @Get()
  async execute() {
    const result = await this.findAllClientsUseCase.execute();
    return {
      data: result,
      message: 'Lista de clientes obtida com sucesso.',
    };
  }
}
