import { Injectable } from '@nestjs/common';
import {
  RiskScore,
  RiskScoringPort,
} from '../../../domain/ports/risk-scoring.port';
import { RiskServiceUnavailableError } from '../../../domain/errors/risk-service-unavailable.error';

const SINGLE_TIMEOUT_MS = 3000;
const BATCH_TIMEOUT_MS = 30000;

@Injectable()
export class HttpRiskScoringAdapter implements RiskScoringPort {
  private readonly baseUrl = (
    process.env.ML_SERVICE_URL ?? 'http://localhost:8001'
  ).replace(/\/$/, '');

  async scoreClient(clientId: string): Promise<RiskScore> {
    return this.request<RiskScore>(
      `/score/${encodeURIComponent(clientId)}`,
      { method: 'GET' },
      SINGLE_TIMEOUT_MS,
    );
  }

  async scoreBatch(clientIds?: string[]): Promise<RiskScore[]> {
    const response = await this.request<{ results: RiskScore[] }>(
      '/score/batch',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientIds }),
      },
      BATCH_TIMEOUT_MS,
    );
    return response.results;
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    timeoutMs: number,
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        throw new RiskServiceUnavailableError(
          `Serviço de risco respondeu ${response.status}`,
        );
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof RiskServiceUnavailableError) {
        throw error;
      }
      throw new RiskServiceUnavailableError(
        `Falha ao chamar o serviço de risco: ${(error as Error).message}`,
      );
    }
  }
}
