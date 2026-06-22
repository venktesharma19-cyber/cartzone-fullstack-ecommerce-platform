import Stripe from 'stripe';
import { env } from '../config/env';
import { query } from '../db/pool';

const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, { apiVersion: '2024-06-20' as any })
  : null;

export async function createCheckoutUrl(orderId: string) {
  const orderResult = await query(
    `SELECT o.id, o.total_cents, u.email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     WHERE o.id = $1`,
    [orderId]
  );
  const order = orderResult.rows[0];

  if (!stripe) {
    return `${env.frontendUrl}/checkout/success?orderId=${orderId}&demo=true`;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: order.email,
    success_url: `${env.frontendUrl}/checkout/success?orderId=${orderId}`,
    cancel_url: `${env.frontendUrl}/cart`,
    metadata: { orderId },
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: order.total_cents,
          product_data: { name: `CartZone Order ${order.id}` }
        },
        quantity: 1
      }
    ]
  });

  return session.url ?? `${env.frontendUrl}/orders/${orderId}`;
}

export function getStripeClient() {
  return stripe;
}
