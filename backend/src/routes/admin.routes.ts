import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { query } from '../db/pool';
import { updateOrderStatus } from '../services/order.service';

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireRole('admin'));

adminRoutes.get('/users', asyncHandler(async (_req, res) => {
  const result = await query(
    `SELECT id, name, email, role, is_email_verified, created_at FROM users ORDER BY created_at DESC`
  );
  res.json(result.rows);
}));

adminRoutes.get('/orders', asyncHandler(async (_req, res) => {
  const result = await query(
    `SELECT o.id, o.status, o.total_cents, o.created_at, u.email AS customer_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  );
  res.json(result.rows);
}));

adminRoutes.patch('/orders/:id/status', asyncHandler(async (req, res) => {
  const body = z.object({ status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']) }).parse(req.body);
  res.json(await updateOrderStatus(req.params.id, body.status));
}));

adminRoutes.get('/products', asyncHandler(async (_req, res) => {
  const result = await query(
    `SELECT p.*, c.name AS category_name, u.email AS seller_email
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN users u ON u.id = p.seller_id
     ORDER BY p.created_at DESC`
  );
  res.json(result.rows);
}));

adminRoutes.patch('/products/:id', asyncHandler(async (req, res) => {
  const body = z.object({ isActive: z.boolean() }).parse(req.body);
  const result = await query(
    `UPDATE products SET is_active = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [req.params.id, body.isActive]
  );
  res.json(result.rows[0]);
}));
