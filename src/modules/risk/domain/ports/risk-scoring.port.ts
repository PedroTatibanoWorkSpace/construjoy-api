export type RiskLevel = 'Baixo' | 'Medio' | 'Alto';

export interface RiskScore {
  clientId: string;
  probability: number;
  score: number;
  level: RiskLevel;
  suggestedCreditLimit: number;
  features: Record<string, number>;
}

export interface RiskScoringPort {
  scoreClient(clientId: string): Promise<RiskScore>;
  scoreBatch(clientIds?: string[]): Promise<RiskScore[]>;
}
