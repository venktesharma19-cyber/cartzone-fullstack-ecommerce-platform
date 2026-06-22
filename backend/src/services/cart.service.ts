import { redis } from '../db/redis';
import { query } from '../db/pool';
import { CartItem, CartProduct } from '../types';
import { HttpError } from '../utils/httpError';

const CART_TTL_SECONDS = 60 * 60 * 24 * 7;

export function cartKey(sessionId: string) {
  return `cart:${sessionId}`;
}

export function calculateCartTotal(items: Pick<CartProduct, 'priceCents' | 'quantity'>[]) {
  return items.reduce(
    (summary, item) => ({
      quantity: summary.quantity + item.quantity,
      totalCents: summary.totalCents + item.priceCents * item.quantity
    }),
    { quantity: 0, totalCents: 0 }
  );
}

export async function getRawCart(sessionId: string): Promise<CartItem[]> {
  const raw = await redis.get(cartKey(sessionId));
  return raw ? JSON.parse(raw) : [];
}

export async function saveRawCart(sessionId: string, items: CartItem[]) {
  await redis.set(cartKey(sessionId), JSON.stringify(items), 'EX', CART_TTL_SECONDS);
}

export async function clearCart(sessionId: string) {
  await redis.del(cartKey(sessionId));
}

export async function addToCart(sessionId: string, productId: string, quantity: number) {
  if (quantity < 1) throw new HttpError(400, 'Quantity must be at least 1');

  const product = await query('SELECT id, inventory FROM products WHERE id = $1 AND is_active = TRUE', [productId]);
  if (!product.rowCount) throw new HttpError(404, 'Product not found');
  if (product.rows[0].inventory < quantity) throw new HttpError(400, 'Not enough inventory available');

  const items = await getRawCart(sessionId);
  const existing = items.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId, quantity });
  }

  await saveRawCart(sessionId, items);
  return getHydratedCart(sessionId);
}

export async function updateCartItem(sessionId: string, productId: string, quantity: number) {
  const items = await getRawCart(sessionId);
  const nextItems = quantity <= 0
    ? items.filter((item) => item.productId !== productId)
    : items.map((item) => (item.productId === productId ? { ...item, quantity } : item));

  await saveRawCart(sessionId, nextItems);
  return getHydratedCart(sessionId);
}

export async function getHydratedCart(sessionId: string) {
  const items = await getRawCart(sessionId);
  if (!items.length) {
    return { items: [], summary: { quantity: 0, totalCents: 0 } };
  }

  const productIds = items.map((item) => item.productId);
  const result = await query(
    `SELECT id, name, price_cents, image_url, inventory FROM products WHERE id = ANY($1::uuid[])`,
    [productIds]
  );

  const productsById = new Map(result.rows.map((row) => [row.id, row]));
  const hydrated: CartProduct[] = items
    .map((item) => {
      const product = productsById.get(item.productId);
      if (!product) return null;
      return {
        productId: item.productId,
        quantity: item.quantity,
        name: product.name,
        priceCents: product.price_cents,
        imageUrl: product.image_url,
        inventory: product.inventory
      };
    })
    .filter(Boolean) as CartProduct[];

  return {
    items: hydrated,
    summary: calculateCartTotal(hydrated)
  };
}
