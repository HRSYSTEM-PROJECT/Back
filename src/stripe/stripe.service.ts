import { Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from 'src/empresa/entities/empresa.entity';
import { Plan } from 'src/plan/entities/plan.entity';
import { STRIPE_SECRET_KEY } from 'src/config/envs';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    @InjectRepository(Plan)
    private readonly plansRepository: Repository<Plan>
  ) {
    this.stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover'
    });
  }

  // Crear Checkout Session para subscriptions
  async createCheckoutSession(companyId: string, planId: string) {
    const company = await this.companiesRepository.findOne({
      where: { id: companyId }
    });
    const plan = await this.plansRepository.findOne({ where: { id: planId } });

    if (!company || !plan)
      throw new NotFoundException('Company or Plan not found');
    if (!plan.stripe_price_id)
      throw new NotFoundException('Plan has no stripe_price_id');

    // Crear cliente en Stripe si no existe
    let customerId = company.stripe_customer_id;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: company.email,
        name: company.legal_name,
        metadata: { companyId: company.id }
      });
      company.stripe_customer_id = customer.id;
      await this.companiesRepository.save(company);
      customerId = customer.id;
    }

    // Colocamos planId en metadata para luego identificar desde el webhook
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/dashboard?paymentSuccess=true?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/`,
      metadata: { companyId: company.id, planId: plan.id }
    });

    return session;
  }

  // Cancelar suscripción (set cancel_at_period_end = true)
  async cancelActiveSubscription(companyId: string) {
    const company = await this.companiesRepository.findOne({
      where: { id: companyId }
    });
    if (!company?.stripe_customer_id)
      throw new NotFoundException('No stripe customer');

    // Encontrar suscripción activa en Stripe
    const subs = await this.stripe.subscriptions.list({
      customer: company.stripe_customer_id,
      status: 'active',
      limit: 1
    });

    if (subs.data.length === 0) {
      throw new NotFoundException('No active subscription on Stripe');
    }
    const subscription = subs.data[0];
    await this.stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true
    });

    return { message: 'cancel_marked', subscriptionId: subscription.id };
  }
}
