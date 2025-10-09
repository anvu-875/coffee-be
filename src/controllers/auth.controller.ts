import type { Request, Response } from 'express';
import prisma from '@/db/prisma'; // if you use prisma; otherwise adapt
import authService, {
  REFRESH_TOKEN_COOKIE_NAME
} from '@/services/auth.service';
import userService from '@/services/user.service'; // adapt to your user service
import catchAsync from '@/utils/catch-async';
import HttpError from '@/utils/http-error';
import { StatusCodes } from '@/utils/http-enum';

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await userService.findUserByEmail(email);
  if (!user)
    throw new HttpError('Wrong email or password.', StatusCodes.UNAUTHORIZED);

  const valid = await authService.comparePassword(password, user.passwordHash);
  if (!valid)
    throw new HttpError('Wrong email or password.', StatusCodes.UNAUTHORIZED);

  const { accessToken, refreshToken, sessionId } =
    await authService.generateTokens(user);

  authService.setRefreshCookie(res, refreshToken);

  return res.status(StatusCodes.OK).json({
    accessToken,
    sessionId,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

export const register = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    throw new HttpError('Email already in use.', StatusCodes.CONFLICT);

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

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  // Expect refresh token in HTTPOnly cookie
  const token = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
  if (!token)
    throw new HttpError('Refresh token required.', StatusCodes.UNAUTHORIZED);

  // Verify token (signature, expiry, etc)
  const decoded = await authService.verifyToken(token, 'refresh');

  // Ensure user still exists
  const user = await userService.findUserById(decoded.userId);
  if (!user) throw new HttpError('User not found', StatusCodes.UNAUTHORIZED);

  // Attempt rotate atomically
  const { accessToken: newAccess, refreshToken: newRefresh } =
    await authService.rotateIfJtiMatches(user, decoded.sessionId, decoded.jti);

  // Set new refresh token cookie
  authService.setRefreshCookie(res, newRefresh);

  // Return new access token
  return res.status(StatusCodes.OK).json({
    accessToken: newAccess,
    sessionId: decoded.sessionId
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  if (!req.auth)
    throw new HttpError('No auth info found', StatusCodes.UNAUTHORIZED);

  await authService.delSession(req.auth.sessionId);
  authService.clearRefreshCookie(res);

  return res
    .status(StatusCodes.OK)
    .json({ message: 'Logged out successfully.' });
});
