import { env } from '../config/env';

export async function sendVerificationEmail(email: string, token: string) {
  const link = `${env.frontendUrl}/verify-email?token=${token}`;
  console.log(`[email:mock] Verification email for ${email}: ${link}`);
  return { email, link };
}
