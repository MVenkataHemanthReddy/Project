import { Response } from 'express';
import { StatsService } from '../services/statsService';
import { sendSuccess } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class StatsController {
  static async getOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
    const stats = await StatsService.getOverviewStats();
    sendSuccess(res, 200, stats);
  }
}
