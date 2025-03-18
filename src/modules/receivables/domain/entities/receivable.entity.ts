import { Status } from '@prisma/client';
import { CreateReceivableDto } from '../dtos/create-receivable.dto';

export class Receivable {
  constructor(
    public readonly id: string,
    public clientId: string,
    public value: number,
    public description: string,
    public validate: Date,
    public paymentStatus: string,
    public status: Status,
    public readonly createdAt: Date,
    public paymentDate?: Date,
    public readonly internalId?: number,
    public updatedAt?: Date,
  ) {}

  static create(data: CreateReceivableDto): Receivable {
    return new Receivable(
      crypto.randomUUID(),
      data.userId,
      data.value,
      data.description,
      data.validate,
      "Pendente",
      Status.Active,
      new Date(),
      data.paymentDate ?? undefined,
    );
  }

  update(
    updateData: Partial<
      Omit<Receivable, 'id' | 'createdAt'| 'status'>
    >,
  ): void {
    this.clientId = updateData.clientId ?? this.clientId;
    this.value = updateData.value ?? this.value;
    this.description = updateData.description ?? this.description;
    this.validate = updateData.validate ?? this.validate;
    this.paymentDate = updateData.paymentDate ?? this.paymentDate;
    this.updatedAt = new Date();
  }

  delete(): void {
    this.status = Status.Inactive;
  }
}
