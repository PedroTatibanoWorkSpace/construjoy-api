import { CreateUserDto } from '../../application/dtos/create-user.dto';

export class User {
  constructor(
    public readonly id: string,
    public name: string,
    public email: string,
    public phone: string,
    public readonly createdAt: Date,
    public updatedAt?: Date,
  ) {}

  static create(data: CreateUserDto): User {
    return new User(
      crypto.randomUUID(),
      data.name,
      data.email,
      data.phone,
      new Date(),
    );
  }

  update(data: Partial<User>): void {
    this.name = data.name ?? this.name;
    this.email = data.email ?? this.email;
    this.phone = data.phone ?? this.phone;
  }
}
