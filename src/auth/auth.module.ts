// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { AuthService } from './auth.service';
// import { AuthController } from './auth.controller';
// import { Company } from 'src/empresa/entities/empresa.entity';
// import { User } from 'src/user/entities/user.entity';
// import { Plan } from 'src/plan/entities/plan.entity';
// import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';
// import { Rol } from 'src/rol/entities/rol.entity';
// import { ClerkService } from './clerk.service';
// import { UserModule } from 'src/user/user.module';
// import { DepartamentoModule } from '../departamento/departamento.module';
// import { PositionModule } from 'src/position/position.module';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([User, Company, Plan, Suscripcion, Rol]),
//     UserModule, DepartamentoModule, PositionModule
//   ],
//   controllers: [AuthController],
//   providers: [AuthService, ClerkService],
//   exports: [AuthService]
// })
// export class AuthModule {}

//refactor
import { forwardRef, Module } from '@nestjs/common';
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
import { DepartamentoModule } from '../departamento/departamento.module';
import { PositionModule } from 'src/position/position.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company, Plan, Suscripcion, Rol]),
    forwardRef(() => UserModule),
    forwardRef(() => DepartamentoModule),
    forwardRef(() => PositionModule)
  ],
  controllers: [AuthController],
  providers: [AuthService, ClerkService],
  exports: [AuthService, UserModule] // 👈 exportamos el UserModule también
})
export class AuthModule {}
