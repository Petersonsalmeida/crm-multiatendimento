import type { Request, Response } from 'express';
import {
  createMessagesService,
  type MessagesService,
} from '@/modules/messages/messages.service';
import { conversationIdParamSchema } from '@/modules/conversations/conversations.types';
import { listMessagesQuerySchema } from '@/modules/messages/messages.types';

const defaultService = createMessagesService();

export interface MessagesController {
  listByConversation(req: Request, res: Response): Promise<void>;
}

export function createMessagesController(
  service: MessagesService = defaultService,
): MessagesController {
  return {
    async listByConversation(req, res) {
      const { id } = conversationIdParamSchema.parse(req.params);
      const query = listMessagesQuerySchema.parse(req.query);
      const result = await service.listByConversation({
        conversationId: id,
        query,
      });
      res.json(result);
    },
  };
}
