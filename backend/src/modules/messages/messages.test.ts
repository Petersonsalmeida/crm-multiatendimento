import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/errors';
import {
  buildSendTextBody,
  extractExternalId,
  type EvolutionClient,
} from '@/shared/evolution';
import { createMessagesService } from '@/modules/messages/messages.service';
import type { MessagesRepository } from '@/modules/messages/messages.repository';
import type { MessageRow } from '@/modules/messages/messages.types';
import type { ContactsService } from '@/modules/contacts/contacts.service';
import type { ConversationsService } from '@/modules/conversations/conversations.service';

function makeMessage(partial: Partial<MessageRow> = {}): MessageRow {
  return {
    id: 'mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm',
    conversation_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    external_id: null,
    direction: 'inbound',
    kind: 'text',
    content: 'oi',
    media_url: null,
    from_bot: false,
    sent_by: null,
    sent_at: new Date().toISOString(),
    delivered_at: null,
    read_at: null,
    ...partial,
  };
}

function makeRepoMock(): MessagesRepository {
  return {
    listByConversation: vi.fn(),
    findByExternalId: vi.fn(),
    insertInbound: vi.fn(),
    insertOutbound: vi.fn(),
  };
}

describe('MessagesService.persistInbound', () => {
  it('insere mensagem nova quando external_id ainda não existe', async () => {
    const repo = makeRepoMock();
    vi.mocked(repo.findByExternalId).mockResolvedValue(null);
    vi.mocked(repo.insertInbound).mockImplementation(async (args) =>
      makeMessage({ ...args, id: 'inserted' }),
    );

    const service = createMessagesService(repo);
    const result = await service.persistInbound({
      conversationId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      externalId: 'wa-msg-123',
      kind: 'text',
      content: 'olá',
    });

    expect(result.id).toBe('inserted');
    expect(repo.insertInbound).toHaveBeenCalledOnce();
    expect(repo.insertInbound).toHaveBeenCalledWith(
      expect.objectContaining({ external_id: 'wa-msg-123', kind: 'text' }),
    );
  });

  it('retorna existente sem inserir quando external_id já está no banco', async () => {
    const existing = makeMessage({ id: 'dup', external_id: 'wa-msg-123' });
    const repo = makeRepoMock();
    vi.mocked(repo.findByExternalId).mockResolvedValue(existing);

    const service = createMessagesService(repo);
    const result = await service.persistInbound({
      conversationId: existing.conversation_id,
      externalId: 'wa-msg-123',
      kind: 'text',
      content: 'olá',
    });

    expect(result).toBe(existing);
    expect(repo.insertInbound).not.toHaveBeenCalled();
  });

  it('insere direto quando external_id é null (sem checagem de duplicata)', async () => {
    const repo = makeRepoMock();
    vi.mocked(repo.insertInbound).mockImplementation(async (args) =>
      makeMessage({ ...args, id: 'inserted' }),
    );

    const service = createMessagesService(repo);
    await service.persistInbound({
      conversationId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      externalId: null,
      kind: 'text',
      content: 'oi',
    });

    expect(repo.findByExternalId).not.toHaveBeenCalled();
    expect(repo.insertInbound).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------
// Cliente da Evolution — formato do payload (v1.7.2)
// ---------------------------------------------------------------------
describe('buildSendTextBody', () => {
  it('aninha o texto em textMessage (formato da v1, não da v2)', () => {
    expect(buildSendTextBody({ phone: '+5551999990000', text: 'oi' })).toEqual({
      number: '5551999990000',
      textMessage: { text: 'oi' },
    });
  });

  it('remove o + e a formatação do telefone', () => {
    const body = buildSendTextBody({ phone: '+55 (51) 99999-0000', text: 'x' });
    expect(body.number).toBe('5551999990000');
  });
});

describe('extractExternalId', () => {
  it('lê key.id da resposta', () => {
    expect(extractExternalId({ key: { id: 'WA-123' } })).toBe('WA-123');
  });

  it('devolve null quando a resposta não traz key.id', () => {
    expect(extractExternalId({})).toBeNull();
    expect(extractExternalId(null)).toBeNull();
    expect(extractExternalId({ key: {} })).toBeNull();
    expect(extractExternalId({ key: { id: '' } })).toBeNull();
  });
});

// ---------------------------------------------------------------------
// MessagesService.sendText — envia primeiro, persiste depois
// ---------------------------------------------------------------------
const CONVERSATION_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const CONTACT_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const AGENT_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

function makeSendDeps(overrides: { evolution?: Partial<EvolutionClient> } = {}) {
  const repo = makeRepoMock();
  vi.mocked(repo.insertOutbound).mockImplementation(async (args) =>
    makeMessage({ ...args, id: 'sent', direction: 'outbound' }),
  );

  const conversations = {
    getById: vi.fn().mockResolvedValue({
      id: CONVERSATION_ID,
      contact_id: CONTACT_ID,
    }),
  } as unknown as ConversationsService;

  const contacts = {
    getById: vi.fn().mockResolvedValue({
      id: CONTACT_ID,
      phone: '+5551999990000',
    }),
  } as unknown as ContactsService;

  const evolution: EvolutionClient = {
    sendText: vi.fn().mockResolvedValue({ externalId: 'WA-1' }),
    ...overrides.evolution,
  };

  return { repo, conversations, contacts, evolution };
}

describe('MessagesService.sendText', () => {
  it('envia pela Evolution e grava como outbound com autoria do agente', async () => {
    const deps = makeSendDeps();
    const service = createMessagesService(deps);

    const result = await service.sendText({
      conversationId: CONVERSATION_ID,
      text: 'bom dia',
      sentBy: AGENT_ID,
    });

    expect(deps.evolution.sendText).toHaveBeenCalledWith({
      phone: '+5551999990000',
      text: 'bom dia',
    });
    expect(deps.repo.insertOutbound).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: CONVERSATION_ID,
        external_id: 'WA-1',
        content: 'bom dia',
        sent_by: AGENT_ID,
        from_bot: false,
        kind: 'text',
      }),
    );
    expect(result.id).toBe('sent');
  });

  it('NÃO persiste quando a Evolution falha — nada de mensagem fantasma', async () => {
    const deps = makeSendDeps({
      evolution: {
        sendText: vi.fn().mockRejectedValue(
          new AppError('Evolution API recusou o envio', {
            statusCode: 502,
            code: 'evolution_send_failed',
          }),
        ),
      },
    });
    const service = createMessagesService(deps);

    await expect(
      service.sendText({
        conversationId: CONVERSATION_ID,
        text: 'bom dia',
        sentBy: AGENT_ID,
      }),
    ).rejects.toMatchObject({ statusCode: 502 });

    expect(deps.repo.insertOutbound).not.toHaveBeenCalled();
  });

  it('propaga 404 de conversa inexistente sem chamar a Evolution', async () => {
    const deps = makeSendDeps();
    vi.mocked(deps.conversations.getById).mockRejectedValue(
      new AppError('Conversa não encontrada', {
        statusCode: 404,
        code: 'conversation_not_found',
      }),
    );
    const service = createMessagesService(deps);

    await expect(
      service.sendText({
        conversationId: CONVERSATION_ID,
        text: 'oi',
        sentBy: AGENT_ID,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(deps.evolution.sendText).not.toHaveBeenCalled();
    expect(deps.repo.insertOutbound).not.toHaveBeenCalled();
  });

  it('grava external_id null quando a Evolution não devolve o id', async () => {
    const deps = makeSendDeps({
      evolution: { sendText: vi.fn().mockResolvedValue({ externalId: null }) },
    });
    const service = createMessagesService(deps);

    await service.sendText({
      conversationId: CONVERSATION_ID,
      text: 'oi',
      sentBy: AGENT_ID,
    });

    expect(deps.repo.insertOutbound).toHaveBeenCalledWith(
      expect.objectContaining({ external_id: null }),
    );
  });

  it('marca from_bot quando o envio parte da IA', async () => {
    const deps = makeSendDeps();
    const service = createMessagesService(deps);

    await service.sendText({
      conversationId: CONVERSATION_ID,
      text: 'resposta automática',
      sentBy: null,
      fromBot: true,
    });

    expect(deps.repo.insertOutbound).toHaveBeenCalledWith(
      expect.objectContaining({ from_bot: true, sent_by: null }),
    );
  });
});
