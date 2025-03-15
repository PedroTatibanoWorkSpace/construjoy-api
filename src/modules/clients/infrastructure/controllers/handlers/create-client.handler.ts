import { Body, Controller, Post } from '@nestjs/common';
import { CreateClientUseCase } from '../../../application/use-cases/create-client.use-case';
import { CreateClientDto } from '../../../application/dtos/create-client.dto';

@Controller('clients')
export class CreateClientHandler {
  constructor(private readonly createClientUseCase: CreateClientUseCase) {}

  @Post()
  async execute(@Body() createClientDto: CreateClientDto) {
    const result = await this.createClientUseCase.execute(createClientDto);
    return {
      data: result,
      message: 'Cliente criado com sucesso.',
    };
  }
}
