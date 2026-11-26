import { Router } from 'express';
import { StatsController } from '../controllers/statsController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { Role } from '../types';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Stats endpoints are restricted to ADMIN users
router.get('/overview', authenticate, authorize(Role.ADMIN), asyncHandler(StatsController.getOverview));

export default router;
