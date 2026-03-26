// routes/auth.ts
/**
 * Authentication Routes
 * All auth-related API endpoints with proper rate limiting
 */

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authLimiter, passwordResetLimiter, emailVerifyLimiter } from '../middleware/rateLimiter';
import { validationMiddleware } from '../middleware/validation';

const router = Router();

/**
 * POST /api/auth/signup
 * Register a new user with email validation
 */
router.post(
  '/signup',
  authLimiter,
  AuthController.signup,
);

/**
 * POST /api/auth/login
 * Authenticate user and return JWT tokens
 */
router.post(
  '/login',
  authLimiter,
  AuthController.login,
);

/**
 * POST /api/auth/verify-email
 * Verify user email with token
 * Rate limited to prevent brute force
 */
router.post(
  '/verify-email',
  emailVerifyLimiter,
  AuthController.verifyEmail,
);

/**
 * POST /api/auth/forgot-password
 * Request password reset for email
 */
router.post(
  '/forgot-password',
  authLimiter,
  AuthController.forgotPassword,
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 * Rate limited to prevent brute force
 */
router.post(
  '/reset-password',
  passwordResetLimiter,
  AuthController.resetPassword,
);

/**
 * POST /api/auth/refresh
 * Refresh JWT access token using refresh token
 */
router.post(
  '/refresh',
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Refresh token is required',
          },
        });
      }

      // Validate refresh token (pseudo-code)
      // const decoded = verifyJWT(refreshToken);
      // const user = await userRepository.findById(decoded.userId);

      // Generate new access token (pseudo-code)
      // const newAccessToken = generateJWT(user, '15m');

      return res.status(200).json({
        success: true,
        data: {
          accessToken: 'new-jwt-access-token',
        },
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Invalid or expired refresh token',
        },
      });
    }
  },
);

/**
 * POST /api/auth/logout
 * Logout user and invalidate tokens
 */
router.post(
  '/logout',
  async (req, res) => {
    try {
      // Invalidate refresh token (pseudo-code)
      // const { refreshToken } = req.body;
      // await tokenRepository.invalidate(refreshToken);

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Logout failed',
        },
      });
    }
  },
);

export default router;
