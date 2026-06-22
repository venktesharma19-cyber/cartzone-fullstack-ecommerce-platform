import { Router } from 'express';
import { z } from 'zod';
import { optionalCartSession, requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { createPendingOrderFromCart, markOrderPaid, updateOrderStatus } from '../services/order.service';
import { createCheckoutUrl } from '../services/stripe.service';
import { query } from '../db/pool';
import { HttpError } from '../utils/httpError';

export const orderRoutes = Router();

orderRoutes.post('/checkout', requireAuth, optionalCartSession, asyncHandler(async (req, res) => {
  const body = z.object({
    shippingAddress: z.object({
      name: z.string().min(2),
      line1: z.string().min(3),
      city: z.string().min(2),
      state: z.string().min(2),
      zip: z.string().min(3)
    })
  }).parse(req.body);

  const order = await createPendingOrderFromCart(req.user!.id, req.cartSessionId!, body.shippingAddress);
  const checkoutUrl = await createCheckoutUrl(order.id);

  if (checkoutUrl.includes('demo=true')) {
    await markOrderPaid(order.id, 'demo-session');
  }

  res.status(201).json({ order, checkoutUrl });
}));

orderRoutes.use(requireAuth);

orderRoutes.get('/', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, status, total_cents, shipping_address, created_at, updated_at
     FROM orders
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [req.user!.id]
  );
  res.json(result.rows);
}));

orderRoutes.get('/:id', asyncHandler(async (req, res) => {
  const order = await query(
    `SELECT * FROM orders WHERE id = $1 AND (user_id = $2 OR $3 = 'admin')`,
    [req.params.id, req.user!.id, req.user!.role]
  );
  if (!order.rowCount) throw new HttpError(404, 'Order not found');

  const items = await query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
  res.json({ ...order.rows[0], items: items.rows });
}));

orderRoutes.get('/:id/status/stream', asyncHandler(async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendStatus = async () => {
    const result = await query('SELECT status, updated_at FROM orders WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.id]);
    if (!result.rowCount) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Order not found' })}\n\n`);
      return;
    }
    res.write(`data: ${JSON.stringify(result.rows[0])}\n\n`);
  };

  await sendStatus();
  const interval = setInterval(sendStatus, 5000);
  req.on('close', () => clearInterval(interval));
}));

orderRoutes.patch('/:id/status', requireRole('seller', 'admin'), asyncHandler(async (req, res) => {
  const body = z.object({ status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']) }).parse(req.body);
  res.json(await updateOrderStatus(req.params.id, body.status));
}));
