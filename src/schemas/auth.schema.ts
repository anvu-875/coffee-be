import { z } from 'zod';

/**
 * @preserve
 * @license
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
 * @preserve
 * @license
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
 */
export const registerSchema = z.object({
  email: z.string('Email is required').email('Invalid email address'),
  password: z
    .string('Password is required')
    .min(6, 'Password must be at least 6 characters')
});

/**
 * @preserve
 * @license
 * @swagger
 * components:
 *   schemas:
 *    RefreshTokenSchema:
 *      type: object
 *      required:
 *        - refreshToken
 *      properties:
 *        refreshToken:
 *          type: string
 *          description: User's refresh token.
 */
