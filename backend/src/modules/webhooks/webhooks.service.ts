import {
  createContactsService,
  type ContactsService,
} from '@/modules/contacts/contacts.service';
import {
  createConversationsService,
  type ConversationsService,
} from '@/modules/conversations/conversations.service';
import {
  createMessagesService,
  type MessagesService,
} from '@/modules/messages/messages.service';
import type { MessageKind } from '@/modules/messages/messages.types';
import {
  evolutionMessageDataSchema,
  type EvolutionWebhookEnvelope,
  type ExtractedInboundMessage,
} from '@/modules/webhooks/webhooks.types';

// ---------------------------------------------------------------------
// Helpers — normalização do payload Evolution
// ---------------------------------------------------------------------

/**
 * Converte um remoteJid do WhatsApp (`5551999990000@s.whatsapp.net` ou
 * `5551999...@c.us`) num telefone canônico com `+`. Retorna null para
 * grupos (`@g.us`) e formatos não reconhecidos.
 */
export function parsePhoneFromRemoteJid(remoteJid: string): string | null {
  if (!remoteJid.includes('@')) return null;
  const [user, domain] = remoteJid.split('@');
  if (!user || !domain) return null;
  if (domain === 'g.us' || domain === 'broadcast') return null; // grupo / broadcast
  // user pode vir como "5551999990000" ou "5551999990000:1" (multi-device)
  const digits = (user.split(':')[0] ?? '').replace(/\D/g, '');
  if (digits.length < 8) return null;
  return `+${digits}`;
}

function detectKind(
  message: NonNullable<EvolutionMessageDataInferred['message']>,
): { kind: MessageKind; content: string | null; mediaUrl: string | null } {
  if (message.imageMessage) {
    return {
      kind: 'image',
      content: message.imageMessage.caption ?? null,
      mediaUrl: message.imageMessage.url ?? null,
    };
  }
  if (message.audioMessage) {
    return { kind: 'audio', content: null, mediaUrl: message.audioMessage.url ?? null };
  }
  if (message.videoMessage) {
    return {
      kind: 'video',
      content: message.videoMessage.caption ?? null,
      mediaUrl: message.videoMessage.url ?? null,
    };
  }
  if (message.documentMessage) {
    return {
      kind: 'document',
      content: message.documentMessage.caption ?? null,
      mediaUrl: message.documentMessage.url ?? null,
    };
  }
  if (message.stickerMessage) {
    return { kind: 'sticker', content: null, mediaUrl: message.stickerMessage.url ?? null };
  }
  if (message.locationMessage) {
    return { kind: 'location', content: null, mediaUrl: null };
  }
  if (message.extendedTextMessage?.text) {
    return { kind: 'text', content: message.extendedTextMessage.text, mediaUrl: null };
  }
  if (typeof message.conversation === 'string') {
    return { kind: 'text', content: message.conversation, mediaUrl: null };
  }
  return { kind: 'system', content: null, mediaUrl: null };
}

type EvolutionMessageDataInferred = ReturnType<
  typeof evolutionMessageDataSchema.parse
>;

/**
 * Normaliza o payload de `messages.upsert` do Evolution.
 * Retorna null quando não é processável (grupo, fromMe, evento outro).
 */
export function extractInboundMessage(
  envelope: EvolutionWebhookEnvelope,
): ExtractedInboundMessage | null {
  if (envelope.event !== 'messages.upsert') return null;

  const parsed = evolutionMessageDataSchema.safeParse(envelope.data);
  if (!parsed.success) return null;

  const data = parsed.data;
  if (data.key.fromMe) return null; // mensagem do próprio operador

  const phone = parsePhoneFromRemoteJid(data.key.remoteJid);
  if (!phone) return null;

  const message = data.message;
  const { kind, content, mediaUrl } = message
    ? detectKind(message)
    : { kind: 'system' as MessageKind, content: null, mediaUrl: null };

  // messageTimestamp pode vir como string ou number (segundos)
  const tsRaw = data.messageTimestamp;
  const tsSeconds =
    typeof tsRaw === 'number'
      ? tsRaw
      : typeof tsRaw === 'string'
        ? Number.parseInt(tsRaw, 10)
        : NaN;
  const sentAt = Number.isFinite(tsSeconds)
    ? new Date(tsSeconds * 1000).toISOString()
    : new Date().toISOString();

  return {
    phone,
    pushName: data.pushName?.trim() || null,
    externalId: data.key.id ?? null,
    kind,
    content,
    mediaUrl,
    sentAt,
  };
}

// ---------------------------------------------------------------------
// Service — orquestra contact → conversation → message
// ---------------------------------------------------------------------
export type WebhookProcessResult =
  | { status: 'ignored'; reason: string }
  | {
      status: 'processed';
      contactId: string;
      conversationId: string;
      messageId: string;
    };

export interface WebhooksService {
  receiveEvolution(envelope: EvolutionWebhookEnvelope): Promise<WebhookProcessResult>;
}

export interface WebhooksServiceDeps {
  contacts?: ContactsService;
  conversations?: ConversationsService;
  messages?: MessagesService;
}

export function createWebhooksService(deps: WebhooksServiceDeps = {}): WebhooksService {
  const contacts = deps.contacts ?? createContactsService();
  const conversations = deps.conversations ?? createConversationsService();
  const messages = deps.messages ?? createMessagesService();

  return {
    async receiveEvolution(envelope) {
      const inbound = extractInboundMessage(envelope);
      if (!inbound) {
        return { status: 'ignored', reason: `event=${envelope.event}` };
      }

      const contact = await contacts.ensureByPhone({
        phone: inbound.phone,
        fallbackName: inbound.pushName ?? undefined,
      });

      const conversation = await conversations.ensureOpenForContact({
        contactId: contact.id,
        channel: 'whatsapp',
      });

      const message = await messages.persistInbound({
        conversationId: conversation.id,
        externalId: inbound.externalId,
        kind: inbound.kind,
        content: inbound.content,
        mediaUrl: inbound.mediaUrl,
        sentAt: inbound.sentAt,
      });

      return {
        status: 'processed',
        contactId: contact.id,
        conversationId: conversation.id,
        messageId: message.id,
      };
    },
  };
}
