import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class FindUserByIdUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(id: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({ id });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException("Erro ao buscar usuário");
    }
  }
}
