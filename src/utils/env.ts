import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']),
  POSTGRESQL_DATABASE_URL: z.url(),
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
  PORT: z
    .string()
    .transform(Number)
    .refine((val) => val > 0, {
      message: 'PORT must be a positive number'
    }),
  URL: z.url()
});

/**
 * Environment configuration.
 * Validates and parses environment variables using zod schema.
 * Throws an error if any variable is missing or invalid.
 */
const env = envSchema.parse(process.env);

export default env;
