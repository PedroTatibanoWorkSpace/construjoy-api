import { Status } from '@prisma/client';
import { CreateReceivableDto } from '../dtos/create-receivable.dto';

export class Receivable {
  constructor(
    public readonly id: string,
    public userId: string,
    public clientId: string,
    public value: number,
    public description: string,
    public installmentNumber: number,
    public validate: Date,
    public paymentDate: Date,
    public status: Status,
    public readonly createdAt: Date,
    public updatedAt?: Date,
  ) {}

  static create(data: CreateReceivableDto): Receivable {
    return new Receivable(
      crypto.randomUUID(),
      data.userId,
      data.clientId,
      data.value,
      data.description,
      data.installmentNumber,
      data.validate,
      data.paymentDate,
      Status.Active,
      new Date(),
    );
  }

  update(
    updateData: Partial<
      Omit<Receivable, 'id' | 'createdAt' | 'updatedAt' | 'status'>
    >,
  ): void {
    this.userId = updateData.userId ?? this.userId;
    this.clientId = updateData.clientId ?? this.clientId;
    this.value = updateData.value ?? this.value;
    this.description = updateData.description ?? this.description;
    this.installmentNumber = updateData.installmentNumber ?? this.installmentNumber;
    this.validate = updateData.validate ?? this.validate;
    this.paymentDate = updateData.paymentDate ?? this.paymentDate;
  }

  delete(): void {
    this.status = Status.Inactive;
  }
}
