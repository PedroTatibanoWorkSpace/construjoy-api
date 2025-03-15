import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserUseCase } from '../../../application/use-cases/create-user.use-case';
import { CreateUserDto } from '../dtos/create-user.dto';

@Controller('users')
export class CreateUserHandler {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  async execute(@Body() createUserDto: CreateUserDto) {
    const result = await this.createUserUseCase.execute(createUserDto);
    return {
      data: result,
      message: 'Usuário criado com sucesso.',
    };
  }
}
