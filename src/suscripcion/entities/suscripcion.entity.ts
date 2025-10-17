import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne
} from 'typeorm';
import { Company } from '../../empresa/entities/empresa.entity';
import { Plan } from '../../plan/entities/plan.entity';

@Entity('subscriptions')
export class Suscripcion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  start_date: Date;

  @Column({ type: 'timestamp' })
  end_date: Date;

  // NUEVOS CAMPOS:
  @Column({ nullable: true })
  stripe_subscription_id: string;

  @Column({ nullable: true })
  stripe_price_id: string;

  @Column({ nullable: true })
  stripe_customer_id: string;

  @Column({ nullable: true })
  status: string; // active | canceled | incomplete | trialing etc.

  @OneToOne(() => Company, (companie) => companie.suscripciones)
  company: Company;

  @ManyToOne(() => Plan, (plan) => plan.suscripciones)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;
}
