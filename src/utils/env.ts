import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production']),
  PORT: z
    .string()
    .transform(Number)
    .refine((val) => val > 0, {
      message: 'PORT must be a positive number'
    }),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  URL: z.url()
});

const env = envSchema.parse(process.env);

export default env;
