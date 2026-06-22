import Redis from 'ioredis';
import { env } from '../config/env';

type CacheValue = { value: string; expiresAt?: number };

type CacheClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: 'EX', ttlSeconds?: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
};

const memoryStore = new Map<string, CacheValue>();

function cleanupExpired(key: string) {
  const record = memoryStore.get(key);
  if (record?.expiresAt && record.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return true;
  }
  return false;
}

const memoryRedis: CacheClient = {
  async get(key: string) {
    if (cleanupExpired(key)) return null;
    return memoryStore.get(key)?.value ?? null;
  },
  async set(key: string, value: string, mode?: 'EX', ttlSeconds?: number) {
    const expiresAt = mode === 'EX' && ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    memoryStore.set(key, { value, expiresAt });
    return 'OK';
  },
  async del(key: string) {
    return memoryStore.delete(key) ? 1 : 0;
  }
};

function createRedisClient(): CacheClient {
  if (env.redisMode === 'memory') {
    console.warn('[redis] REDIS_MODE=memory enabled. Cart data is stored in process memory for local demo only.');
    return memoryRedis;
  }

  const redisClient = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: false
  });

  redisClient.on('error', (err) => {
    if (env.nodeEnv !== 'test') {
      console.error('[redis]', err.message);
    }
  });

  return redisClient as unknown as CacheClient;
}

export const redis = createRedisClient();
