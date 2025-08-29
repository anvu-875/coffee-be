import {
  ACCESS_TOKEN_COOKIE_NAME,
  AuthError,
  REFRESH_TOKEN_COOKIE_NAME
} from '@/services/auth.service';
import authService from '@/services/auth.service';
import { StatusCodes } from '@/utils/http-enum';
import HttpError from '@/utils/http-error';
import type { NextFunction, Request, Response } from 'express';
import z from 'zod';
import userService from '@/services/user.service';
import catchAsync from '@/utils/catch-async';

const authorizationSchema = z.object({
  [ACCESS_TOKEN_COOKIE_NAME]: z.string().optional(),
  [REFRESH_TOKEN_COOKIE_NAME]: z.string('Refresh token is required')
});

async function ensureUser(userId: string) {
  const user = await userService.findUserById(userId);
  if (!user) throw new HttpError('User not found', StatusCodes.UNAUTHORIZED);
  return user;
}

export const withAuth = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = authorizationSchema.safeParse(req.cookies);
    if (!result.success) {
      throw new HttpError('Unauthorized', StatusCodes.UNAUTHORIZED);
    }

    const accessToken = result.data[ACCESS_TOKEN_COOKIE_NAME];
    const refreshToken = result.data[REFRESH_TOKEN_COOKIE_NAME];

    // Step 1: Verify access token
    if (accessToken) {
      try {
        const accessPayload = await authService.verifyToken(
          accessToken,
          'access'
        );

        const user = await ensureUser(accessPayload.userId);

        req.auth = {
          user,
          sessionId: accessPayload.sessionId,
          accessToken,
          refreshToken
        };

        return next();
      } catch (err: unknown) {
        if (err instanceof AuthError && err.code === 'TOKEN_EXPIRED') {
          // continue to refresh
        } else {
          throw err;
        }
      }
    }

    // Step 2: Refresh flow
    const payload = await authService.verifyToken(refreshToken, 'refresh');

    const user = await ensureUser(payload.userId);

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await authService.rotateTokens(user, payload.sessionId);

    authService.setCookies(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

    req.auth = {
      user,
      sessionId: payload.sessionId,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };

    return next();
  }
);
