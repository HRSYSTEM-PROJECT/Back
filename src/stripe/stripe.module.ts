import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { UserModule } from 'src/user/user.module';
import { Company } from 'src/empresa/entities/empresa.entity';
import { Plan } from 'src/plan/entities/plan.entity';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, Plan, Suscripcion]), UserModule],
  controllers: [StripeController],
  providers: [StripeService]
})
export class StripeModule {}
