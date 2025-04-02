import { Body, Controller, Post } from '@nestjs/common';
import { CreateReceivableUseCase } from '../../../application/use-cases/create-receivable.use-case';
import { CreateReceivableDto } from '../dtos/create-receivable.dto';

@Controller('receivables')
export class CreateReceivableHandler {
  constructor(private readonly createReceivableUseCase: CreateReceivableUseCase) {}

  @Post()
  async execute(@Body() createReceivableDto: CreateReceivableDto) {
    const result = await this.createReceivableUseCase.execute(createReceivableDto);
    return {
      data: result,
      message: 'Conta a receber criada com sucesso.',
    };
  }
}
