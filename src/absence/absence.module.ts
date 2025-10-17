import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AbsenceService } from './absence.service';
import { AbsenceController } from './absence.controller';
import { Absence } from './entities/absence.entity';
import { Employee } from '../empleado/entities/empleado.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Absence, Employee]),
    NotificationsModule,
    UserModule
  ],
  controllers: [AbsenceController],
  providers: [AbsenceService],
  exports: [AbsenceService]
})
export class AbsenceModule {}
