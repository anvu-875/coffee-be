import prisma from '@/db/prisma';
import authService, {
  REFRESH_TOKEN_COOKIE_NAME
} from '@/services/auth.service';
import catchAsync from '@/utils/catch-async';
import HttpError from '@/utils/http-error';
import userService from '@/services/user.service';
import { StatusCodes } from '@/utils/http-enum';

/**
 * POST /auth/login
 * - Validate credentials
 * - Generate access + refresh tokens
 * - Set **refresh token** in HTTPOnly cookie (never exposed to JS)
 * - Return access token in JSON (frontend stores it and uses Authorization header)
 */
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await userService.findUserByEmail(email);
  if (!user) {
    throw new HttpError('Wrong email or password.', StatusCodes.UNAUTHORIZED);
  }

  const valid = await authService.comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new HttpError('Wrong email or password.', StatusCodes.UNAUTHORIZED);
  }

  const { accessToken, refreshToken, sessionId } =
    await authService.generateTokens(user);

  // Only set refresh token cookie; access token returned in body
  authService.setRefreshCookie(res, refreshToken);

  return res.status(StatusCodes.OK).json({
    accessToken,
    sessionId,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

/**
 * POST /auth/register
 * - Create user, same behavior as login regarding tokens/cookie
 */
export const register = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new HttpError('Email already in use.', StatusCodes.CONFLICT);
  }

  const hashed = await authService.hashPassword(password);
  const user = await userService.createUserWithoutName(email, hashed);

  const { accessToken, refreshToken, sessionId } =
    await authService.generateTokens(user);
  authService.setRefreshCookie(res, refreshToken);

  return res.status(StatusCodes.CREATED).json({
    accessToken,
    sessionId,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

/**
 * POST /auth/refresh
 * - Read refresh token from HTTPOnly cookie
 * - Verify it, rotate tokens (re-use sessionId), set new refresh cookie
 * - Return new access token in JSON
 */
export const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
  if (!token) {
    throw new HttpError('Refresh token required.', StatusCodes.UNAUTHORIZED);
  }

  const payload = await authService.verifyToken(token, 'refresh');
  const user = await userService.findUserById(payload.userId);
  if (!user) {
    throw new HttpError('User not found.', StatusCodes.UNAUTHORIZED);
  }

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
    await authService.rotateTokens(user, payload.sessionId);

  // Set new refresh token cookie (HTTPOnly)
  authService.setRefreshCookie(res, newRefreshToken);

  return res.status(StatusCodes.OK).json({
    accessToken: newAccessToken,
    sessionId: payload.sessionId
  });
});

/**
 * POST /auth/logout
 * - Protected route (requires valid access token)
 * - Delete session from storage (redis) and clear refresh cookie
 */
export const logout = catchAsync(async (req, res) => {
  if (!req.auth) {
    throw new HttpError(
      'No auth info found in request',
      StatusCodes.UNAUTHORIZED
    );
  }

  await authService.delSession(req.auth.sessionId);

  // Clear refresh cookie
  authService.clearRefreshCookie(res);

  return res
    .status(StatusCodes.OK)
    .json({ message: 'Logged out successfully.' });
});
