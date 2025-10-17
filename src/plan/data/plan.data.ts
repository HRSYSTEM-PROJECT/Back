import { Plans } from '../enums/plan.enum';
export const plans_data = [
  { name: Plans.FREE, price: 0.0, duration_days: 30 },
  {
    name: Plans.PREMIUM,
    price: 100.0,
    stripe_price_id: 'prod_TFVdtbmnYVrExC',
    duration_days: 30
  },
  { name: Plans.ENTERPRISE, price: 150.0, duration_days: 30 }
];
