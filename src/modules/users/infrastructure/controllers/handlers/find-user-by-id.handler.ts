import { Controller, Get, Param } from '@nestjs/common';
import { FindUserByIdUseCase } from '../../../application/use-cases/find-user-by-id.use-case';

@Controller('users')
export class FindUserByIdHandler {
  constructor(private readonly findUserByIdUseCase: FindUserByIdUseCase) {}

  @Get('/:id')
  async execute(@Param('id') id: string) {
    const result = await this.findUserByIdUseCase.execute(id);
    return {
      data: result,
      message: 'Usuário encontrado com sucesso.',
    };
  }
}
