import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { findUserById } from '../services/auth.service';
import { Role } from '../types';
import { HttpError } from '../utils/httpError';

interface JwtPayload {
  sub: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: Awaited<ReturnType<typeof findUserById>>;
      cartSessionId?: string;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
    const token = header?.startsWith('Bearer ') ? header.replace('Bearer ', '') : queryToken;
    if (!token) {
      throw new HttpError(401, 'Missing authorization token');
    }
    const payload = jwt.verify(token, env.jwtAccessSecret) as JwtPayload;
    const user = await findUserById(payload.sub);

    if (!user) {
      throw new HttpError(401, 'User not found');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(401, 'Invalid authorization token'));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission for this action'));
    }

    next();
  };
}

export function optionalCartSession(req: Request, res: Response, next: NextFunction) {
  const headerSession = req.headers['x-cart-session-id'];
  const sessionId = typeof headerSession === 'string' && headerSession.length > 0
    ? headerSession
    : cryptoRandomId();

  req.cartSessionId = sessionId;
  res.setHeader('x-cart-session-id', sessionId);
  next();
}

function cryptoRandomId() {
  return `guest_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
