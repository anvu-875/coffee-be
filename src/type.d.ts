import type { User } from '@prisma/client';

// Extend the Request interface to include the 'auth' property
export {}; // Ensure this file is treated as a module

declare global {
  namespace Express {
    interface Request {
      auth?: {
        user: User;
        sessionId: string;
        accessToken: string;
        refreshToken: string;
      };
    }
  }
}
