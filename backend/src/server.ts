import { createApp } from './app';
import { config } from './config';
import { connectDB, disconnectDB } from './config/db';

async function bootstrap() {
  await connectDB();

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`===============================================`);
    console.log(`🚀 Support Ticket Backend API is running!`);
    console.log(`📍 URL: http://localhost:${config.port}`);
    console.log(`🩺 Health: http://localhost:${config.port}/api/health`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`===============================================`);
  });

  const handleShutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      await disconnectDB();
      console.log('[Server] Graceful shutdown complete.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('[Server] Fatal bootstrap error:', error);
  process.exit(1);
});
