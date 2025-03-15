import { Controller, Delete, Param } from '@nestjs/common';
import { DeleteUserUseCase } from '../../../application/use-cases/delete-user.use-case';

@Controller('users')
export class DeleteUserHandler {
  constructor(private readonly deleteUserUseCase: DeleteUserUseCase) {}

  @Delete(':id')
  async execute(@Param('id') id: string) {
    await this.deleteUserUseCase.execute(id);
    return {
      message: 'Usuário deletado com sucesso.',
    };
  }
}
