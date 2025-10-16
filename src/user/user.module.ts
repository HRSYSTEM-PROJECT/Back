import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Rol } from 'src/rol/entities/rol.entity';
import { Company } from 'src/empresa/entities/empresa.entity';
import { Employee } from 'src/empleado/entities/empleado.entity';
import { ClerkService } from 'src/auth/clerk.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Rol, Company, Employee])],
  controllers: [UserController],
  providers: [UserService, ClerkService],
  exports: [UserService]
})
export class UserModule {}
