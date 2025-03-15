import { Client } from '../entities/client.entity';

export interface ClientRepositoryPort {
  create(client: Client): Promise<Client>;
  findOne(where: any): Promise<Client | null>;
  findAll(where?: any): Promise<Client[]>;
  update(id: string, data: Partial<Client>): Promise<Client>;
  delete(id: string): Promise<void>;
}
