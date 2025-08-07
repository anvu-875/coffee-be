import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import env from '@/utils/env';
import type { CookieOptions } from 'express';

const JWT_SECRET = env.JWT_SECRET;

const JWT_EXPIRES_IN = '15m';
export const ACCESS_TOKEN_COOKIE_NAME = 'tk_N3KhYmfkebDYJSgy8q7xLrFiWf6hNld1';
export const ACCESS_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 1000 * 60 * 15 // 15 minutes
};
const REFRESH_EXPIRES_IN = '7d';
export const REFRESH_TOKEN_COOKIE_NAME = 'tk_N2kVPQCuIotFZKkpHqkN3oTbv83SodSW';
export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
};

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
