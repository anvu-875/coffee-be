import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto, { randomUUID } from 'crypto';
import type { User } from '@prisma/client';
import type { CookieOptions, Response } from 'express';
import redis from '@/db/redis';

// =====================
// JWT config
// =====================
const ACCESS_EXPIRES_IN = '15m';

const REFRESH_EXPIRES_IN = '7d';
export const REFRESH_TOKEN_COOKIE_NAME = 'tk_N2kVPQCuIotFZKkpHqkN3oTbv83SodSW';
export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  priority: 'high',
  maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
};

interface AccessTokenPayload {
  userId: string;
  email: string;
  sessionId: string;
  type: 'access';
}

interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  type: 'refresh';
}

// =====================
// AuthError
// =====================
export enum AuthErrorCode {
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
  INVALID_TOKEN_TYPE = 'INVALID_TOKEN_TYPE',
  PUBLIC_KEY_NOT_FOUND = 'PUBLIC_KEY_NOT_FOUND',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  VERIFY_ERROR = 'VERIFY_ERROR'
}

export class AuthError extends Error {
  constructor(
    public message: string,
    public code: AuthErrorCode
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// =====================
// AuthService
// =====================
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

    // Store public key in redis so we can verify later.
    await redis.set(`session:${sessionId}`, publicKey, {
      ex: Math.floor((REFRESH_COOKIE_OPTIONS.maxAge ?? 0) / 1000)
    });

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, sessionId, type: 'access' },
      privateKey,
      { algorithm: 'RS256', expiresIn: ACCESS_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, sessionId, type: 'refresh' },
      privateKey,
      { algorithm: 'RS256', expiresIn: REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken, sessionId };
  }

  /**
   * Rotate tokens for an existing session (refresh flow)
   * This re-generates a new key pair and overwrites the public key in redis
   * for the same sessionId so previously issued tokens are no longer valid.
   */
  async rotateTokens(user: User, sessionId: string) {
    const { privateKey, publicKey } = this.generateKeyPair();

    await redis.set(`session:${sessionId}`, publicKey, {
      ex: Math.floor((REFRESH_COOKIE_OPTIONS.maxAge ?? 0) / 1000)
    });

    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        sessionId,
        type: 'access'
      } as AccessTokenPayload,
      privateKey,
      { algorithm: 'RS256', expiresIn: ACCESS_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, sessionId, type: 'refresh' } as RefreshTokenPayload,
      privateKey,
      { algorithm: 'RS256', expiresIn: REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  /**
   * Verify token: decode -> fetch publicKey from redis -> verify signature
   */
  async verifyToken(token: string, type?: 'access' | 'refresh') {
    const decoded = jwt.decode(token) as
      | AccessTokenPayload
      | RefreshTokenPayload;

    if (
      !decoded?.sessionId ||
      !decoded?.userId ||
      (decoded.type !== 'access' && decoded.type !== 'refresh') ||
      (decoded.type === 'access' && !(decoded as AccessTokenPayload).email)
    ) {
      throw new AuthError(
        'Invalid token payload',
        AuthErrorCode.INVALID_PAYLOAD
      );
    }

    if (type && decoded.type !== type) {
      throw new AuthError(
        `Expected ${type} token, but got ${decoded.type}`,
        AuthErrorCode.INVALID_TOKEN_TYPE
      );
    }

    const publicKey = await redis.get<string>(`session:${decoded.sessionId}`);
    if (!publicKey) {
      throw new AuthError(
        'Public key not found or expired',
        AuthErrorCode.PUBLIC_KEY_NOT_FOUND
      );
    }

    try {
      return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as
        | AccessTokenPayload
        | RefreshTokenPayload;
    } catch (err: unknown) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AuthError('Token expired', AuthErrorCode.TOKEN_EXPIRED);
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new AuthError(
          'Invalid token signature',
          AuthErrorCode.INVALID_SIGNATURE
        );
      }
      throw new AuthError(
        'Unknown token verification error',
        AuthErrorCode.VERIFY_ERROR
      );
    }
  }

  /**
   * Session helpers
   */
  async isSessionValid(sessionId: string) {
    const key = await redis.get<string>(`session:${sessionId}`);
    return !!key;
  }

  async delSession(sessionId: string) {
    await redis.del(`session:${sessionId}`);
  }

  /**
   * Cookie helpers
   * - setRefreshCookie: sets only the refresh token cookie (HTTPOnly)
   * - clearRefreshCookie: clears the refresh cookie (must match path)
   */
  setRefreshCookie(res: Response, refreshToken: string) {
    const opts: CookieOptions = {
      ...REFRESH_COOKIE_OPTIONS,
      path: '/api/auth/refresh'
    };
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, opts);
  }

  clearRefreshCookie(res: Response) {
    // clearCookie must match same path used when setting
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: '/api/auth/refresh' });
  }

  /**
   * Password helpers
   */
  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }
}

export default AuthService.getInstance();
