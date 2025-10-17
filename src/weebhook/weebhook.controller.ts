import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException
} from '@nestjs/common';

import type { Request } from 'express';
import { WebhookService } from './weebhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('stripe')
  async handleStripe(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string
  ) {
    const rawBody = req.body; // express.raw body
    return this.webhookService.handleEvent(rawBody, signature);
  }
}
