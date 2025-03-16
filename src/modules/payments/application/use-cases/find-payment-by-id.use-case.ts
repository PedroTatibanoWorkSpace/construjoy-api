import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentRepositoryPort } from '../../domain/ports/payment-repository.port';
import { Payment } from '../../domain/entities/payment.entity';

@Injectable()
export class FindPaymentByIdUseCase {
  constructor(
    @Inject('PaymentRepositoryPort')
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(id: string): Promise<Payment | null> {
    try {
      const payment = await this.paymentRepository.findOne({ id });
      if (!payment) {
        throw new NotFoundException('Pagamento não encontrado');
      }
      return payment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao buscar pagamento');
    }
  }
}
