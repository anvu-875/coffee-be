import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

export async function connectWithRetry(max = 5) {
  for (let i = 1; i <= max; i++) {
    try {
      await prisma.$connect();
      return;
    } catch {
      console.warn(`DB connect attempt ${i} failed. Retrying...`);
      await new Promise((res) => setTimeout(res, 1000 * i));
    }
  }
  console.error('Could not establish DB connection after retries');
  process.exit(1);
}

export default prisma;
