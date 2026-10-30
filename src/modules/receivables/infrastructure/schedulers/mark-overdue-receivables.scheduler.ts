import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MarkOverdueReceivablesUseCase } from '../../application/use-cases/mark-overdue-receivables.use-case';

@Injectable()
export class MarkOverdueReceivablesScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(MarkOverdueReceivablesScheduler.name);

  constructor(private readonly markOverdueReceivablesUseCase: MarkOverdueReceivablesUseCase) {}

  async onApplicationBootstrap() {
    await this.run();
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async run() {
    try {
      const total = await this.markOverdueReceivablesUseCase.execute();
      this.logger.log(`${total} conta(s) a receber marcadas como atrasadas.`);
    } catch (error) {
      this.logger.error('Erro ao marcar contas atrasadas', error);
    }
  }
}
