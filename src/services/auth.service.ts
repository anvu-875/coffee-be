import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { CookieOptions, Response } from 'express';
import redis from '@/db/redis';
import type { User } from '@prisma/client';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  SessionData
} from '@/types/auth.type';
import logger from '@/utils/logger';

/**
 * AuthService
 * - Only this service talks to Redis.
 * - Provides generateTokens, rotateIfJtiMatches (atomic), verifyToken, cookie helpers, password helpers.
 *
 * Notes:
 * - Uses RSA per-session keypair.
 * - Stores publicKey and sha256(jti) in redis key `session:{sessionId}`.
 * - Atomic rotation uses EVAL script and node-redis v4 eval signature.
 */

// Config
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

export const REFRESH_TOKEN_COOKIE_NAME = 'tk_N2kVPQCuIotFZKkpHqkN3oTbv83SodSW';
export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  priority: 'high',
  maxAge: 1000 * 60 * 60 * 24 * 7
};

// Auth error enum
export enum AuthErrorCode {
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
  INVALID_TOKEN_TYPE = 'INVALID_TOKEN_TYPE',
  PUBLIC_KEY_NOT_FOUND = 'PUBLIC_KEY_NOT_FOUND',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  VERIFY_ERROR = 'VERIFY_ERROR',
  SESSION_USER_MISMATCH = 'SESSION_USER_MISMATCH',
  REFRESH_REUSE_DETECTED = 'REFRESH_REUSE_DETECTED'
}

//handle user not match in redis later

export class AuthError extends Error {
  constructor(
    public message: string,
    public code: AuthErrorCode
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// Helpers
function sha256Hex(value: string) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
  });
}

class AuthService {
  private static instance: AuthService | null = null;
  static getInstance() {
    AuthService.instance ??= new AuthService();
    return AuthService.instance;
  }

  private async saveSessionWithJti(
    userId: string,
    sessionId: string,
    publicKey: string,
    jti: string
  ) {
    const jtiDigest = sha256Hex(jti);
    const key = `session:${sessionId}`;

    // HSET fields and set TTL
    await redis
      .multi()
      .hSet(key, {
        userId: userId,
        publicKey: publicKey,
        jtiDigest: jtiDigest,
        lastUsed: Date.now().toString()
      } satisfies SessionData)
      .expire(key, Math.floor((REFRESH_COOKIE_OPTIONS.maxAge ?? 0) / 1000))
      .exec();
  }

  /**
   * Generate tokens for new login session.
   * - create keypair, sessionId, jti
   * - store publicKey + jtiDigest
   * - return access & refresh (refresh includes jti)
   */
  async generateTokens(user: User) {
    const { privateKey, publicKey } = generateKeyPair();
    const sessionId = crypto.randomUUID();
    const jti = crypto.randomUUID();

    await this.saveSessionWithJti(user.id, sessionId, publicKey, jti);

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
      {
        userId: user.id,
        sessionId,
        jti,
        type: 'refresh'
      } as RefreshTokenPayload,
      privateKey,
      { algorithm: 'RS256', expiresIn: REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken, sessionId };
  }

  /**
   * Atomic rotate
   * - Compare provided oldJti's digest to stored jtiDigest atomically, and if match:
   *   set new publicKey and new jtiDigest and refresh TTL.
   * - Node-redis v4 eval signature: redis.eval(script, { keys: [...], arguments: [...] })
   *
   * Returns { accessToken, refreshToken } on success.
   * Throws AuthError(AuthErrorCode.REFRESH_REUSE_DETECTED) if mismatch (reuse).
   * Throws AuthError(AuthErrorCode.PUBLIC_KEY_NOT_FOUND) if session missing.
   */
  async rotateIfJtiMatches(user: User, sessionId: string, oldJti: string) {
    const { privateKey: newPriv, publicKey: newPub } = generateKeyPair();
    const newJti = crypto.randomUUID();
    const newJtiDigest = sha256Hex(newJti);

    const sessionKey = `session:${sessionId}`;
    const expectedDigest = sha256Hex(oldJti);
    const ttl = Math.floor((REFRESH_COOKIE_OPTIONS.maxAge ?? 0) / 1000);

    const lua = `
      local jti = redis.call("HGET", KEYS[1], "jtiDigest")
      local userId = redis.call("HGET", KEYS[1], "userId")
      if not jti then
        return -1
      end
      if userId ~= ARGV[5] then
        return -2
      end
      if jti ~= ARGV[1] then
        return 0
      end
      local t = redis.call("TIME")
      local ms = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)
      redis.call("HSET", KEYS[1], "publicKey", ARGV[2], "jtiDigest", ARGV[3], "lastUsed", tostring(ms))
      redis.call("EXPIRE", KEYS[1], tonumber(ARGV[4]))
      return 1
    `;

    // eval using node-redis v4 style
    const result = Number(
      await redis.eval(lua, {
        keys: [sessionKey],
        arguments: [
          expectedDigest,
          newPub,
          newJtiDigest,
          ttl.toString(),
          user.id
        ]
      })
    );

    if (result === 1) {
      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          sessionId,
          type: 'access'
        } as AccessTokenPayload,
        newPriv,
        { algorithm: 'RS256', expiresIn: ACCESS_EXPIRES_IN }
      );
      const refreshToken = jwt.sign(
        {
          userId: user.id,
          sessionId,
          jti: newJti,
          type: 'refresh'
        } as RefreshTokenPayload,
        newPriv,
        { algorithm: 'RS256', expiresIn: REFRESH_EXPIRES_IN }
      );
      return { accessToken, refreshToken };
    } else if (result === 0) {
      // reuse detected -> do not revoke automatically; throw so controller can decide
      // log here as well
      logger.warn(
        `[auth] Refresh reuse detected (verify) session=${sessionId} user=${user.id}`
      );
      logger.warn(
        `Suspicious refresh token reuse detected. Possible token theft, concurrent session reuse or user spam.`
      );
      throw new AuthError(
        'Suspicious refresh token reuse detected. Possible token theft, concurrent session reuse or user spam.',
        AuthErrorCode.REFRESH_REUSE_DETECTED
      );
    } else if (result === -2) {
      // -2: userId mismatch
      throw new AuthError(
        'Session user mismatch',
        AuthErrorCode.SESSION_USER_MISMATCH
      );
    } else {
      // -1: missing session
      throw new AuthError(
        'Public key not found or expired',
        AuthErrorCode.PUBLIC_KEY_NOT_FOUND
      );
    }
  }

  /**
   * Verify token:
   * - decode -> fetch session publicKey -> optionally check jtiDigest for refresh
   * - verify signature with publicKey
   */
  verifyToken(token: string, type?: 'access'): Promise<AccessTokenPayload>;
  verifyToken(token: string, type?: 'refresh'): Promise<RefreshTokenPayload>;
  async verifyToken(token: string, type?: 'access' | 'refresh') {
    const decoded = jwt.decode(token) as
      | AccessTokenPayload
      | RefreshTokenPayload
      | null;
    if (
      !decoded ||
      !decoded.sessionId ||
      !decoded.userId ||
      (decoded.type !== 'access' && decoded.type !== 'refresh')
    ) {
      throw new AuthError(
        'Invalid token payload',
        AuthErrorCode.INVALID_PAYLOAD
      );
    }

    if (decoded.type === 'access' && !(decoded as AccessTokenPayload).email) {
      throw new AuthError(
        'Invalid token payload',
        AuthErrorCode.INVALID_PAYLOAD
      );
    }

    if (decoded.type === 'refresh' && !(decoded as RefreshTokenPayload).jti) {
      throw new AuthError(
        'Invalid token payload',
        AuthErrorCode.INVALID_PAYLOAD
      );
    }

    if (type && decoded.type !== type) {
      throw new AuthError(
        `Invalid token payload`,
        AuthErrorCode.INVALID_TOKEN_TYPE
      );
    }

    const sessionKey = `session:${decoded.sessionId}`;
    const sessionDataRaw = await redis.hGetAll(sessionKey);

    if (!sessionDataRaw || !sessionDataRaw.publicKey) {
      throw new AuthError(
        'Public key not found or expired',
        AuthErrorCode.PUBLIC_KEY_NOT_FOUND
      );
    }

    if (sessionDataRaw.userId !== decoded.userId) {
      throw new AuthError(
        'Session user mismatch',
        AuthErrorCode.SESSION_USER_MISMATCH
      );
    }

    // early check for refresh token reuse (digest compare)
    if (decoded.type === 'refresh') {
      const providedJti = (decoded as RefreshTokenPayload).jti;
      const providedDigest = sha256Hex(providedJti);
      if (providedDigest !== sessionDataRaw.jtiDigest) {
        // reuse detected; do not revoke here automatically
        logger.warn(
          `[auth] Refresh reuse detected (verify) session=${decoded.sessionId} user=${decoded.userId}`
        );
        logger.warn(
          `Suspicious refresh token reuse detected. Possible token theft, concurrent session reuse or user spam.`
        );
        throw new AuthError(
          'Suspicious refresh token reuse detected. Possible token theft, concurrent session reuse or user spam.',
          AuthErrorCode.REFRESH_REUSE_DETECTED
        );
      }
    }

    // verify signature
    try {
      return jwt.verify(token, sessionDataRaw.publicKey, {
        algorithms: ['RS256']
      }) as AccessTokenPayload | RefreshTokenPayload;
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

  // Session helpers
  async isSessionValid(sessionId: string) {
    const exists = await redis.exists(`session:${sessionId}`);
    return !!exists;
  }
  async delSession(sessionId: string) {
    await redis.del(`session:${sessionId}`);
  }

  // Cookie helpers
  setRefreshCookie(res: Response, refreshToken: string) {
    const opts: CookieOptions = {
      ...REFRESH_COOKIE_OPTIONS,
      path: '/api/auth/refresh'
    };
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, opts);
  }
  clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: '/api/auth/refresh' });
  }

  // Password helpers
  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }
  async comparePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}

export default AuthService.getInstance();
