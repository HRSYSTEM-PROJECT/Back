import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuscripcionService } from './suscripcion.service';
import { SuscripcionController } from './suscripcion.controller';
import { Suscripcion } from './entities/suscripcion.entity';
import { Plan } from '../plan/entities/plan.entity';
import { Company } from '../empresa/entities/empresa.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Suscripcion, Plan, Company]),
    NotificationsModule,
    UserModule
  ],
  controllers: [SuscripcionController],
  providers: [SuscripcionService],
  exports: [SuscripcionService]
})
export class SuscripcionModule {}
