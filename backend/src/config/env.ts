import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? 'postgres://cartzone:cartzone@localhost:5432/cartzone',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  redisMode: (process.env.REDIS_MODE ?? 'redis').toLowerCase(),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  awsRegion: process.env.AWS_REGION ?? 'us-east-1',
  awsS3Bucket: process.env.AWS_S3_BUCKET ?? ''
};
