import { Router } from 'express';
import { asyncHandler } from '@/shared/asyncHandler';
import { createWebhooksController } from '@/modules/webhooks/webhooks.controller';

const controller = createWebhooksController();

export const webhooksRouter: Router = Router();

webhooksRouter.post('/evolution', asyncHandler(controller.receiveEvolution));
