import { Controller, Post, Body } from '@nestjs/common';
import { StripeService } from './stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('checkout')
  async createCheckout(@Body() body: { companyId: string; planId: string }) {
    const session = await this.stripeService.createCheckoutSession(
      body.companyId,
      body.planId
    );
    return { url: session.url, sessionId: session.id };
  }

  @Post('cancel')
  async cancel(@Body() body: { companyId: string }) {
    return this.stripeService.cancelActiveSubscription(body.companyId);
  }
}
