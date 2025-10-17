import 'dotenv/config';

export const FRONTEND_URL = process.env.FRONTEND_URL;
export const JWT_SECRET = process.env.JWT_SECRET;
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
export const BACKEND_URL = process.env.BACKEND_URL;

// SendGrid Configuration
export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
export const SENDGRID_FROM = process.env.SENDGRID_FROM;
