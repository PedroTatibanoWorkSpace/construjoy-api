import { CreateClientDto } from '../dtos/create-client.dto';
import { Status } from '@prisma/client'; 
export class Client {
  constructor(
    public readonly id: string,
    public email: string,
    public name: string,
    public phone: string,
    public document: string,
    public readonly createdAt: Date,
    public status: Status, 
    public readonly internalId?: number,
    public updatedAt?: Date,
  ) {}

  static create(createClientDto: CreateClientDto): Client {
    return new Client(
      crypto.randomUUID(),
      createClientDto.email,
      createClientDto.name,
      createClientDto.phone,
      createClientDto.document,
      new Date(),
      Status.Active,
    );
  }

  update(
    updateData: Partial<
      Omit<Client, 'id' | 'createdAt' | 'status'>
    >,
  ): void {
    this.email = updateData.email ?? this.email;
    this.name = updateData.name ?? this.name;
    this.phone = updateData.phone ?? this.phone;
    this.document = updateData.document ?? this.document;
    this.updatedAt = new Date();
  }

  delete(): void {
    this.status = Status.Inactive;
  }
}
