import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import env from '@/utils/env';

const JWT_SECRET = env.JWT_SECRET;
const JWT_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

class AuthService {
  private static instance: AuthService | null = null;

  static getInstance() {
    AuthService.instance ??= new AuthService();
    return AuthService.instance;
  }

  generateAccessToken(user: User) {
    return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  }

  generateRefreshToken(user: User) {
    return jwt.sign(
      { userId: user.id, email: user.email, type: 'refresh' },
      JWT_SECRET,
      {
        expiresIn: REFRESH_EXPIRES_IN
      }
    );
  }

  verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET);
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }
}

export default AuthService.getInstance();
