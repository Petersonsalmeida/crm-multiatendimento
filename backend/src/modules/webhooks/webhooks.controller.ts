import type { Request, Response } from 'express';
import { env } from '@/env';
import { AppError } from '@/shared/errors';
import {
  createWebhooksService,
  type WebhooksService,
} from '@/modules/webhooks/webhooks.service';
import { evolutionWebhookEnvelopeSchema } from '@/modules/webhooks/webhooks.types';

const defaultService = createWebhooksService();

export interface WebhooksController {
  receiveEvolution(req: Request, res: Response): Promise<void>;
}

function authorizeEvolution(req: Request): void {
  const expected = env.EVOLUTION_WEBHOOK_SECRET;
  if (!expected) return; // dev: aceita qualquer chamada

  const provided =
    req.header('apikey') ?? req.header('x-evolution-secret') ?? '';
  if (provided !== expected) {
    throw new AppError('Webhook não autorizado', {
      statusCode: 401,
      code: 'webhook_unauthorized',
    });
  }
}

export function createWebhooksController(
  service: WebhooksService = defaultService,
): WebhooksController {
  return {
    async receiveEvolution(req, res) {
      authorizeEvolution(req);
      const envelope = evolutionWebhookEnvelopeSchema.parse(req.body);

      const result = await service.receiveEvolution(envelope);
      req.log.info(
        { event: envelope.event, result },
        'evolution webhook handled',
      );

      // Sempre 202 — o Evolution não precisa retentar quando o evento é
      // ignorado por design (grupo, fromMe etc.). Erros reais sobem como 5xx
      // pelo error handler global.
      res.status(202).json(result);
    },
  };
}

// re-export para testabilidade isolada da política de auth
export { authorizeEvolution };
