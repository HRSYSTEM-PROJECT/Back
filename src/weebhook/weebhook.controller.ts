import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import type { Request } from 'express';
import { WebhookService } from './weebhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('stripe')
  @ApiOperation({
    summary: 'Ruta conectada con el servidro de Stripe.',
    description:
      'Ruta habilitada para las respuestas de los servidores de Stripe (no enviar nada aquí)'
  })
  async handleStripe(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string
  ) {
    const rawBody = req.body; // express.raw body
    return this.webhookService.handleEvent(rawBody, signature);
  }
}
