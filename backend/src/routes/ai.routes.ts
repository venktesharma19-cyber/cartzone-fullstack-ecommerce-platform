import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { getAiRecommendations, getProductReviewSummary, getSellerAiInsights } from '../services/ai.service';

export const aiRoutes = Router();

aiRoutes.post('/assistant', asyncHandler(async (req, res) => {
  const body = z.object({ message: z.string().min(2).max(500) }).parse(req.body);
  const response = await getAiRecommendations(body.message);
  res.json(response);
}));

aiRoutes.post('/semantic-search', asyncHandler(async (req, res) => {
  const body = z.object({ query: z.string().min(2).max(500) }).parse(req.body);
  const response = await getAiRecommendations(body.query);
  res.json(response);
}));

aiRoutes.get('/products/:id/summary', asyncHandler(async (req, res) => {
  const summary = await getProductReviewSummary(req.params.id);
  if (!summary) throw new HttpError(404, 'Product not found');
  res.json(summary);
}));

aiRoutes.get('/seller/insights', requireAuth, requireRole('seller', 'admin'), asyncHandler(async (req, res) => {
  const insights = await getSellerAiInsights(req.user!.id, req.user!.role);
  res.json(insights);
}));
