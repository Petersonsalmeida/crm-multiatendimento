import type { Request, Response } from 'express';
import {
  createConversationsService,
  type ConversationsService,
} from '@/modules/conversations/conversations.service';
import {
  conversationIdParamSchema,
  listConversationsQuerySchema,
} from '@/modules/conversations/conversations.types';

const defaultService = createConversationsService();

export interface ConversationsController {
  list(req: Request, res: Response): Promise<void>;
  getById(req: Request, res: Response): Promise<void>;
}

export function createConversationsController(
  service: ConversationsService = defaultService,
): ConversationsController {
  return {
    async list(req, res) {
      const query = listConversationsQuerySchema.parse(req.query);
      const result = await service.list(query);
      res.json(result);
    },

    async getById(req, res) {
      const { id } = conversationIdParamSchema.parse(req.params);
      const conversation = await service.getById(id);
      res.json(conversation);
    },
  };
}
