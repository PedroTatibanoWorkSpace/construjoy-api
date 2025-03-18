import { CreateUserDto } from '../../application/dtos/create-user.dto';
import { Status } from '@prisma/client'; // Importar o enum Status gerado pelo Prisma

export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public phone: string,
    public readonly createdAt: Date,
    public status: Status,
    public readonly internalId?: number,
    public updatedAt?: Date,
  ) {}

  static create(data: CreateUserDto): User {
    return new User(
      crypto.randomUUID(),
      data.name,
      data.email,
      data.phone,
      new Date(),
      Status.Active,
    );
  }

  update(
    updateData: Partial<
      Omit<User, 'id' | 'createdAt'| 'status'>
    >,
  ): void {
    this.name = updateData.name ?? this.name;
    this.email = updateData.email ?? this.email;
    this.phone = updateData.phone ?? this.phone;
    this.updatedAt = new Date();
  }

  delete(): void {
    this.status = Status.Inactive;
  }
}
