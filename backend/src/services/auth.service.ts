import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { AuthUser, Role } from '../types';
import { query } from '../db/pool';
import { HttpError } from '../utils/httpError';

interface JwtPayload {
  sub: string;
  role: Role;
}

export function signAccessToken(user: Pick<AuthUser, 'id' | 'role'>) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtAccessSecret, { expiresIn: '15m' });
}

export function signRefreshToken(user: Pick<AuthUser, 'id' | 'role'>) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtRefreshSecret, { expiresIn: '7d' });
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

export async function storeRefreshToken(userId: string, refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [userId, tokenHash]
  );
}

export async function revokeRefreshToken(refreshToken: string) {
  await query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [hashToken(refreshToken)]
  );
}

export async function verifyRefreshToken(refreshToken: string) {
  const payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as JwtPayload;
  const tokenResult = await query(
    `SELECT id FROM refresh_tokens
     WHERE user_id = $1 AND token_hash = $2 AND revoked_at IS NULL AND expires_at > NOW()`,
    [payload.sub, hashToken(refreshToken)]
  );

  if (!tokenResult.rowCount) {
    throw new HttpError(401, 'Invalid refresh token');
  }

  return payload;
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  const result = await query(
    `SELECT id, name, email, role, is_email_verified FROM users WHERE id = $1`,
    [id]
  );

  if (!result.rowCount) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    isEmailVerified: row.is_email_verified
  };
}

export async function authenticateUser(email: string, password: string) {
  const result = await query(
    `SELECT id, name, email, password_hash, role, is_email_verified FROM users WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (!result.rowCount) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const user = result.rows[0];
  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    throw new HttpError(401, 'Invalid email or password');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.is_email_verified
  } as AuthUser;
}

export async function createUser(name: string, email: string, password: string, role: Role = 'buyer') {
  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = createVerificationToken();

  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, email_verification_token)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, role, is_email_verified`,
    [name, email.toLowerCase(), passwordHash, role, verificationToken]
  );

  const row = result.rows[0];
  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      isEmailVerified: row.is_email_verified
    } as AuthUser,
    verificationToken
  };
}
