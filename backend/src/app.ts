import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env, parseCorsOrigins } from '@/env';
import { logger } from '@/shared/logger';
import { errorHandler, notFoundHandler } from '@/shared/errors';
import { requireAuth } from '@/modules/auth/auth.middleware';
import { healthRouter } from '@/modules/health/health.routes';
import { contactsRouter } from '@/modules/contacts/contacts.routes';
import { conversationsRouter } from '@/modules/conversations/conversations.routes';
import { webhooksRouter } from '@/modules/webhooks/webhooks.routes';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  // Atrás do Nginx o IP real chega via X-Forwarded-For; sem isso o rate
  // limit contaria todos os clientes como um único IP (o do proxy).
  app.set('trust proxy', 1);
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

  // Allowlist via CORS_ORIGINS; vazio (dev) libera localhost apenas.
  const allowedOrigins = parseCorsOrigins(env.CORS_ORIGINS);
  app.use(
    cors({
      origin:
        allowedOrigins.length > 0
          ? allowedOrigins
          : [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/],
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  const apiLimiter = rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });
  // Webhook tem limite próprio: tráfego vem de um único servidor (Evolution)
  // e pode ser mais bursty que uso humano da API.
  const webhookLimiter = rateLimit({
    windowMs: 60_000,
    limit: 600,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  });

  app.use('/healthz', healthRouter);
  app.use('/contacts', apiLimiter, requireAuth, contactsRouter);
  app.use('/conversations', apiLimiter, requireAuth, conversationsRouter);
  app.use('/webhooks', webhookLimiter, webhooksRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
