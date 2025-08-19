import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto, { randomUUID } from 'crypto';
import type { User } from '@prisma/client';
import type { CookieOptions } from 'express';
import env from '@/utils/env';
import redis from '@/db/redis';

// JWT config
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

  /**
   * Generate RSA key pair for signing JWTs
   */
  private generateKeyPair() {
    return crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
    });
  }

  /**
   * Generate a new session with access & refresh tokens
   * Store publicKey in Redis with sessionId
   */
  async generateTokens(user: User) {
    const { privateKey, publicKey } = this.generateKeyPair();
    const sessionId = randomUUID();

    // Save publicKey in Redis, keyed by sessionId
    await redis.set(`session:${sessionId}`, publicKey, {
      ex: 60 * 60 * 24 * 7 // 7 days
    });

    // Create access token
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, sessionId, type: 'access' },
      privateKey,
      { algorithm: 'RS256', expiresIn: JWT_EXPIRES_IN }
    );

    // Create refresh token
    const refreshToken = jwt.sign(
      { userId: user.id, sessionId, type: 'refresh' },
      privateKey,
      { algorithm: 'RS256', expiresIn: REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken, sessionId };
  }

  /**
   * Rotate tokens for an existing session (refresh flow)
   */
  async rotateTokens(user: User, sessionId: string) {
    const { privateKey, publicKey } = this.generateKeyPair();

    // Update publicKey for the same sessionId in Redis
    await redis.set(`session:${sessionId}`, publicKey, {
      ex: 60 * 60 * 24 * 7 // 7 days
    });

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, sessionId, type: 'access' },
      privateKey,
      { algorithm: 'RS256', expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, sessionId, type: 'refresh' },
      privateKey,
      { algorithm: 'RS256', expiresIn: REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify token (access or refresh)
   */
  async verifyToken(token: string) {
    const decoded = jwt.decode(token) as { sessionId?: string };
    if (!decoded?.sessionId) throw new Error('Invalid token payload');

    const publicKey = await redis.get<string>(`session:${decoded.sessionId}`);
    if (!publicKey) throw new Error('Public key not found or expired');

    return jwt.verify(token, publicKey, {
      algorithms: ['RS256']
    }) as { userId: string; sessionId: string; type: 'access' | 'refresh' };
  }

  /**
   * Check if a session is still valid
   */
  async isSessionValid(sessionId: string) {
    const key = await redis.get<string>(`session:${sessionId}`);
    return !!key;
  }

  /**
   * Remove a session from Redis (logout or revoke)
   */
  async delSession(sessionId: string) {
    await redis.del(`session:${sessionId}`);
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }
}

export default AuthService.getInstance();
