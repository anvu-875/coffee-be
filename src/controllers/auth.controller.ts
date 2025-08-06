import prisma from '@/db/prisma';
import authService from '@/services/auth.service';
import catchAsync from '@/utils/catch-async';
import HttpError from '@/utils/http-error';
import jwt from 'jsonwebtoken';
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
  const accessToken = authService.generateAccessToken(user);
  const refreshToken = authService.generateRefreshToken(user);
  return res.status(StatusCodes.OK).json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

export const register = catchAsync(async (req, res, next) => {
  const { email, password, name } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return next(new HttpError('Email already in use.', StatusCodes.CONFLICT));
  }
  const hashed = await authService.hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash: hashed, name }
  });
  const accessToken = authService.generateAccessToken(user);
  const refreshToken = authService.generateRefreshToken(user);
  return res.status(StatusCodes.CREATED).json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

export const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET || 'secret'
    ) as { type: string; userId: string };
    if (payload.type !== 'refresh')
      return next(new HttpError('Invalid token type', StatusCodes.BAD_REQUEST));
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    if (!user)
      return next(new HttpError('User not found.', StatusCodes.UNAUTHORIZED));
    const newAccessToken = authService.generateAccessToken(user);
    const newRefreshToken = authService.generateRefreshToken(user);
    return res.status(StatusCodes.OK).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch {
    return next(
      new HttpError('Invalid refresh token.', StatusCodes.BAD_REQUEST)
    );
  }
});
