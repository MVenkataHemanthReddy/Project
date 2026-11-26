import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes';
import ticketRoutes from './routes/ticketRoutes';
import statsRoutes from './routes/statsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { initializeEventSubscribers } from './events';
import { simulatedEmailOutbox } from './events/listeners/emailNotifierListener';
import { sendSuccess } from './utils/apiResponse';

export function createApp(): Application {
  const app: Application = express();

  // 1. Core Middlewares
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json());
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // 2. Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    sendSuccess(res, 200, {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Support Ticket Management System API',
      version: '1.0.0',
    });
  });

  // 3. Simulated Outbox Viewer (Bonus demo feature)
  app.get('/api/simulator/emails', (_req: Request, res: Response) => {
    sendSuccess(res, 200, simulatedEmailOutbox, 'Simulated outbound email logs');
  });

  // 4. API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/notifications', notificationRoutes);

  // 5. Initialize Event System Listeners
  initializeEventSubscribers();

  // 6. Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
