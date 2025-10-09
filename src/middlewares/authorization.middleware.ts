import { REFRESH_TOKEN_COOKIE_NAME, AuthError } from '@/services/auth.service';
import authService from '@/services/auth.service';
import { StatusCodes } from '@/utils/http-enum';
import HttpError from '@/utils/http-error';
import type { NextFunction, Request, Response } from 'express';
import userService from '@/services/user.service';
import catchAsync from '@/utils/catch-async';

/**
 * ensureUser: fetch user by id or throw 401
 */
async function ensureUser(userId: string) {
  const user = await userService.findUserById(userId);
  if (!user) throw new HttpError('User not found', StatusCodes.UNAUTHORIZED);
  return user;
}

/**
 * withAuth middleware (ACCESS token in Authorization header)
 * - This middleware **only** validates the access token presented in the
 *   Authorization header ("Bearer <token>").
 * - If access token is valid -> attach req.auth and call next().
 * - If access token is missing/invalid/expired -> respond 401.
 *
 * Rationale: keep middleware responsibility limited. The frontend is
 * expected to call POST /auth/refresh when it receives a 401 to obtain a
 * new access token using the refresh token stored in an HTTPOnly cookie.
 */
export const withAuth = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    // Expect Authorization: Bearer <accessToken>
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError('Unauthorized', StatusCodes.UNAUTHORIZED);
    }

    const accessToken = authHeader.split(' ')[1];

    try {
      const accessPayload = await authService.verifyToken(
        accessToken,
        'access'
      );

      const user = await ensureUser(accessPayload.userId);

      // Attach minimal auth info for downstream handlers
      req.auth = {
        user,
        sessionId: accessPayload.sessionId,
        accessToken,
        // we keep refresh token only as optional convenience (read from cookie)
        refreshToken: req.cookies?.[REFRESH_TOKEN_COOKIE_NAME]
      };

      return next();
    } catch (err: unknown) {
      // For any token error (expired/invalid/missing public key) return 401.
      // Frontend should handle 401 by calling /auth/refresh.
      if (err instanceof AuthError) {
        // map auth error to 401 to keep client flow simple
        throw new HttpError('Unauthorized', StatusCodes.UNAUTHORIZED);
      }
      throw err;
    }
  }
);
