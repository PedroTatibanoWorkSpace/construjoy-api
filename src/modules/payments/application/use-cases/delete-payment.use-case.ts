import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentRepositoryPort } from '../../domain/ports/payment-repository.port';

@Injectable()
export class DeletePaymentUseCase {
  constructor(
    @Inject('PaymentRepositoryPort')
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    try {
      const payment = await this.paymentRepository.findOne({ id });
      if (!payment) {
        throw new NotFoundException('Pagamento não encontrado');
      }

      await this.paymentRepository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao deletar pagamento');
    }
  }
}
