import {
  Injectable,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from 'src/config/envs';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from 'src/empresa/entities/empresa.entity';
import { Plan } from 'src/plan/entities/plan.entity';
import { Suscripcion } from 'src/suscripcion/entities/suscripcion.entity';
import { SuscripcionService } from 'src/suscripcion/suscripcion.service';

@Injectable()
export class WebhookService {
  private stripe: Stripe;

  constructor(
    private readonly suscripcionService: SuscripcionService,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    @InjectRepository(Plan)
    private readonly plansRepository: Repository<Plan>,
    @InjectRepository(Suscripcion)
    private readonly suscripcionesRepository: Repository<Suscripcion>
  ) {
    this.stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover'
    });
  }

  async handleEvent(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      //------------Evita hacer llamadas inecesarias a la DB-----------//
      case 'customer.subscription.created':
        console.log(
          'Evento ignorado intencionalmente (Stripe lo crea automáticamente)'
        );
        break;

      //------------Cuando el pago se completa con éxtito-----------//
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const subscriptionId = session.subscription as string;
        const companyId = session.metadata?.companyId;
        const planId = session.metadata?.planId;

        if (!companyId || !subscriptionId) {
          throw new BadRequestException('Faltan metadatos en la sesión');
        }

        //  Obtener detalles completos de la suscripción
        const subscription: any = await this.stripe.subscriptions.retrieve(
          subscriptionId,
          {
            expand: ['items.data.price.product']
          }
        );

        // // Finalizar la suscripción activa (FREE)
        // await this.suscripcionService.endActiveSubscriptionForCompany(
        //   companyId,
        //   new Date()
        // );

        // Buscar el plan correspondiente en la DB
        let plan: Plan | null = null;
        const priceId = subscription.items.data[0]?.price?.id;
        if (priceId) {
          plan = await this.plansRepository.findOne({
            where: { stripe_price_id: priceId }
          });
        }
        if (!plan && planId) {
          plan = await this.plansRepository.findOne({ where: { id: planId } });
        }

        if (!plan) {
          throw new NotFoundException('Plan asociado no encontrado');
        }

        // Calcular fechas locales de la suscripción
        let startDate: Date;
        let endDate: Date;

        if (
          subscription.current_period_start &&
          subscription.current_period_end
        ) {
          // Stripe devolvió timestamps válidos
          startDate = new Date(subscription.current_period_start * 1000);
          endDate = new Date(subscription.current_period_end * 1000);
        } else {
          // Stripe no devolvió fechas, calculamos por el plan local
          startDate = new Date();
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + (plan?.duration_days ?? 30));
        }

        // Actualizar la suscripcion existente en la base de datos con los datos de Stripe
        await this.suscripcionService.updateFromStripe(companyId, {
          planId: plan.id,
          startDate,
          endDate,
          stripe_subscription_id: subscription.id,
          stripe_price_id: priceId,
          stripe_customer_id: subscription.customer as string,
          status: subscription.status
        });

        break;
      }

      //------------Cuando Stripe Actualiza una Suscripcion (Cambio de fechas, plan)-----------//
      case 'customer.subscription.updated':
      case 'invoice.payment_succeeded': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.suscripcionService.handleStripeSubscriptionUpdate(
          subscription
        );
        break;
      }

      //------------Cuando se cancela una Suscripción-----------//
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.suscripcionService.handleStripeCancellation(subscription);
        break;
      }

      default:
        console.log(`Evento ignorado: ${event.type}`);
        break;
    }

    return { received: true };
  }
}
