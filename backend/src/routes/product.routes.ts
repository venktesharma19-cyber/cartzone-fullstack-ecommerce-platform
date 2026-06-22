import { Router } from 'express';
import { z } from 'zod';
import { query } from '../db/pool';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { HttpError } from '../utils/httpError';

export const productRoutes = Router();

productRoutes.get('/categories', asyncHandler(async (_req, res) => {
  const result = await query('SELECT id, name, slug FROM categories ORDER BY name');
  res.json(result.rows);
}));

productRoutes.get('/', asyncHandler(async (req, res) => {
  const schema = z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating_desc']).optional()
  });
  const params = schema.parse(req.query);

  const values: unknown[] = [];
  const where = ['p.is_active = TRUE'];

  if (params.q) {
    values.push(`%${params.q}%`);
    where.push(`(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length})`);
  }

  if (params.category) {
    values.push(params.category);
    where.push(`c.slug = $${values.length}`);
  }

  if (params.minPrice !== undefined) {
    values.push(Math.round(params.minPrice * 100));
    where.push(`p.price_cents >= $${values.length}`);
  }

  if (params.maxPrice !== undefined) {
    values.push(Math.round(params.maxPrice * 100));
    where.push(`p.price_cents <= $${values.length}`);
  }

  const orderBy = {
    newest: 'p.created_at DESC',
    price_asc: 'p.price_cents ASC',
    price_desc: 'p.price_cents DESC',
    rating_desc: 'avg_rating DESC NULLS LAST'
  }[params.sort ?? 'newest'];

  const result = await query(
    `SELECT p.id, p.name, p.description, p.price_cents, p.inventory, p.image_url,
            c.name AS category_name, c.slug AS category_slug,
            COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
            COUNT(r.id)::int AS review_count
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN reviews r ON r.product_id = p.id
     WHERE ${where.join(' AND ')}
     GROUP BY p.id, c.name, c.slug
     ORDER BY ${orderBy}
     LIMIT 60`,
    values
  );

  res.json(result.rows);
}));

productRoutes.get('/:id', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT p.id, p.name, p.description, p.price_cents, p.inventory, p.image_url,
            c.name AS category_name, c.slug AS category_slug,
            COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
            COUNT(r.id)::int AS review_count
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN reviews r ON r.product_id = p.id
     WHERE p.id = $1 AND p.is_active = TRUE
     GROUP BY p.id, c.name, c.slug`,
    [req.params.id]
  );

  if (!result.rowCount) throw new HttpError(404, 'Product not found');

  const reviews = await query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.product_id = $1
     ORDER BY r.created_at DESC`,
    [req.params.id]
  );

  res.json({ ...result.rows[0], reviews: reviews.rows });
}));

productRoutes.post('/:id/reviews', requireAuth, asyncHandler(async (req, res) => {
  const body = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().min(3) }).parse(req.body);

  const result = await query(
    `INSERT INTO reviews (product_id, user_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (product_id, user_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
     RETURNING *`,
    [req.params.id, req.user!.id, body.rating, body.comment]
  );

  res.status(201).json(result.rows[0]);
}));
