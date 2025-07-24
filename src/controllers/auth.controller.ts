import { Request, Response } from 'express';
import prisma from '@/utils/prisma';
import { generateAccessToken, generateRefreshToken, hashPassword, comparePassword } from '../utils/auth';
import catchAsync from '@/utils/catch-async';

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }
  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } });
});

export const register = catchAsync(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required.' });
  }
  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: 'Email already in use.' });
  }
  const hashed = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, password: hashed, name } });
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return res.status(201).json({ accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token required.' });
  }
  try {
    const payload = require('jsonwebtoken').verify(refreshToken, process.env.JWT_SECRET || 'secret');
    if (payload.type !== 'refresh') throw new Error('Invalid token type');
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ message: 'User not found.' });
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (e) {
    return res.status(401).json({ message: 'Invalid refresh token.' });
  }
});
