import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/infrastructure/persistence/prisma/prisma.module';
import { ClientsModule } from './modules/clients/clients.module';

@Module({
  imports: [
    PrismaModule,
    ClientsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
