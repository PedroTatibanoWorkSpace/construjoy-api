import { User } from '../entities/user.entity';

export interface UserRepositoryPort {
  create(user: User): Promise<User>;
  findOne(where: any): Promise<User | null>;
  findAll(where?: any): Promise<User[]>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
