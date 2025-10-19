// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { PositionService } from './position.service';
// import { PositionController } from './position.controller';
// import { Position } from './entities/position.entity';
// import { ClerkAuthGuard } from 'src/auth/guards/clerk.guard';
// import { AuthModule } from 'src/auth/auth.module';

// @Module({
//   imports: [TypeOrmModule.forFeature([Position]), AuthModule],
//   controllers: [PositionController],
//   providers: [PositionService, ClerkAuthGuard],
//   exports: [PositionService]
// })
// export class PositionModule {}

//refactor
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PositionService } from './position.service';
import { PositionController } from './position.controller';
import { Position } from './entities/position.entity';
import { ClerkAuthGuard } from 'src/auth/guards/clerk.guard';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Position]),
    forwardRef(() => AuthModule)
  ],
  controllers: [PositionController],
  providers: [PositionService, ClerkAuthGuard],
  exports: [PositionService]
})
export class PositionModule {}
