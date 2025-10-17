import { Module } from '@nestjs/common';
import { WebhookService } from './weebhook.service';
import { WebhookController } from './weebhook.controller';
import { SuscripcionService } from 'src/suscripcion/suscripcion.service';

@Module({
  controllers: [WebhookController],
  providers: [WebhookService, SuscripcionService]
})
export class WeebhookModule {}
