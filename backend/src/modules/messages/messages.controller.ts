import type { Request, Response } from 'express';
import {
  createMessagesService,
  type MessagesService,
} from '@/modules/messages/messages.service';
import { conversationIdParamSchema } from '@/modules/conversations/conversations.types';
import {
  listMessagesQuerySchema,
  sendMessageBodySchema,
} from '@/modules/messages/messages.types';

const defaultService = createMessagesService();

export interface MessagesController {
  listByConversation(req: Request, res: Response): Promise<void>;
  send(req: Request, res: Response): Promise<void>;
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

    async send(req, res) {
      const { id } = conversationIdParamSchema.parse(req.params);
      const { text } = sendMessageBodySchema.parse(req.body);

      // req.authUser é populado por requireActiveUser, que roda antes
      // desta rota — a autoria fica no servidor, nunca no corpo.
      const message = await service.sendText({
        conversationId: id,
        text,
        sentBy: req.authUser?.id ?? null,
      });

      res.status(201).json(message);
    },
  };
}
