import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/empleado.entity';
import { EmpleadoService } from './empleado.service';
import { EmpleadoController } from './empleado.controller';
import { Departamento } from '../departamento/entities/departamento.entity';
import { Position } from '../position/entities/position.entity';
import { Company } from 'src/empresa/entities/empresa.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserModule } from '../user/user.module';
import { ClerkAuthGuard } from 'src/auth/guards/clerk.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, Departamento, Position, Company]),
    NotificationsModule,
    UserModule
  ],
  controllers: [EmpleadoController],
  providers: [EmpleadoService, ClerkAuthGuard]
})
export class EmpleadoModule {}
