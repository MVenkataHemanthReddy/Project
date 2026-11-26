import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateBody } from '../middlewares/validateMiddleware';
import { registerSchema, loginSchema } from '../validators';
import { authenticate } from '../middlewares/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', validateBody(registerSchema), asyncHandler(AuthController.register));
router.post('/login', validateBody(loginSchema), asyncHandler(AuthController.login));
router.get('/me', authenticate, asyncHandler(AuthController.getMe));

export default router;
