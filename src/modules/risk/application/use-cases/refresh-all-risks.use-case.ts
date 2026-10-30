import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientRepositoryPort } from 'src/modules/clients/domain/ports/client-repository.port';
import {
  RiskScore,
  RiskScoringPort,
} from '../../domain/ports/risk-scoring.port';
import { RiskServiceUnavailableError } from '../../domain/errors/risk-service-unavailable.error';

@Injectable()
export class RefreshAllRisksUseCase {
  constructor(
    @Inject('ClientRepositoryPort')
    private readonly clientRepository: ClientRepositoryPort,
    @Inject('RiskScoringPort')
    private readonly riskScoring: RiskScoringPort,
  ) {}

  async execute(): Promise<{ total: number; updated: number }> {
    const clients = await this.clientRepository.findAll();

    let results: RiskScore[];
    try {
      results = await this.riskScoring.scoreBatch(clients.map((c) => c.id));
    } catch (error) {
      if (error instanceof RiskServiceUnavailableError) {
        throw new ServiceUnavailableException(error.message);
      }
      throw error;
    }

    const byClient = new Map(results.map((r) => [r.clientId, r]));
    let updated = 0;

    for (const client of clients) {
      const risk = byClient.get(client.id);
      if (!risk) continue;
      client.applyRisk({
        score: risk.score,
        level: risk.level,
        probability: risk.probability,
        creditLimit: risk.suggestedCreditLimit,
      });
      await this.clientRepository.update(client.id, client);
      updated++;
    }

    return { total: clients.length, updated };
  }
}
