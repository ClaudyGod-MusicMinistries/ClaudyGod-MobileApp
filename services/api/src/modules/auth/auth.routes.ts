import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { HttpError } from '../../lib/httpError';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { loginSchema, registerSchema } from './auth.schema';
import { getUserById, loginUser, registerUser } from './auth.service';

export const authRouter = Router();

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(registerSchema, req.body);
    const result = await registerUser(payload);
    res.status(201).json(result);
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const payload = validateSchema(loginSchema, req.body);
    const result = await loginUser(payload);
    res.status(200).json(result);
  }),
);

authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const user = await getUserById(req.user.sub);
    res.status(200).json({ user });
  }),
);
