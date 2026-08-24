import { describe, expect, it, vi } from 'vitest';
import {
  createWebhooksService,
  extractInboundMessage,
  parsePhoneFromRemoteJid,
} from '@/modules/webhooks/webhooks.service';
import type { ContactsService } from '@/modules/contacts/contacts.service';
import type { ConversationsService } from '@/modules/conversations/conversations.service';
import type { MessagesService } from '@/modules/messages/messages.service';
import type { ContactRow } from '@/modules/contacts/contacts.types';
import type { ConversationRow } from '@/modules/conversations/conversations.types';
import type { MessageRow } from '@/modules/messages/messages.types';

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
function makeContact(): ContactRow {
  return {
    id: 'cccccccc-1111-1111-1111-111111111111',
    name: 'João',
    phone: '+5551999990000',
    email: null,
    company: null,
    status: 'novo',
    tags: [],
    notes: null,
    source: 'whatsapp',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function makeConversation(contactId: string): ConversationRow {
  return {
    id: 'cccccccc-2222-2222-2222-222222222222',
    contact_id: contactId,
    channel: 'whatsapp',
    assigned_to: null,
    status: 'aberta',
    last_msg_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function makeMessage(conversationId: string): MessageRow {
  return {
    id: 'cccccccc-3333-3333-3333-333333333333',
    conversation_id: conversationId,
    external_id: 'wa-1',
    direction: 'inbound',
    kind: 'text',
    content: 'oi',
    media_url: null,
    from_bot: false,
    sent_by: null,
    sent_at: new Date().toISOString(),
    delivered_at: null,
    read_at: null,
  };
}

function makeServiceMocks() {
  const contacts: ContactsService = {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    ensureByPhone: vi.fn(),
  };
  const conversations: ConversationsService = {
    list: vi.fn(),
    getById: vi.fn(),
    ensureOpenForContact: vi.fn(),
  };
  const messages: MessagesService = {
    listByConversation: vi.fn(),
    persistInbound: vi.fn(),
    sendText: vi.fn(),
  };
  return { contacts, conversations, messages };
}

// ---------------------------------------------------------------------
// Helpers puros
// ---------------------------------------------------------------------
describe('parsePhoneFromRemoteJid', () => {
  it('aceita s.whatsapp.net', () => {
    expect(parsePhoneFromRemoteJid('5551999990000@s.whatsapp.net')).toBe(
      '+5551999990000',
    );
  });

  it('aceita c.us (formato antigo)', () => {
    expect(parsePhoneFromRemoteJid('5551999990000@c.us')).toBe(
      '+5551999990000',
    );
  });

  it('descarta grupo (@g.us)', () => {
    expect(parsePhoneFromRemoteJid('120363999999@g.us')).toBeNull();
  });

  it('descarta jid sem @', () => {
    expect(parsePhoneFromRemoteJid('5551999990000')).toBeNull();
  });

  it('strip do sufixo multi-device :N', () => {
    expect(parsePhoneFromRemoteJid('5551999990000:23@s.whatsapp.net')).toBe(
      '+5551999990000',
    );
  });
});

describe('extractInboundMessage', () => {
  const baseEnvelope = (overrides: Record<string, unknown> = {}) => ({
    event: 'messages.upsert',
    instance: 'alianca',
    data: {
      key: {
        remoteJid: '5551999990000@s.whatsapp.net',
        fromMe: false,
        id: 'wa-1',
      },
      pushName: 'João',
      messageTimestamp: 1730000000,
      messageType: 'conversation',
      message: { conversation: 'oi' },
      ...overrides,
    },
  });

  it('extrai mensagem de texto simples', () => {
    const result = extractInboundMessage(baseEnvelope());
    expect(result).toMatchObject({
      phone: '+5551999990000',
      pushName: 'João',
      externalId: 'wa-1',
      kind: 'text',
      content: 'oi',
      mediaUrl: null,
    });
    expect(new Date(result!.sentAt).getTime()).toBe(1730000000 * 1000);
  });

  it('aceita extendedTextMessage', () => {
    const result = extractInboundMessage(
      baseEnvelope({ message: { extendedTextMessage: { text: 'olá!' } } }),
    );
    expect(result?.kind).toBe('text');
    expect(result?.content).toBe('olá!');
  });

  it('extrai imagem com legenda + media url', () => {
    const result = extractInboundMessage(
      baseEnvelope({
        message: {
          imageMessage: { url: 'https://example.com/x.jpg', caption: 'foto' },
        },
      }),
    );
    expect(result?.kind).toBe('image');
    expect(result?.content).toBe('foto');
    expect(result?.mediaUrl).toBe('https://example.com/x.jpg');
  });

  it('ignora mensagem fromMe (operador)', () => {
    const result = extractInboundMessage(
      baseEnvelope({
        key: {
          remoteJid: '5551999990000@s.whatsapp.net',
          fromMe: true,
          id: 'wa-1',
        },
      }),
    );
    expect(result).toBeNull();
  });

  it('ignora grupo', () => {
    const result = extractInboundMessage(
      baseEnvelope({
        key: { remoteJid: '120363999999@g.us', fromMe: false, id: 'wa-1' },
      }),
    );
    expect(result).toBeNull();
  });

  it('ignora evento que não é messages.upsert', () => {
    expect(
      extractInboundMessage({ event: 'presence.update', data: {} }),
    ).toBeNull();
  });

  it('aceita messageTimestamp como string', () => {
    const result = extractInboundMessage(
      baseEnvelope({ messageTimestamp: '1730000000' }),
    );
    expect(new Date(result!.sentAt).getTime()).toBe(1730000000 * 1000);
  });
});

// ---------------------------------------------------------------------
// Service — orquestração
// ---------------------------------------------------------------------
describe('WebhooksService.receiveEvolution', () => {
  it('orquestra contact → conversation → message e devolve ids', async () => {
    const { contacts, conversations, messages } = makeServiceMocks();
    const contact = makeContact();
    const conversation = makeConversation(contact.id);
    const message = makeMessage(conversation.id);

    vi.mocked(contacts.ensureByPhone).mockResolvedValue(contact);
    vi.mocked(conversations.ensureOpenForContact).mockResolvedValue(conversation);
    vi.mocked(messages.persistInbound).mockResolvedValue(message);

    const service = createWebhooksService({ contacts, conversations, messages });
    const result = await service.receiveEvolution({
      event: 'messages.upsert',
      data: {
        key: { remoteJid: '5551999990000@s.whatsapp.net', fromMe: false, id: 'wa-1' },
        pushName: 'João',
        messageTimestamp: 1730000000,
        message: { conversation: 'oi' },
      },
    });

    expect(result).toEqual({
      status: 'processed',
      contactId: contact.id,
      conversationId: conversation.id,
      messageId: message.id,
    });
    expect(contacts.ensureByPhone).toHaveBeenCalledWith({
      phone: '+5551999990000',
      fallbackName: 'João',
    });
    expect(conversations.ensureOpenForContact).toHaveBeenCalledWith({
      contactId: contact.id,
      channel: 'whatsapp',
    });
  });

  it('ignora eventos não-processáveis sem chamar serviços', async () => {
    const mocks = makeServiceMocks();
    const service = createWebhooksService(mocks);

    const result = await service.receiveEvolution({
      event: 'presence.update',
      data: {},
    });

    expect(result.status).toBe('ignored');
    expect(mocks.contacts.ensureByPhone).not.toHaveBeenCalled();
    expect(mocks.messages.persistInbound).not.toHaveBeenCalled();
  });
});
