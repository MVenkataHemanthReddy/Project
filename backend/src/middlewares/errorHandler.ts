import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error Handler]:', err);

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message);
    return;
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const fields = err.meta?.target ? ` (${err.meta.target})` : '';
    sendError(res, 409, `A record with this value already exists${fields}.`);
    return;
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    sendError(res, 404, 'Record not found.');
    return;
  }

  // Default server error
  sendError(
    res,
    500,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error'
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, `Resource not found: ${req.method} ${req.originalUrl}`);
}
