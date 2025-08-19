import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

export async function checkRedisConnection(): Promise<boolean> {
  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      return true;
    }
    //add icon
    throw new Error(`❌ Unexpected Redis response: ${pong}`);
  } catch (err) {
    throw new Error(`❌ Redis connection failed: ${err}`);
  }
}

export default redis;
