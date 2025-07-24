import prisma from '@/utils/prisma';
import { generateAccessToken, generateRefreshToken, hashPassword, comparePassword } from '../utils/auth';
import catchAsync from '@/utils/catch-async';
import AppError from '@/utils/app-error';
import jwt from 'jsonwebtoken';

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError('Invalid email format.', 400));
  }
  if (typeof password !== 'string' || password.length < 6) {
    return next(new AppError('Password must be at least 6 characters.', 400));
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return next(new AppError('Wrong email or password.', 401));
  }
  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return next(new AppError('Wrong email or password.', 401));
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } });
});

export const register = catchAsync(async (req, res, next) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return next(new AppError('Email, password, and name are required.', 400));
  }
  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError('Invalid email format.', 400));
  }
  if (typeof password !== 'string' || password.length < 6) {
    return next(new AppError('Password must be at least 6 characters.', 400));
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return next(new AppError('Email already in use.', 409));
  }
  const hashed = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, password: hashed, name } });
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return res.status(201).json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } });
});

export const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return next(new AppError('Refresh token required.', 400));
  }
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET || 'secret') as { type: string; userId: number };
    if (payload.type !== 'refresh') return next(new AppError('Invalid token type', 400));
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return next(new AppError('User not found.', 401));
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (e) {
    return next(new AppError('Invalid refresh token.', 400));
  }
});
