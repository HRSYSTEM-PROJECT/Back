import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/empresa.entity';
import { EmpresaService } from './empresa.service';
import { EmpresaController } from './empresa.controller';
import { DepartamentoModule } from '../departamento/departamento.module';
import { PositionModule } from '../position/position.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company, DepartamentoModule, PositionModule])],
  controllers: [EmpresaController],
  providers: [EmpresaService]
})
export class EmpresaModule {}
