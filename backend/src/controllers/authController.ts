import { Response } from 'express';
import { AuthService } from '../services/authService';
import { sendSuccess } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export class AuthController {
  static async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await AuthService.register(req.body);
    sendSuccess(res, 201, result, 'Registration successful');
  }

  static async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    const result = await AuthService.login(req.body);
    sendSuccess(res, 200, result, 'Login successful');
  }

  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const profile = await AuthService.getProfile(req.user!.userId);
    sendSuccess(res, 200, profile);
  }
}
