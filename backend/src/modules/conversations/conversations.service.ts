import { AppError } from '@/shared/errors';
import {
  createConversationsRepository,
  type ConversationsRepository,
} from '@/modules/conversations/conversations.repository';
import type {
  Channel,
  ConversationRow,
  ConversationWithContact,
  ListConversationsQuery,
  PaginatedConversations,
} from '@/modules/conversations/conversations.types';

export interface ConversationsService {
  list(query: ListConversationsQuery): Promise<PaginatedConversations>;
  getById(id: string): Promise<ConversationWithContact>;
  /**
   * Idempotente: devolve a conversa "aberta" mais recente do contato no
   * canal informado, ou cria uma nova com status default `aberta`.
   * Conversas com status `finalizada` NÃO são reaproveitadas — uma nova
   * mensagem reabre o atendimento numa conversa nova.
   */
  ensureOpenForContact(input: {
    contactId: string;
    channel?: Channel;
  }): Promise<ConversationRow>;
}

export function createConversationsService(
  repo: ConversationsRepository = createConversationsRepository(),
): ConversationsService {
  return {
    async list(query) {
      const { items, total } = await repo.list(query);
      return {
        items,
        total,
        page: query.page,
        pageSize: query.pageSize,
      };
    },

    async getById(id) {
      const found = await repo.findById(id);
      if (!found) {
        throw new AppError('Conversa não encontrada', {
          statusCode: 404,
          code: 'conversation_not_found',
        });
      }
      return found;
    },

    async ensureOpenForContact({ contactId, channel = 'whatsapp' }) {
      const existing = await repo.findOpenForContact(contactId, channel);
      if (existing) return existing;
      return repo.create({ contact_id: contactId, channel });
    },
  };
}
