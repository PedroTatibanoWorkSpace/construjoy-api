import { CreateClientDto } from '../dtos/create-client.dto';
import { Status } from '@prisma/client'; 
import { Receivable } from 'src/modules/receivables/domain/entities/receivable.entity';

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
    public readonly receivables: Receivable[] = [],
    public address?: string,
    public riskScore?: number,
    public riskLevel?: string,
    public riskProbability?: number,
    public creditLimit?: number,
    public riskUpdatedAt?: Date,
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
      undefined,
      undefined,
      [],
      createClientDto.address,
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
    this.address = updateData.address ?? this.address;
    this.updatedAt = new Date();
  }

  applyRisk(risk: {
    score: number;
    level: string;
    probability: number;
    creditLimit: number;
  }): void {
    this.riskScore = risk.score;
    this.riskLevel = risk.level;
    this.riskProbability = risk.probability;
    this.creditLimit = risk.creditLimit;
    this.riskUpdatedAt = new Date();
  }

  delete(): void {
    this.status = Status.Inactive;
  }
}
