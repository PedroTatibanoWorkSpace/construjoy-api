import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { User } from '../../domain/entities/user.entity';
import { FindUserByIdUseCase } from './find-user-by-id.use-case';
import { UpdateUserDto } from '../dtos/update-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
  ) {}

  async execute(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.findUserByIdUseCase.execute(id);
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      user.update(updateUserDto);
      return this.userRepository.update(id, user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException("Erro ao atualizar usuário");
    }
  }
}
