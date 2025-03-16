import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentRepositoryPort } from '../../domain/ports/payment-repository.port';
import { Payment } from '../../domain/entities/payment.entity';
import { UpdatePaymentDto } from '../dtos/update-payment.dto';

@Injectable()
export class UpdatePaymentUseCase {
  constructor(
    @Inject('PaymentRepositoryPort')
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    try {
      const payment = await this.paymentRepository.findOne({ id });
      if (!payment) {
        throw new NotFoundException('Pagamento não encontrado');
      }

      payment.update(updatePaymentDto);
      return this.paymentRepository.update(id, payment);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao atualizar pagamento');
    }
  }
}
