import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { JWTPayload, Role } from '../types';
import { sendError } from '../utils/apiResponse';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'Authentication token missing or invalid');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendError(res, 401, 'Token has expired. Please log in again.');
      return;
    }
    sendError(res, 401, 'Invalid authentication token');
  }
}

export function authorize(...roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'Unauthorized access');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(
        res,
        403,
        `Forbidden: Role '${req.user.role}' does not have permission for this resource`
      );
      return;
    }

    next();
  };
}
