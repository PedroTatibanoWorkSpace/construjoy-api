import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      const user = await this.findUserByIdUseCase.execute(id);
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      await this.userRepository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException();
    }
  }
}
