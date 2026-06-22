import jwt from 'jsonwebtoken';
import { signAccessToken } from '../src/services/auth.service';
import { env } from '../src/config/env';

describe('auth service', () => {
  it('signs access tokens with subject and role', () => {
    const token = signAccessToken({ id: 'user-123', role: 'seller' });
    const payload = jwt.verify(token, env.jwtAccessSecret) as jwt.JwtPayload;
    expect(payload.sub).toBe('user-123');
    expect(payload.role).toBe('seller');
  });
});
