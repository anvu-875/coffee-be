import { Router } from 'express';
import {
  login,
  register,
  refreshToken,
  logout
} from '@/controllers/auth.controller';
import { validateBody } from '@/middlewares/validation.middleware';
import { loginSchema, registerSchema } from '@/schemas/auth.schema';
import { withAuth } from '@/middlewares/authorization.middleware';

const router = Router();

export const authRouteName = 'auth';

/**
 * @preserve
 * @openapi
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginSchema'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateBody(loginSchema), login);

/**
 * @preserve
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterSchema'
 *     responses:
 *       201:
 *         description: User registered
 *       409:
 *         description: Email already in use
 */
router.post('/register', validateBody(registerSchema), register);

/**
 * @preserve
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', refreshToken);

/**
 * @preserve
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: User logout
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', withAuth, logout);

//test auth route
/**
 * @preserve
 * @openapi
 * /auth/test:
 *  get:
 *    summary: Test authentication
 *    tags:
 *      - Auth
 *    security:
 *      - BearerAuth: []
 *    responses:
 *      200:
 *        description: You are authenticated
 *      401:
 *        description: Unauthorized
 */
router.get('/test', withAuth, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.auth?.user });
});

export default router;
