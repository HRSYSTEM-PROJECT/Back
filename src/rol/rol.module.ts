import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolService } from './rol.service';
import { RolController } from './rol.controller';
import { Rol } from './entities/rol.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Rol]), UserModule],
  controllers: [RolController],
  providers: [RolService],
  exports: [RolService]
})
export class RolModule {}
