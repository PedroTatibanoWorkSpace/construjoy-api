import { Receivable } from '../entities/receivable.entity';

export interface ReceivableRepositoryPort {
  create(receivable: Receivable): Promise<Receivable>;
  findOne(where: any): Promise<Receivable | null>;
  findAll(where?: any): Promise<Receivable[]>;
  update(id: string, data: Partial<Receivable>): Promise<Receivable>;
  delete(id: string): Promise<void>;
}
