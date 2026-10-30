import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CheckCreditUseCase } from '../check-credit.use-case';
import { Client } from 'src/modules/clients/domain/entities/client.entity';
import { Receivable } from 'src/modules/receivables/domain/entities/receivable.entity';
import { RiskServiceUnavailableError } from '../../../domain/errors/risk-service-unavailable.error';

const makeClient = (overrides: Partial<Client> = {}) => {
  const client = new Client(
    'client-1',
    'joao@email.com',
    'João Silva',
    '(55) 11 99999-9999',
    '123.456.789-00',
    new Date('2025-01-01'),
    'Active',
  );
  return Object.assign(client, overrides);
};

const makeReceivable = (value: number, paymentStatus: string) =>
  new Receivable(
    crypto.randomUUID(),
    'client-1',
    value,
    'Compra',
    new Date('2026-12-01'),
    new Date('2026-01-01'),
    paymentStatus,
    'Active',
    new Date(),
  );

describe('CheckCreditUseCase', () => {
  let useCase: CheckCreditUseCase;
  let clientRepository: any;
  let receivableRepository: any;
  let riskScoring: any;

  beforeEach(async () => {
    clientRepository = { findOne: jest.fn(), update: jest.fn() };
    receivableRepository = { findAll: jest.fn() };
    riskScoring = { scoreClient: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckCreditUseCase,
        { provide: 'ClientRepositoryPort', useValue: clientRepository },
        { provide: 'ReceivableRepositoryPort', useValue: receivableRepository },
        { provide: 'RiskScoringPort', useValue: riskScoring },
      ],
    }).compile();

    useCase = module.get(CheckCreditUseCase);
  });

  it('should throw NotFoundException when client does not exist', async () => {
    clientRepository.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ clientId: 'missing', value: 100 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should allow a sale within the available limit using fresh ML data', async () => {
    clientRepository.findOne.mockResolvedValue(makeClient());
    clientRepository.update.mockImplementation((_id, c) => Promise.resolve(c));
    riskScoring.scoreClient.mockResolvedValue({
      clientId: 'client-1',
      probability: 0.1,
      score: 85,
      level: 'Baixo',
      suggestedCreditLimit: 5000,
      features: {},
    });
    receivableRepository.findAll.mockResolvedValue([
      makeReceivable(1000, 'Pendente'),
      makeReceivable(500, 'Pendente'),
    ]);

    const result = await useCase.execute({ clientId: 'client-1', value: 2000 });

    expect(result).toEqual({
      allowed: true,
      level: 'Baixo',
      score: 85,
      creditLimit: 5000,
      openBalance: 1500,
      availableLimit: 3500,
      warnings: [],
    });
    expect(clientRepository.update).toHaveBeenCalledTimes(1);
    expect(receivableRepository.findAll).toHaveBeenCalledWith({
      id_client: 'client-1',
      paymentStatus: { in: ['Pendente', 'Atrasado'] },
    });
  });

  it('should deny a sale above the available limit and warn', async () => {
    clientRepository.findOne.mockResolvedValue(makeClient());
    clientRepository.update.mockImplementation((_id, c) => Promise.resolve(c));
    riskScoring.scoreClient.mockResolvedValue({
      clientId: 'client-1',
      probability: 0.8,
      score: 20,
      level: 'Alto',
      suggestedCreditLimit: 1000,
      features: {},
    });
    receivableRepository.findAll.mockResolvedValue([
      makeReceivable(700, 'Atrasado'),
    ]);

    const result = await useCase.execute({ clientId: 'client-1', value: 500 });

    expect(result.allowed).toBe(false);
    expect(result.availableLimit).toBe(300);
    expect(result.warnings).toHaveLength(3);
    expect(result.warnings.join(' ')).toContain('excede o limite disponível');
    expect(result.warnings.join(' ')).toContain('risco alto');
    expect(result.warnings.join(' ')).toContain('1 conta(s) em atraso');
  });

  it('should fall back to stored values with a warning when ML is down', async () => {
    clientRepository.findOne.mockResolvedValue(
      makeClient({ riskScore: 60, riskLevel: 'Medio', creditLimit: 2000 }),
    );
    riskScoring.scoreClient.mockRejectedValue(new RiskServiceUnavailableError());
    receivableRepository.findAll.mockResolvedValue([
      makeReceivable(500, 'Pendente'),
    ]);

    const result = await useCase.execute({ clientId: 'client-1', value: 800 });

    expect(result.allowed).toBe(true);
    expect(result.level).toBe('Medio');
    expect(result.score).toBe(60);
    expect(result.creditLimit).toBe(2000);
    expect(result.availableLimit).toBe(1500);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('indisponível');
    expect(clientRepository.update).not.toHaveBeenCalled();
  });

  it('should not throw when ML is down and client has no stored risk data', async () => {
    clientRepository.findOne.mockResolvedValue(makeClient());
    riskScoring.scoreClient.mockRejectedValue(new RiskServiceUnavailableError());
    receivableRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute({ clientId: 'client-1', value: 800 });

    expect(result.allowed).toBe(true);
    expect(result.creditLimit).toBeNull();
    expect(result.availableLimit).toBeNull();
    expect(result.level).toBeNull();
    expect(result.warnings).toHaveLength(2);
  });

  it('should rethrow unexpected errors from the scoring port', async () => {
    clientRepository.findOne.mockResolvedValue(makeClient());
    riskScoring.scoreClient.mockRejectedValue(new Error('boom'));

    await expect(
      useCase.execute({ clientId: 'client-1', value: 100 }),
    ).rejects.toThrow('boom');
  });
});
