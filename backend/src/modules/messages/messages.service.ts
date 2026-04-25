import {
  createMessagesRepository,
  type MessagesRepository,
} from '@/modules/messages/messages.repository';
import type {
  ListMessagesQuery,
  MessageRow,
  PaginatedMessages,
  PersistInboundInput,
} from '@/modules/messages/messages.types';

export interface MessagesService {
  listByConversation(args: {
    conversationId: string;
    query: ListMessagesQuery;
  }): Promise<PaginatedMessages>;
  /**
   * Idempotente: se já existe uma mensagem com o mesmo `external_id`,
   * devolve a existente sem inserir. Usado pelo webhook do Evolution
   * (que pode reenviar o mesmo evento).
   */
  persistInbound(input: PersistInboundInput): Promise<MessageRow>;
}

export function createMessagesService(
  repo: MessagesRepository = createMessagesRepository(),
): MessagesService {
  return {
    async listByConversation({ conversationId, query }) {
      const { items, total } = await repo.listByConversation({
        conversationId,
        page: query.page,
        pageSize: query.pageSize,
      });
      return {
        items,
        total,
        page: query.page,
        pageSize: query.pageSize,
      };
    },

    async persistInbound(input) {
      if (input.externalId) {
        const existing = await repo.findByExternalId(input.externalId);
        if (existing) return existing;
      }

      return repo.insertInbound({
        conversation_id: input.conversationId,
        external_id: input.externalId,
        kind: input.kind,
        content: input.content,
        media_url: input.mediaUrl ?? null,
        sent_at: input.sentAt ?? new Date().toISOString(),
      });
    },
  };
}
