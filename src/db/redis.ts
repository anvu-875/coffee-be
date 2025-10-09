import env from '@/utils/env';
import { createClient } from 'redis';

const redis = createClient({
  url: env.REDIS_URL
});

redis.on('error', (err) => {
  console.error('Redis client error', err);
});

(async () => {
  await redis.connect();
})();

/**
 * Check Redis connection by sending a PING command.
 * Throws an error if the connection fails or the response is unexpected.
 */
export async function checkRedisConnection(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      return true;
    }
    throw new Error(`❌ Unexpected Redis response: ${pong}`);
  } catch (err) {
    throw new Error(`❌ Redis connection failed: ${err}`);
  }
}

export default redis;
