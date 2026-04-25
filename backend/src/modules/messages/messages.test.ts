import { describe, expect, it, vi } from 'vitest';
import { createMessagesService } from '@/modules/messages/messages.service';
import type { MessagesRepository } from '@/modules/messages/messages.repository';
import type { MessageRow } from '@/modules/messages/messages.types';

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
