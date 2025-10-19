import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PositionService } from './position.service';
import { PositionController } from './position.controller';
import { Position } from './entities/position.entity';
import { ClerkAuthGuard } from 'src/auth/guards/clerk.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Position])],
  controllers: [PositionController],
  providers: [PositionService, ClerkAuthGuard],
  exports: [PositionService]
})
export class PositionModule {}
