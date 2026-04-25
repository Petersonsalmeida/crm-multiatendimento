import { Router } from 'express';
import { asyncHandler } from '@/shared/asyncHandler';
import { createConversationsController } from '@/modules/conversations/conversations.controller';
import { createMessagesController } from '@/modules/messages/messages.controller';

const conversations = createConversationsController();
const messages = createMessagesController();

export const conversationsRouter: Router = Router();

conversationsRouter.get('/', asyncHandler(conversations.list));
conversationsRouter.get('/:id', asyncHandler(conversations.getById));

// Histórico de mensagens de uma conversa específica.
conversationsRouter.get(
  '/:id/messages',
  asyncHandler(messages.listByConversation),
);
