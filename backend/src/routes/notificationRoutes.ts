import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticate } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(NotificationController.getNotifications));
router.get('/unread-count', asyncHandler(NotificationController.getUnreadCount));
router.patch('/:id/read', asyncHandler(NotificationController.markAsRead));
router.post('/mark-all-read', asyncHandler(NotificationController.markAllAsRead));

export default router;
