import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/infrastructure/persistence/prisma/prisma.module';
import { ClientModule } from './modules/clients/client.module';
import { UserModule } from './modules/users/user.module';
import { PaymentModule } from './modules/payments/payment.module';
import { ReceivableModule } from './modules/receivables/receivable.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RiskModule } from './modules/risk/risk.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    ClientModule,
    UserModule,
    PaymentModule,
    ReceivableModule,
    AnalyticsModule,
    RiskModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
