import { Router } from 'express';
import express from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getStripeClient } from '../services/stripe.service';
import { env } from '../config/env';
import { markOrderPaid } from '../services/order.service';
import { HttpError } from '../utils/httpError';

export const webhookRoutes = Router();

webhookRoutes.post('/', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe || !env.stripeWebhookSecret) {
    return res.json({ received: true, mode: 'demo' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) throw new HttpError(400, 'Missing Stripe signature');

  const event = stripe.webhooks.constructEvent(req.body, signature, env.stripeWebhookSecret);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (orderId) await markOrderPaid(orderId, session.id);
  }

  res.json({ received: true });
}));
