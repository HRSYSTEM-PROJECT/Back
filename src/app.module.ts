// src/app.module.ts
import { Module } from '@nestjs/common';
import { SameSiteNoneMiddleware } from './middlewares/samesite.middleware';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/typeorm.config';
import { JwtModule } from '@nestjs/jwt';

import { AppController } from './app.controller';
import { EmpresaModule } from './empresa/empresa.module';
import { EmpleadoModule } from './empleado/empleado.module';
import { SuscripcionModule } from './suscripcion/suscripcion.module';
import { DepartamentoModule } from './departamento/departamento.module';
import { PlanModule } from './plan/plan.module';
import { RolModule } from './rol/rol.module';
import { PositionModule } from './position/position.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AbsenceModule } from './absence/absence.module';
import { ContactModule } from './contact/contact.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { JWT_SECRET } from './config/envs';

//--------------SEEDER----------------//
import { AppService } from './app.service';
import { PlanService } from './plan/plan.service';
import { RolService } from './rol/rol.service';
import { DepartamentoService } from './departamento/departamento.service';
import { PositionService } from './position/position.service';
import { Plan } from './plan/entities/plan.entity';
import { Rol } from './rol/entities/rol.entity';
import { Departamento } from './departamento/entities/departamento.entity';
import { Position } from './position/entities/position.entity';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getTypeOrmConfig
    }),
    JwtModule.register({
      global: true,
      secret: JWT_SECRET,
      signOptions: { expiresIn: '10h' }
    }),
    EmpresaModule,
    EmpleadoModule,
    DepartamentoModule,
    SuscripcionModule,
    PlanModule,
    RolModule,
    PositionModule,
    AuthModule,
    UserModule,
    AbsenceModule,
    ContactModule,
    NotificationsModule,
    ChatModule,
    TypeOrmModule.forFeature([Plan, Rol, Departamento, Position])
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PlanService,
    RolService,
    DepartamentoService,
    PositionService
  ]
})
export class AppModule {}
