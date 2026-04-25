import cors from 'cors';
import express, { type Express } from 'express';
import pinoHttp from 'pino-http';
import { logger } from '@/shared/logger';
import { errorHandler, notFoundHandler } from '@/shared/errors';
import { healthRouter } from '@/modules/health/health.routes';
import { contactsRouter } from '@/modules/contacts/contacts.routes';
import { conversationsRouter } from '@/modules/conversations/conversations.routes';
import { webhooksRouter } from '@/modules/webhooks/webhooks.routes';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.use('/healthz', healthRouter);
  app.use('/contacts', contactsRouter);
  app.use('/conversations', conversationsRouter);
  app.use('/webhooks', webhooksRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
