import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { createProductImageUploadUrl } from '../services/s3.service';

export const uploadRoutes = Router();

uploadRoutes.post('/product-image-url', requireAuth, requireRole('seller', 'admin'), asyncHandler(async (req, res) => {
  const body = z.object({ fileType: z.string().startsWith('image/') }).parse(req.body);
  res.json(await createProductImageUploadUrl(body.fileType));
}));
