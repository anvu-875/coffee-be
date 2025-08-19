import prisma from '@/db/prisma';
import authService, {
  ACCESS_COOKIE_OPTIONS,
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
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
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

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
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, REFRESH_COOKIE_OPTIONS);

  return res.status(StatusCodes.CREATED).json({
    accessToken,
    refreshToken,
    sessionId,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

export const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return next(
      new HttpError('Refresh token required.', StatusCodes.BAD_REQUEST)
    );
  }

  try {
    // Verify refresh token (RS256 + Redis publicKey lookup)
    const payload = await authService.verifyToken(refreshToken);

    if (payload.type !== 'refresh') {
      return next(new HttpError('Invalid token type', StatusCodes.BAD_REQUEST));
    }

    // Ensure the session is still valid in Redis
    const isValidSession = await authService.isSessionValid(payload.sessionId);
    if (!isValidSession) {
      return next(
        new HttpError('Session expired or invalid.', StatusCodes.UNAUTHORIZED)
      );
    }

    const user = await userService.findUserById(payload.userId);
    if (!user) {
      return next(new HttpError('User not found.', StatusCodes.UNAUTHORIZED));
    }

    // Generate new tokens for the same sessionId (rotation)
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await authService.rotateTokens(user, payload.sessionId);

    // Set new tokens in cookies
    res.cookie(ACCESS_TOKEN_COOKIE_NAME, newAccessToken, ACCESS_COOKIE_OPTIONS);
    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      newRefreshToken,
      REFRESH_COOKIE_OPTIONS
    );

    return res.status(StatusCodes.OK).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      sessionId: payload.sessionId
    });
  } catch {
    return next(
      new HttpError('Invalid refresh token.', StatusCodes.BAD_REQUEST)
    );
  }
});

export const logout = catchAsync(async (req, res, _next) => {
  try {
    const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME] as string;
    if (refreshToken) {
      // Verify and delete session from Redis
      const payload = (await authService.verifyToken(refreshToken)) as {
        sessionId: string;
        userId: string;
        type: string;
      };
      if (payload.type === 'refresh') {
        await authService.delSession(payload.sessionId);
      }
    }
  } catch {
    // Ignore errors on logout
  }

  // Clear cookies
  res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, ACCESS_COOKIE_OPTIONS);
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);

  return res
    .status(StatusCodes.OK)
    .json({ message: 'Logged out successfully.' });
});
