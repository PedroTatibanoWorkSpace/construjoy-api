import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ id });
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      user.delete(); 
      await this.userRepository.update(id, user); 
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao inativar usuário');
    }
  }
}
