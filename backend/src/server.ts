import { app } from './app';
import { env } from './config/env';
import { redis } from './db/redis';

async function start() {
  try {
    await redis.connect();
  } catch {
    console.warn('Redis connection will retry in the background');
  }

  app.listen(env.port, () => {
    console.log(`CartZone API running on port ${env.port}`);
  });
}

start();
