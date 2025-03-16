import { Status } from '@prisma/client';
import { CreatePaymentDto } from '../dtos/create-payment.dto';

export class Payment {
  constructor(
    public readonly id: string,
    public idReceivable: string,
    public value: number,
    public paymentMethod: string,
    public status: Status,
    public readonly createdAt: Date,
    public updatedAt?: Date,
  ) {}

  static create(createPaymentDto: CreatePaymentDto): Payment {
    return new Payment(
      crypto.randomUUID(),
      createPaymentDto.idReceivable,
      createPaymentDto.value,
      createPaymentDto.paymentMethod,
      Status.Active,
      new Date(),
    );
  }

  update(
    updateData: Partial<
      Omit<Payment, 'id' | 'createdAt' | 'updatedAt' | 'status'>
    >,
  ): void {
    this.idReceivable = updateData.idReceivable ?? this.idReceivable;
    this.value = updateData.value ?? this.value;
    this.paymentMethod = updateData.paymentMethod ?? this.paymentMethod;
  }

  delete(): void {
    this.status = Status.Inactive;
  }
}
