import prisma from '@/db/prisma';
import authService, {
  REFRESH_TOKEN_COOKIE_NAME
} from '@/services/auth.service';
import catchAsync from '@/utils/catch-async';
import HttpError from '@/utils/http-error';
import userService from '@/services/user.service';
import { StatusCodes } from '@/utils/http-enum';

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await userService.findUserByEmail(email);
  if (!user) {
    return next(
      new HttpError('Wrong email or password.', StatusCodes.UNAUTHORIZED)
    );
  }

  const valid = await authService.comparePassword(password, user.passwordHash);
  if (!valid) {
    return next(
      new HttpError('Wrong email or password.', StatusCodes.UNAUTHORIZED)
    );
  }

  // Generate access + refresh token (with sessionId saved in Redis)
  const { accessToken, refreshToken, sessionId } =
    await authService.generateTokens(user);

  // Set tokens in cookies
  authService.setCookies(res, {
    accessToken,
    refreshToken
  });

  return res.status(StatusCodes.OK).json({
    accessToken,
    refreshToken,
    sessionId,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

export const register = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return next(new HttpError('Email already in use.', StatusCodes.CONFLICT));
  }

  const hashed = await authService.hashPassword(password);
  const user = await userService.createUserWithoutName(email, hashed);

  const { accessToken, refreshToken, sessionId } =
    await authService.generateTokens(user);

  // Set tokens in cookies
  authService.setCookies(res, {
    accessToken,
    refreshToken
  });

  return res.status(StatusCodes.CREATED).json({
    accessToken,
    refreshToken,
    sessionId,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

export const refreshToken = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
  if (!refreshToken) {
    return next(
      new HttpError('Refresh token required.', StatusCodes.UNAUTHORIZED)
    );
  }

  try {
    const payload = await authService.verifyToken(refreshToken);

    if (payload.type !== 'refresh') {
      return next(
        new HttpError('Invalid refresh token', StatusCodes.UNAUTHORIZED)
      );
    }

    const user = await userService.findUserById(payload.userId);
    if (!user) {
      return next(new HttpError('User not found.', StatusCodes.UNAUTHORIZED));
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await authService.rotateTokens(user, payload.sessionId);

    authService.setCookies(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

    return res.status(StatusCodes.OK).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionId: payload.sessionId
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'TokenExpiredError') {
      return next(
        new HttpError('Refresh token expired', StatusCodes.UNAUTHORIZED)
      );
    }
    if (err instanceof Error && err.name === 'JsonWebTokenError') {
      return next(new HttpError('Invalid token', StatusCodes.UNAUTHORIZED));
    }

    console.error('Refresh API error:', err);
    return next(
      new HttpError('Internal Server Error', StatusCodes.INTERNAL_SERVER_ERROR)
    );
  }
});

export const logout = catchAsync(async (req, res, _next) => {
  if (!req.auth) {
    throw new Error('No auth info found in request');
  }

  const { sessionId } = req.auth;

  await authService.delSession(sessionId);

  // Clear cookies
  authService.clearCookies(res);

  return res
    .status(StatusCodes.OK)
    .json({ message: 'Logged out successfully.' });
});
