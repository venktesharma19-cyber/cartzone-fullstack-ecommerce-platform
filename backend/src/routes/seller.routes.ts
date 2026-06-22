import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { query } from '../db/pool';
import { HttpError } from '../utils/httpError';

export const sellerRoutes = Router();

sellerRoutes.use(requireAuth, requireRole('seller', 'admin'));

sellerRoutes.get('/dashboard', asyncHandler(async (req, res) => {
  const products = await query(
    `SELECT p.*, c.name AS category_name FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.seller_id = $1
     ORDER BY p.created_at DESC`,
    [req.user!.id]
  );

  const sales = await query(
    `SELECT COUNT(DISTINCT oi.order_id)::int AS orders,
            COALESCE(SUM(oi.quantity), 0)::int AS units_sold,
            COALESCE(SUM(oi.quantity * oi.unit_price_cents), 0)::int AS revenue_cents
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE oi.seller_id = $1 AND o.status <> 'cancelled'`,
    [req.user!.id]
  );

  res.json({ products: products.rows, sales: sales.rows[0] });
}));

sellerRoutes.post('/products', asyncHandler(async (req, res) => {
  const body = z.object({
    categoryId: z.string().uuid(),
    name: z.string().min(3),
    description: z.string().min(10),
    priceCents: z.number().int().min(1),
    inventory: z.number().int().min(0),
    imageUrl: z.string().url().optional().or(z.literal(''))
  }).parse(req.body);

  const result = await query(
    `INSERT INTO products (seller_id, category_id, name, description, price_cents, inventory, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [req.user!.id, body.categoryId, body.name, body.description, body.priceCents, body.inventory, body.imageUrl || null]
  );

  res.status(201).json(result.rows[0]);
}));

sellerRoutes.patch('/products/:id', asyncHandler(async (req, res) => {
  const body = z.object({
    name: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    priceCents: z.number().int().min(1).optional(),
    inventory: z.number().int().min(0).optional(),
    imageUrl: z.string().url().optional().or(z.literal('')).optional(),
    isActive: z.boolean().optional()
  }).parse(req.body);

  const existing = await query('SELECT id FROM products WHERE id = $1 AND seller_id = $2', [req.params.id, req.user!.id]);
  if (!existing.rowCount && req.user!.role !== 'admin') throw new HttpError(404, 'Product not found');

  const result = await query(
    `UPDATE products SET
       name = COALESCE($2, name),
       description = COALESCE($3, description),
       price_cents = COALESCE($4, price_cents),
       inventory = COALESCE($5, inventory),
       image_url = COALESCE(NULLIF($6, ''), image_url),
       is_active = COALESCE($7, is_active),
       updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [req.params.id, body.name, body.description, body.priceCents, body.inventory, body.imageUrl, body.isActive]
  );

  res.json(result.rows[0]);
}));
