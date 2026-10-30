import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientRepositoryPort } from 'src/modules/clients/domain/ports/client-repository.port';
import { ReceivableRepositoryPort } from 'src/modules/receivables/domain/ports/receivable-repository.port';
import { RiskScoringPort } from '../../domain/ports/risk-scoring.port';
import { RiskServiceUnavailableError } from '../../domain/errors/risk-service-unavailable.error';
import { CreditCheckDto } from '../dtos/credit-check.dto';

export interface CreditCheckResult {
  allowed: boolean;
  level: string | null;
  score: number | null;
  creditLimit: number | null;
  openBalance: number;
  availableLimit: number | null;
  warnings: string[];
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

@Injectable()
export class CheckCreditUseCase {
  constructor(
    @Inject('ClientRepositoryPort')
    private readonly clientRepository: ClientRepositoryPort,
    @Inject('ReceivableRepositoryPort')
    private readonly receivableRepository: ReceivableRepositoryPort,
    @Inject('RiskScoringPort')
    private readonly riskScoring: RiskScoringPort,
  ) {}

  async execute({ clientId, value }: CreditCheckDto): Promise<CreditCheckResult> {
    const client = await this.clientRepository.findOne({ id: clientId });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const warnings: string[] = [];

    try {
      const risk = await this.riskScoring.scoreClient(clientId);
      client.applyRisk({
        score: risk.score,
        level: risk.level,
        probability: risk.probability,
        creditLimit: risk.suggestedCreditLimit,
      });
      await this.clientRepository.update(clientId, client);
    } catch (error) {
      if (!(error instanceof RiskServiceUnavailableError)) {
        throw error;
      }
      warnings.push(
        'Serviço de risco indisponível: usando os últimos valores gravados do cliente.',
      );
    }

    const openReceivables = await this.receivableRepository.findAll({
      id_client: clientId,
      paymentStatus: { in: ['Pendente', 'Atrasado'] },
    });
    const openBalance = openReceivables.reduce((sum, r) => sum + r.value, 0);
    const overdueCount = openReceivables.filter(
      (r) => r.paymentStatus === 'Atrasado',
    ).length;

    const creditLimit = client.creditLimit ?? null;
    const availableLimit =
      creditLimit === null ? null : Math.max(creditLimit - openBalance, 0);

    if (creditLimit === null) {
      warnings.push('Cliente sem limite de crédito calculado: limite não aplicado.');
    } else if (value > (availableLimit as number)) {
      warnings.push(
        `Valor da venda excede o limite disponível de ${formatCurrency(availableLimit as number)}.`,
      );
    }
    if (client.riskLevel === 'Alto') {
      warnings.push('Cliente classificado com risco alto de inadimplência.');
    }
    if (overdueCount > 0) {
      warnings.push(`Cliente possui ${overdueCount} conta(s) em atraso.`);
    }

    return {
      allowed: availableLimit === null || value <= availableLimit,
      level: client.riskLevel ?? null,
      score: client.riskScore ?? null,
      creditLimit,
      openBalance,
      availableLimit,
      warnings,
    };
  }
}
