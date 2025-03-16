import { Payment } from '../entities/payment.entity';

export interface PaymentRepositoryPort {
  create(payment: Payment): Promise<Payment>;
  findOne(where: any): Promise<Payment | null>;
  findAll(where?: any): Promise<Payment[]>;
  update(id: string, data: Partial<Payment>): Promise<Payment>;
  delete(id: string): Promise<void>;
}
