import { createEvolutionClient, type EvolutionClient } from '@/shared/evolution';
import {
  createContactsService,
  type ContactsService,
} from '@/modules/contacts/contacts.service';
import {
  createConversationsService,
  type ConversationsService,
} from '@/modules/conversations/conversations.service';
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

export interface SendTextInput {
  conversationId: string;
  text: string;
  /** Agente que enviou; null quando a mensagem parte do bot. */
  sentBy: string | null;
  fromBot?: boolean;
}

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
  /**
   * Envia texto pelo WhatsApp e só então persiste. A ordem importa: se
   * a Evolution falhar, o erro sobe e nada é gravado — melhor o agente
   * ver a falha e reenviar do que a UI mostrar como entregue algo que
   * o cliente nunca recebeu.
   */
  sendText(input: SendTextInput): Promise<MessageRow>;
}

export interface MessagesServiceDeps {
  repo?: MessagesRepository;
  conversations?: ConversationsService;
  contacts?: ContactsService;
  evolution?: EvolutionClient;
}

export function createMessagesService(
  deps: MessagesServiceDeps | MessagesRepository = {},
): MessagesService {
  // Aceita um repositório solto por compatibilidade com as chamadas
  // antigas (`createMessagesService(repo)`), além do objeto de deps.
  const normalized: MessagesServiceDeps =
    'listByConversation' in deps ? { repo: deps } : deps;

  const repo = normalized.repo ?? createMessagesRepository();
  const conversationsRef = normalized.conversations;
  const contactsRef = normalized.contacts;
  const evolutionRef = normalized.evolution;

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

    async sendText({ conversationId, text, sentBy, fromBot = false }) {
      const conversations = conversationsRef ?? createConversationsService();
      const contacts = contactsRef ?? createContactsService();
      const evolution = evolutionRef ?? createEvolutionClient();

      // getById lança 404 quando a conversa não existe.
      const conversation = await conversations.getById(conversationId);
      const contact = await contacts.getById(conversation.contact_id);

      const { externalId } = await evolution.sendText({
        phone: contact.phone,
        text,
      });

      return repo.insertOutbound({
        conversation_id: conversationId,
        external_id: externalId,
        kind: 'text',
        content: text,
        sent_by: sentBy,
        from_bot: fromBot,
        sent_at: new Date().toISOString(),
      });
    },
  };
}
