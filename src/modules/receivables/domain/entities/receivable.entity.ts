import { Status } from '@prisma/client';
import { CreateReceivableDto } from '../dtos/create-receivable.dto';
import { Client } from 'src/modules/clients/domain/entities/client.entity';

export class Receivable {
  constructor(
    public readonly id: string,
    public clientId: string,
    public value: number,
    public description: string,
    public validate: Date,
    public purchaseDate: Date | null,
    public paymentStatus: string,
    public status: Status,
    public readonly createdAt: Date,
    public paymentDate?: Date,
    public readonly internalId?: number,
    public updatedAt?: Date,
    public client?: Client,
  ) {}

  static create(data: CreateReceivableDto): Receivable {
    return new Receivable(
      crypto.randomUUID(),
      data.clientId,
      data.value,
      data.description,
      data.validate,
      data.purchaseDate,
      "Pendente",
      Status.Active,
      new Date(),
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
    this.purchaseDate = updateData.purchaseDate ?? this.purchaseDate;
    this.validate = updateData.validate ?? this.validate;
    this.paymentDate = updateData.paymentDate ?? this.paymentDate;
    this.paymentStatus = updateData.paymentStatus ?? this.paymentStatus;
    this.updatedAt = new Date();
  }

  delete(): void {
    this.status = Status.Inactive;
  }
}
