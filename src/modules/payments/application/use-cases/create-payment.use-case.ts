import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PaymentRepositoryPort } from '../../domain/ports/payment-repository.port';
import { Payment } from '../../domain/entities/payment.entity';
import { CreatePaymentDto } from '../../domain/dtos/create-payment.dto';

@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject('PaymentRepositoryPort')
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    try {
      const payment = Payment.create(createPaymentDto);
      return await this.paymentRepository.create(payment);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao criar pagamento');
    }
  }
}
