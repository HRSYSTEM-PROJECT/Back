import { Plans } from '../enums/plan.enum';
export const plans_data = [
  { name: Plans.FREE, price: 0.0, duration_days: 30 },
  {
    name: Plans.PREMIUM,
    price: 100.0,
    stripe_price_id: 'price_1SJ0cI8G9Ja1HpPE6K4hKEzu',
    duration_days: 30
  },
  {
    name: Plans.ENTERPRISE,
    price: 150.0,
    stripe_price_id: 'price_1SJQ8w8G9Ja1HpPEs9aXa3BA',
    duration_days: 30
  }
];
