import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Company } from 'src/empresa/entities/empresa.entity';
import { User } from 'src/user/entities/user.entity';
import { Plan } from 'src/plan/entities/plan.entity';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';
import { Rol } from 'src/rol/entities/rol.entity';
import { Auth0Service } from './auth0.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company, Plan, Suscripcion, Rol]),
    HttpModule
  ],
  controllers: [AuthController],
  providers: [AuthService, ClerkService],
  exports: [AuthService]
})
export class AuthModule {}
