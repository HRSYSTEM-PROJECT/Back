import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  ForbiddenException
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ApiOperation, ApiBody } from '@nestjs/swagger';
import { ClerkAuthGuard } from 'src/auth/guards/clerk.guard';
import type { AuthRequest } from 'src/interfaces/authrequest.interface';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'src/rol/enums/role.enum';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Roles(Role.SUPER_ADMIN, Role.COMPANY_OWNER)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Post('checkout')
  @ApiOperation({
    summary: 'Actualiza a una suscripcion de pago.',
    description: 'Actualiza una suscripción para una empresa autenticada'
  })
  @ApiBody({
    schema: {
      type: 'object', // JSON object
      properties: {
        companyId: {
          type: 'string', // companyId
          description: 'The ID of the company.',
          example: 'a1b2c3d4e5f6'
        },
        planId: {
          type: 'string', // planId
          description: 'The ID of the subscription plan.',
          example: 'plan_xyz789'
        }
      },
      required: ['companyId', 'planId']
    }
  })
  async createCheckout(
    @Body() body: { companyId: string; planId: string },
    @Req() req: AuthRequest
  ) {
    //Validad que empresa que solicita sea la misma que inció sesión
    if (req.user.companyId !== body.companyId) {
      throw new ForbiddenException('Not authorized for this company');
    }

    const session = await this.stripeService.createCheckoutSession(
      body.companyId,
      body.planId
    );
    return { url: session.url, sessionId: session.id };
  }

  @Roles(Role.SUPER_ADMIN, Role.COMPANY_OWNER)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @Post('cancel')
  @ApiOperation({
    summary: 'Cancela a una suscripcion de pago.',
    description: 'Cancela una suscripción para una empresa autenticada'
  })
  @ApiBody({
    schema: {
      type: 'object', // JSON object
      properties: {
        companyId: {
          type: 'string', // companyId
          description: 'The ID of the company.',
          example: 'a1b2c3d4e5f6'
        }
      },
      required: ['companyId']
    }
  })
  async cancel(@Body() body: { companyId: string }, @Req() req: AuthRequest) {
    //Validad que empresa que solicita sea la misma que inció sesión
    if (req.user.companyId !== body.companyId) {
      throw new ForbiddenException('Not authorized for this company');
    }

    return this.stripeService.cancelActiveSubscription(body.companyId);
  }
}
