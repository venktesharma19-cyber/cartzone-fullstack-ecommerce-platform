import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticateUser, createUser, revokeRefreshToken, signAccessToken, signRefreshToken, storeRefreshToken, verifyRefreshToken } from '../services/auth.service';
import { query } from '../db/pool';
import { sendVerificationEmail } from '../services/email.service';
import { requireAuth } from '../middleware/auth';
import { HttpError } from '../utils/httpError';

export const authRoutes = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['buyer', 'seller']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

authRoutes.post('/register', asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body);
  const { user, verificationToken } = await createUser(body.name, body.email, body.password, body.role ?? 'buyer');
  await sendVerificationEmail(user.email, verificationToken);

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await storeRefreshToken(user.id, refreshToken);

  res.status(201).json({ user, accessToken, refreshToken, verificationToken });
}));

authRoutes.post('/login', asyncHandler(async (req, res) => {
  const body = loginSchema.parse(req.body);
  const user = await authenticateUser(body.email, body.password);
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await storeRefreshToken(user.id, refreshToken);
  res.json({ user, accessToken, refreshToken });
}));

authRoutes.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = z.object({ refreshToken: z.string() }).parse(req.body).refreshToken;
  const payload = await verifyRefreshToken(refreshToken);
  await revokeRefreshToken(refreshToken);

  const user = await query('SELECT id, role FROM users WHERE id = $1', [payload.sub]);
  if (!user.rowCount) throw new HttpError(401, 'User not found');

  const nextRefreshToken = signRefreshToken({ id: user.rows[0].id, role: user.rows[0].role });
  const accessToken = signAccessToken({ id: user.rows[0].id, role: user.rows[0].role });
  await storeRefreshToken(user.rows[0].id, nextRefreshToken);

  res.json({ accessToken, refreshToken: nextRefreshToken });
}));

authRoutes.post('/logout', asyncHandler(async (req, res) => {
  const refreshToken = z.object({ refreshToken: z.string() }).parse(req.body).refreshToken;
  await revokeRefreshToken(refreshToken);
  res.status(204).send();
}));

authRoutes.post('/verify-email', asyncHandler(async (req, res) => {
  const token = z.object({ token: z.string() }).parse(req.body).token;
  const result = await query(
    `UPDATE users SET is_email_verified = TRUE, email_verification_token = NULL, updated_at = NOW()
     WHERE email_verification_token = $1
     RETURNING id, name, email, role, is_email_verified`,
    [token]
  );

  if (!result.rowCount) throw new HttpError(400, 'Invalid or expired verification token');
  res.json({ message: 'Email verified successfully', user: result.rows[0] });
}));

authRoutes.get('/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));
