import { Body, Controller, Param, Patch } from '@nestjs/common';
import { UpdateUserUseCase } from '../../../application/use-cases/update-user.use-case';
import { UpdateUserDto } from '../dtos/update-user.dto';

@Controller('users')
export class UpdateUserHandler {
  constructor(private readonly updateUserUseCase: UpdateUserUseCase) {}

  @Patch('/:id')
  async execute(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const result = await this.updateUserUseCase.execute(id, updateUserDto);
    return {
      data: result,
      message: 'Usuário atualizado com sucesso.',
    };
  }
}
