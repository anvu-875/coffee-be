import prisma from '@/db/prisma';
import authService from '@/services/auth.service';
import catchAsync from '@/utils/catch-async';
import HttpError from '@/utils/http-error';
import jwt from 'jsonwebtoken';
import userService from '@/services/user.service';

export const login = catchAsync(async (req, res, next) => {
  if (!req.body?.email || !req.body?.password) {
    return next(new HttpError('Email and password are required', 400));
  }
  const { email, password } = req.body;
  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new HttpError('Invalid email format.', 400));
  }
  if (typeof password !== 'string' || password.length < 6) {
    return next(new HttpError('Password must be at least 6 characters.', 400));
  }
  const user = await userService.findUserByEmail(email);
  if (!user) {
    return next(new HttpError('Wrong email or password.', 401));
  }
  const valid = await authService.comparePassword(password, user.passwordHash);
  if (!valid) {
    return next(new HttpError('Wrong email or password.', 401));
  }
  const accessToken = authService.generateAccessToken(user);
  const refreshToken = authService.generateRefreshToken(user);
  return res.json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

export const register = catchAsync(async (req, res, next) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return next(new HttpError('Email, password, and name are required.', 400));
  }
  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new HttpError('Invalid email format.', 400));
  }
  if (typeof password !== 'string' || password.length < 6) {
    return next(new HttpError('Password must be at least 6 characters.', 400));
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return next(new HttpError('Email already in use.', 409));
  }
  const hashed = await authService.hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash: hashed, name }
  });
  const accessToken = authService.generateAccessToken(user);
  const refreshToken = authService.generateRefreshToken(user);
  return res.status(201).json({
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name }
  });
});

export const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return next(new HttpError('Refresh token required.', 400));
  }
  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET || 'secret'
    ) as { type: string; userId: string };
    if (payload.type !== 'refresh')
      return next(new HttpError('Invalid token type', 400));
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });
    if (!user) return next(new HttpError('User not found.', 401));
    const newAccessToken = authService.generateAccessToken(user);
    const newRefreshToken = authService.generateRefreshToken(user);
    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch {
    return next(new HttpError('Invalid refresh token.', 400));
  }
});
