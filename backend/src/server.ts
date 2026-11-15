import { app } from './app';
import { env } from './config/env';
import { AppDataSource } from './database/data-source';
import { logger } from './common/logger';

async function start() {
  await AppDataSource.initialize();
  if (await AppDataSource.showMigrations()) {
    throw new Error('Pending database migrations. Run pnpm migration:run before starting.');
  }
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info({ port: env.PORT }, 'Sweety API is listening');
  });
  server.on('error', () => { logger.fatal('HTTP server failed'); process.exit(1); });

  const shutdown = () => {
    const timeout = setTimeout(() => process.exit(1), 10_000);
    timeout.unref();
    server.close(async () => {
      try {
        await AppDataSource.destroy();
        clearTimeout(timeout);
        process.exit(0);
      } catch {
        process.exit(1);
      }
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch(async (error: unknown) => {
  logger.fatal({
    reason: error instanceof Error && error.message.startsWith('Pending database migrations')
      ? error.message : 'Database initialization failed. Check configuration and migrations.',
  }, 'Unable to start Sweety API');
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
  process.exit(1);
});
