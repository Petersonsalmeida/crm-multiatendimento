import { env } from '@/env';
import { createApp } from '@/app';
import { logger } from '@/shared/logger';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV },
    `AliançaCRM backend rodando em http://localhost:${env.PORT}`,
  );
});

function shutdown(signal: string): void {
  logger.info({ signal }, 'Encerrando servidor');
  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Erro ao encerrar servidor');
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
