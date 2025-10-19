// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { DepartamentoService } from './departamento.service';
// import { DepartamentoController } from './departamento.controller';
// import { Departamento } from './entities/departamento.entity';
// import { ClerkAuthGuard } from 'src/auth/guards/clerk.guard';
// import { AuthModule } from 'src/auth/auth.module';

// @Module({
//   imports: [TypeOrmModule.forFeature([Departamento]), AuthModule],
//   controllers: [DepartamentoController],
//   providers: [DepartamentoService, ClerkAuthGuard],
//   exports: [DepartamentoService]
// })
// export class DepartamentoModule {}

//refactor
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartamentoService } from './departamento.service';
import { DepartamentoController } from './departamento.controller';
import { Departamento } from './entities/departamento.entity';
import { ClerkAuthGuard } from 'src/auth/guards/clerk.guard';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Departamento]),
    forwardRef(() => AuthModule)
  ],
  controllers: [DepartamentoController],
  providers: [DepartamentoService, ClerkAuthGuard],
  exports: [DepartamentoService]
})
export class DepartamentoModule {}
