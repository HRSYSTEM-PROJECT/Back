import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Company } from '../empresa/entities/empresa.entity';
import { Suscripcion } from '../suscripcion/entities/suscripcion.entity';
import { Employee } from '../empleado/entities/empleado.entity';
import { Notification } from './entities/notification.entity';
import { NotificationConfig } from './entities/notification-config.entity';
import { ScheduledNotification } from './entities/scheduled-notification.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      User,
      Company,
      Suscripcion,
      Employee,
      Notification,
      NotificationConfig,
      ScheduledNotification
    ]),
    UserModule
  ],
  providers: [NotificationsService, NotificationsGateway],
  controllers: [NotificationsController],
  exports: [NotificationsService, NotificationsGateway]
})
export class NotificationsModule {}
