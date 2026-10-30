import { Test, TestingModule } from '@nestjs/testing';
import { MarkOverdueReceivablesUseCase } from '../mark-overdue-receivables.use-case';
import { Receivable } from '../../../domain/entities/receivable.entity';

const makeReceivable = (id: string, validate: Date, paymentStatus: string) =>
  new Receivable(
    id,
    'client-1',
    100,
    'Compra',
    validate,
    new Date('2025-01-01'),
    paymentStatus,
    'Active',
    new Date(),
  );

describe('MarkOverdueReceivablesUseCase', () => {
  let useCase: MarkOverdueReceivablesUseCase;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      findAll: jest.fn(),
      update: jest.fn().mockImplementation((_id, r) => Promise.resolve(r)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarkOverdueReceivablesUseCase,
        { provide: 'ReceivableRepositoryPort', useValue: mockRepository },
      ],
    }).compile();

    useCase = module.get(MarkOverdueReceivablesUseCase);
  });

  it('should query only expired receivables that are not paid or already overdue', async () => {
    mockRepository.findAll.mockResolvedValue([]);
    const now = new Date('2026-06-01');

    await useCase.execute(now);

    expect(mockRepository.findAll).toHaveBeenCalledWith({
      validate: { lt: now },
      paymentStatus: { notIn: ['Atrasado', 'Pago'] },
    });
  });

  it('should mark each returned receivable as Atrasado and return the count', async () => {
    const a = makeReceivable('a', new Date('2026-01-01'), 'Pendente');
    const b = makeReceivable('b', new Date('2026-02-01'), 'Pendente');
    mockRepository.findAll.mockResolvedValue([a, b]);

    const total = await useCase.execute(new Date('2026-06-01'));

    expect(total).toBe(2);
    expect(mockRepository.update).toHaveBeenCalledTimes(2);
    expect(mockRepository.update).toHaveBeenCalledWith('a', expect.objectContaining({ paymentStatus: 'Atrasado' }));
    expect(mockRepository.update).toHaveBeenCalledWith('b', expect.objectContaining({ paymentStatus: 'Atrasado' }));
  });

  it('should not update anything when there is nothing overdue', async () => {
    mockRepository.findAll.mockResolvedValue([]);

    const total = await useCase.execute();

    expect(total).toBe(0);
    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('should propagate repository failures', async () => {
    mockRepository.findAll.mockRejectedValue(new Error('DB down'));

    await expect(useCase.execute()).rejects.toThrow('DB down');
  });
});
