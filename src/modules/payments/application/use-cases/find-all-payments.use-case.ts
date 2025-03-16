import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PaymentRepositoryPort } from '../../domain/ports/payment-repository.port';
import { Payment } from '../../domain/entities/payment.entity';

@Injectable()
export class FindAllPaymentsUseCase {
  constructor(
    @Inject('PaymentRepositoryPort')
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(): Promise<Payment[]> {
    try {
      return this.paymentRepository.findAll();
    } catch (error) {
      throw new InternalServerErrorException('Erro ao buscar pagamentos');
    }
  }
}
