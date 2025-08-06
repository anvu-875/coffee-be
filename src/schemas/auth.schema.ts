import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginSchema:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address.
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User's password (minimum 6 characters).
 */
export const loginSchema = z.object({
  email: z.string('Email is required').email('Invalid email address'),
  password: z
    .string('Password is required')
    .min(6, 'Password must be at least 6 characters')
});

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterSchema:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address.
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User's password (minimum 6 characters).
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: User's full name.
 */
export const registerSchema = z.object({
  email: z.string('Email is required').email('Invalid email address'),
  password: z
    .string('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  name: z
    .string('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
});

/**
 * @swagger
 * components:
 *   schemas:
 *     RefreshTokenSchema:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: The refresh token.
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string('Refresh token is required')
});
