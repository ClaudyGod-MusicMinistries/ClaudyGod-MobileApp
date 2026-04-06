import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';

// Legacy alias kept for backwards compatibility with older imports.
// The actual implementation lives under modules/auth/auth.routes.ts.
const legacyAuthRouter = Router();
legacyAuthRouter.use(authRouter);

export { legacyAuthRouter };
export default legacyAuthRouter;
