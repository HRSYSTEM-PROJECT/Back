import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Company } from 'src/empresa/entities/empresa.entity';
import { User } from 'src/user/entities/user.entity';
import { Plan } from 'src/plan/entities/plan.entity';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';
import { Rol } from 'src/rol/entities/rol.entity';
import { ClerkService } from './clerk.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company, Plan, Suscripcion, Rol]),
    UserModule
  ],
  controllers: [AuthController],
  providers: [AuthService, ClerkService],
  exports: [AuthService]
})
export class AuthModule {}
