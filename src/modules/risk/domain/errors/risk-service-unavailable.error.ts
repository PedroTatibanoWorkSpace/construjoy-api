export class RiskServiceUnavailableError extends Error {
  constructor(message = 'Serviço de risco indisponível') {
    super(message);
    this.name = 'RiskServiceUnavailableError';
  }
}
