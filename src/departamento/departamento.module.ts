import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartamentoService } from './departamento.service';
import { DepartamentoController } from './departamento.controller';
import { Departamento } from './entities/departamento.entity';
import { ClerkAuthGuard } from 'src/auth/guards/clerk.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Departamento])],
  controllers: [DepartamentoController],
  providers: [DepartamentoService],
  exports: [DepartamentoService, ClerkAuthGuard]
})
export class DepartamentoModule {}
