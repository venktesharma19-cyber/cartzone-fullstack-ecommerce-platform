import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { addToCart, clearCart, getHydratedCart, updateCartItem } from '../services/cart.service';
import { optionalCartSession } from '../middleware/auth';

export const cartRoutes = Router();

cartRoutes.use(optionalCartSession);

cartRoutes.get('/', asyncHandler(async (req, res) => {
  res.json(await getHydratedCart(req.cartSessionId!));
}));

cartRoutes.post('/items', asyncHandler(async (req, res) => {
  const body = z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1) }).parse(req.body);
  res.status(201).json(await addToCart(req.cartSessionId!, body.productId, body.quantity));
}));

cartRoutes.patch('/items/:productId', asyncHandler(async (req, res) => {
  const body = z.object({ quantity: z.number().int().min(0) }).parse(req.body);
  res.json(await updateCartItem(req.cartSessionId!, req.params.productId, body.quantity));
}));

cartRoutes.delete('/', asyncHandler(async (req, res) => {
  await clearCart(req.cartSessionId!);
  res.status(204).send();
}));
