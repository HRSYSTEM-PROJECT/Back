import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from 'src/config/envs';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from 'src/empresa/entities/empresa.entity';
import { Plan } from 'src/plan/entities/plan.entity';
import { SuscripcionService } from 'src/suscripcion/suscripcion.service';

@Injectable()
export class WebhookService {
  private readonly stripe: Stripe;

  constructor(
    private readonly suscripcionService: SuscripcionService,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    @InjectRepository(Plan)
    private readonly plansRepository: Repository<Plan>
  ) {
    this.stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover'
    });
  }

  async handleEvent(rawBody: Buffer, signature: string) {
    const endpointSecret = STRIPE_WEBHOOK_SECRET;
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret
      );
    } catch (err: any) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      /**
       * ✅ Ocurre cuando el checkout se completa exitosamente.
       * Aquí se crea la nueva suscripción en Stripe.
       */
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const subscriptionId = session.subscription as string;
        const companyId = session.metadata?.companyId;
        const planId = session.metadata?.planId;

        if (!companyId || !subscriptionId) {
          throw new BadRequestException('Faltan metadatos en la sesión');
        }

        // 🔹 Obtener detalles completos de la suscripción
        const subscription: any = await this.stripe.subscriptions.retrieve(
          subscriptionId,
          {
            expand: ['items.data.price.product']
          }
        );

        // 🔹 Marcar la suscripción activa local como finalizada HOY
        await this.suscripcionService.endActiveSubscriptionForCompany(
          companyId,
          new Date()
        );

        // 🔹 Buscar el plan local
        let plan: Plan | null = null;
        if (subscription.items.data[0]) {
          const priceId = subscription.items.data[0].price.id;
          plan = await this.plansRepository.findOne({
            where: { stripe_price_id: priceId }
          });
        }
        if (!plan && planId) {
          plan = await this.plansRepository.findOne({ where: { id: planId } });
        }

        // 🔹 Crear nueva suscripción en la base de datos
        await this.suscripcionService.createFromStripe({
          companyId,
          planId: plan?.id,
          startDate: new Date(subscription.current_period_start * 1000),
          endDate: new Date(subscription.current_period_end * 1000),
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0]?.price?.id,
          stripe_customer_id: subscription.customer as string,
          status: subscription.status
        });

        break;
      }

      /**
       * ✅ Ocurre cuando Stripe actualiza una suscripción (cambio de plan, cancelación, etc.)
       */
      case 'customer.subscription.updated':
      case 'invoice.payment_succeeded':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.suscripcionService.handleStripeSubscriptionUpdate(
          subscription
        );
        break;
      }

      default:
        // Puedes loguear eventos adicionales para debugging si deseas
        console.log(`Evento ignorado: ${event.type}`);
        break;
    }

    return { received: true };
  }
}
