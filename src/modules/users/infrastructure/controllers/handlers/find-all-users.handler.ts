import { Controller, Get } from '@nestjs/common';
import { FindAllUsersUseCase } from '../../../application/use-cases/find-all-users.use-case';

@Controller('users')
export class FindAllUsersHandler {
  constructor(private readonly findAllUsersUseCase: FindAllUsersUseCase) {}

  @Get()
  async execute() {
    const result = await this.findAllUsersUseCase.execute();
    return {
      data: result,
      message: 'Lista de usuários obtida com sucesso.',
    };
  }
}
