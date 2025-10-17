import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookService } from './weebhook.service';
import { WebhookController } from './weebhook.controller';
import { SuscripcionService } from 'src/suscripcion/suscripcion.service';
import { Company } from 'src/empresa/entities/empresa.entity';
import { Plan } from 'src/plan/entities/plan.entity';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';
import { UserModule } from 'src/user/user.module';
import { SuscripcionModule } from 'src/suscripcion/suscripcion.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Plan, Suscripcion]),
    UserModule,
    SuscripcionModule,
    NotificationsModule
  ],
  controllers: [WebhookController],
  providers: [WebhookService, SuscripcionService]
})
export class WeebhookModule {}
