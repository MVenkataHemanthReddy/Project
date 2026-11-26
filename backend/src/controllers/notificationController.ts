import { Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { sendSuccess } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class NotificationController {
  static async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    const notifications = await NotificationService.getUserNotifications(req.user!.userId);
    sendSuccess(res, 200, notifications);
  }

  static async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const count = await NotificationService.getUnreadCount(req.user!.userId);
    sendSuccess(res, 200, { unreadCount: count });
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    const notification = await NotificationService.markAsRead(req.params.id, req.user!.userId);
    sendSuccess(res, 200, notification, 'Notification marked as read');
  }

  static async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    await NotificationService.markAllAsRead(req.user!.userId);
    sendSuccess(res, 200, null, 'All notifications marked as read');
  }
}
