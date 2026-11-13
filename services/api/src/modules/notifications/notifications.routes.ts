import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { requireCapability } from '../../middleware/rbac';
import { validateSchema } from '../../lib/validation';
import { asyncHandler } from '../../lib/asyncHandler';
import {
  broadcastNotificationSchema,
  listCampaignsQuerySchema,
} from './notifications.schema';
import { NotificationsService } from './notifications.service';

const router = Router();

// All notification management endpoints require admin capability
router.use(authenticate, requireCapability('notifications.manage'));

router.post(
  '/broadcast',
  asyncHandler(async (req, res) => {
    const body = validateSchema(broadcastNotificationSchema, req.body);
    const adminUserId = req.user?.sub ?? '';
    const result = await NotificationsService.broadcast(body, adminUserId);
    res.status(201).json({
      success: true,
      data: result,
      message: `Broadcast sent to ${result.accepted} recipient(s).`,
    });
  }),
);

router.get(
  '/campaigns',
  asyncHandler(async (req, res) => {
    const query = validateSchema(listCampaignsQuerySchema, req.query);
    const result = await NotificationsService.listCampaigns(query);
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  }),
);

router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const stats = await NotificationsService.getStats();
    res.json({
      success: true,
      data: stats,
    });
  }),
);

export const adminNotificationsRouter = router;
