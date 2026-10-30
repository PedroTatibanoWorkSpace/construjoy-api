import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientRepositoryPort } from 'src/modules/clients/domain/ports/client-repository.port';
import { Client } from 'src/modules/clients/domain/entities/client.entity';
import { RiskScoringPort } from '../../domain/ports/risk-scoring.port';
import { RiskServiceUnavailableError } from '../../domain/errors/risk-service-unavailable.error';

@Injectable()
export class RefreshClientRiskUseCase {
  constructor(
    @Inject('ClientRepositoryPort')
    private readonly clientRepository: ClientRepositoryPort,
    @Inject('RiskScoringPort')
    private readonly riskScoring: RiskScoringPort,
  ) {}

  async execute(clientId: string): Promise<Client> {
    const client = await this.clientRepository.findOne({ id: clientId });
    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    try {
      const risk = await this.riskScoring.scoreClient(clientId);
      client.applyRisk({
        score: risk.score,
        level: risk.level,
        probability: risk.probability,
        creditLimit: risk.suggestedCreditLimit,
      });
    } catch (error) {
      if (error instanceof RiskServiceUnavailableError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw error;
    }

    return this.clientRepository.update(clientId, client);
  }
}
