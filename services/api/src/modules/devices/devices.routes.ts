import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { NotFoundError, UnauthorizedError } from '../../lib/errors';
import { validateSchema } from '../../lib/validation';
import { authenticate } from '../../middleware/authenticate';
import { registerDeviceSchema } from './devices.schema';
import { listUserDevices, registerDevice, revokeDevice } from './devices.service';

export const devicesRouter = Router();

devicesRouter.use(authenticate);

devicesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    const devices = await listUserDevices(req.user.sub);
    res.status(200).json({ devices });
  }),
);

devicesRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    const payload = validateSchema(registerDeviceSchema, req.body);
    const device = await registerDevice(req.user.sub, payload);
    res.status(201).json({ device });
  }),
);

devicesRouter.delete(
  '/:deviceId',
  asyncHandler(async (req, res) => {
    if (!req.user) throw new UnauthorizedError('Unauthorized', 'AUTH_REQUIRED');
    const { deviceId } = req.params;
    if (!deviceId) throw new NotFoundError('Device not found', 'DEVICE_NOT_FOUND');
    await revokeDevice(req.user.sub, deviceId);
    res.status(204).send();
  }),
);
