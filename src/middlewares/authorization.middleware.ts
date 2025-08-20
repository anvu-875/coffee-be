import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME
} from '@/services/auth.service';
import authService from '@/services/auth.service';
import { StatusCodes } from '@/utils/http-enum';
import HttpError from '@/utils/http-error';
import type { NextFunction, Request, Response } from 'express';
import z from 'zod';
import userService from '@/services/user.service';

const authorizationSchema = z.object({
  [ACCESS_TOKEN_COOKIE_NAME]: z.string().optional(),
  [REFRESH_TOKEN_COOKIE_NAME]: z.string('Refresh token is required')
});

export const withAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const result = authorizationSchema.safeParse(req.cookies);
  if (!result.success) {
    return next(new HttpError('Unauthorized', StatusCodes.UNAUTHORIZED));
  }

  const accessToken = result.data[ACCESS_TOKEN_COOKIE_NAME];
  const refreshToken = result.data[REFRESH_TOKEN_COOKIE_NAME];

  try {
    // Step 1: Verify access token
    if (accessToken) {
      try {
        const accessPayload = await authService.verifyToken(accessToken);
        if (accessPayload.type !== 'access') {
          throw new Error('Invalid token type');
        }
        const user = await userService.findUserById(accessPayload.userId);
        if (!user) {
          return next(
            new HttpError('User not found', StatusCodes.UNAUTHORIZED)
          );
        }
        // Attach user info
        req.auth = {
          user,
          sessionId: accessPayload.sessionId,
          accessToken,
          refreshToken
        };
        return next();
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'TokenExpiredError') {
          return next(
            new HttpError('Invalid access token', StatusCodes.UNAUTHORIZED)
          );
        }
        // continue to refresh flow if expired
      }
    }

    // Step 2: Refresh flow
    const payload = await authService.verifyToken(refreshToken);
    if (payload.type !== 'refresh') {
      return next(
        new HttpError('Invalid refresh token', StatusCodes.UNAUTHORIZED)
      );
    }

    const user = await userService.findUserById(payload.userId);
    if (!user) {
      return next(new HttpError('User not found', StatusCodes.UNAUTHORIZED));
    }

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
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      return next(err);
    }

    if (err instanceof Error && err.name === 'JsonWebTokenError') {
      return next(new HttpError('Invalid token', StatusCodes.UNAUTHORIZED));
    }

    if (err instanceof Error && err.name === 'TokenExpiredError') {
      return next(new HttpError('Token expired', StatusCodes.UNAUTHORIZED));
    }

    // Log unexpected errors
    console.error('Auth middleware error:', err);
    return next(
      new HttpError('Internal Server Error', StatusCodes.INTERNAL_SERVER_ERROR)
    );
  }
};
