import { PoolClient } from 'pg';
import { pool, query } from '../db/pool';
import { getHydratedCart, clearCart } from './cart.service';
import { HttpError } from '../utils/httpError';
import { OrderStatus } from '../types';

export function calculateOrderTotal(items: { quantity: number; unitPriceCents: number }[]) {
  return items.reduce((total, item) => total + item.quantity * item.unitPriceCents, 0);
}

export async function createPendingOrderFromCart(userId: string, sessionId: string, shippingAddress: unknown) {
  const cart = await getHydratedCart(sessionId);
  if (!cart.items.length) throw new HttpError(400, 'Cart is empty');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status, total_cents, shipping_address)
       VALUES ($1, 'pending', $2, $3)
       RETURNING id, status, total_cents`,
      [userId, cart.summary.totalCents, shippingAddress ?? {}]
    );
    const order = orderResult.rows[0];

    for (const item of cart.items) {
      await assertAndReserveInventory(client, item.productId, item.quantity);
      await client.query(
        `INSERT INTO order_items (order_id, product_id, seller_id, product_name, quantity, unit_price_cents)
         SELECT $1, p.id, p.seller_id, p.name, $2, p.price_cents
         FROM products p WHERE p.id = $3`,
        [order.id, item.quantity, item.productId]
      );
    }

    await client.query('COMMIT');
    await clearCart(sessionId);
    return order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function assertAndReserveInventory(client: PoolClient, productId: string, quantity: number) {
  const productResult = await client.query('SELECT inventory FROM products WHERE id = $1 FOR UPDATE', [productId]);
  if (!productResult.rowCount) throw new HttpError(404, 'Product not found');
  if (productResult.rows[0].inventory < quantity) throw new HttpError(400, 'Not enough inventory available');

  await client.query('UPDATE products SET inventory = inventory - $1, updated_at = NOW() WHERE id = $2', [quantity, productId]);
}

export async function markOrderPaid(orderId: string, stripeSessionId?: string) {
  await query(
    `UPDATE orders SET status = 'paid', stripe_session_id = COALESCE($2, stripe_session_id), updated_at = NOW()
     WHERE id = $1`,
    [orderId, stripeSessionId ?? null]
  );
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const result = await query(
    `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [orderId, status]
  );
  if (!result.rowCount) throw new HttpError(404, 'Order not found');
  return result.rows[0];
}
