import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../lib/errors';
import { resolveInstallationCredential } from '../modules/mobile/installation.service';

export const authenticateInstallation: RequestHandler = async (req, _res, next) => {
  const cookieToken = req.header('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith('cg_installation='))?.slice('cg_installation='.length);
  const token = req.header('x-installation-token')?.trim() || (cookieToken ? decodeURIComponent(cookieToken) : undefined);
  if (!token) {
    next(new UnauthorizedError('Missing installation credential', 'INSTALLATION_CREDENTIAL_MISSING'));
    return;
  }
  try {
    req.installation = await resolveInstallationCredential(token);
    next();
  } catch (error) {
    next(error);
  }
};
