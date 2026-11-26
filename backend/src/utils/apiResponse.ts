import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  statusCode = 200,
  data?: T,
  message?: string,
  pagination?: ApiResponse['pagination']
): Response {
  const responseBody: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
    ...(pagination && { pagination }),
  };
  return res.status(statusCode).json(responseBody);
}

export function sendError(
  res: Response,
  statusCode = 400,
  error: string,
  data?: any
): Response {
  const responseBody: ApiResponse = {
    success: false,
    error,
    ...(data !== undefined && { data }),
  };
  return res.status(statusCode).json(responseBody);
}
