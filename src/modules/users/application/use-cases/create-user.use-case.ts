import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserRepositoryPort } from '../../domain/ports/user-repository.port';
import { User } from '../../domain/entities/user.entity';
import { CreateUserDto } from '../dtos/create-user.dto';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(data: CreateUserDto): Promise<User> {
    try {
      const user = User.create(data);
      return await this.userRepository.create(user);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao criar usuário');
    }
  }
}
