import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/empresa.entity';
import { EmpresaService } from './empresa.service';
import { EmpresaController } from './empresa.controller';
import { DepartamentoModule } from 'src/departamento/departamento.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company, DepartamentoModule])],
  controllers: [EmpresaController],
  providers: [EmpresaService]
})
export class EmpresaModule {}
