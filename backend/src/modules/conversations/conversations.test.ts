import { describe, expect, it, vi } from 'vitest';
import { createConversationsService } from '@/modules/conversations/conversations.service';
import type { ConversationsRepository } from '@/modules/conversations/conversations.repository';
import type { ConversationRow } from '@/modules/conversations/conversations.types';

function makeConversation(partial: Partial<ConversationRow> = {}): ConversationRow {
  return {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    contact_id: '11111111-1111-1111-1111-111111111111',
    channel: 'whatsapp',
    assigned_to: null,
    status: 'aberta',
    last_msg_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...partial,
  };
}

function makeRepoMock(): ConversationsRepository {
  return {
    list: vi.fn(),
    findById: vi.fn(),
    findOpenForContact: vi.fn(),
    create: vi.fn(),
  };
}

describe('ConversationsService.ensureOpenForContact', () => {
  it('reaproveita conversa aberta existente', async () => {
    const existing = makeConversation({ id: 'existing' });
    const repo = makeRepoMock();
    vi.mocked(repo.findOpenForContact).mockResolvedValue(existing);

    const service = createConversationsService(repo);
    const result = await service.ensureOpenForContact({
      contactId: existing.contact_id,
    });

    expect(result).toBe(existing);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('cria nova conversa quando nenhuma aberta existe', async () => {
    const repo = makeRepoMock();
    vi.mocked(repo.findOpenForContact).mockResolvedValue(null);
    vi.mocked(repo.create).mockImplementation(async (input) =>
      makeConversation({ ...input, id: 'new' }),
    );

    const service = createConversationsService(repo);
    const result = await service.ensureOpenForContact({
      contactId: '22222222-2222-2222-2222-222222222222',
      channel: 'whatsapp',
    });

    expect(result.id).toBe('new');
    expect(repo.create).toHaveBeenCalledWith({
      contact_id: '22222222-2222-2222-2222-222222222222',
      channel: 'whatsapp',
    });
  });

  it('usa whatsapp como canal default', async () => {
    const repo = makeRepoMock();
    vi.mocked(repo.findOpenForContact).mockResolvedValue(null);
    vi.mocked(repo.create).mockImplementation(async (input) =>
      makeConversation(input),
    );

    const service = createConversationsService(repo);
    await service.ensureOpenForContact({
      contactId: '22222222-2222-2222-2222-222222222222',
    });

    expect(repo.findOpenForContact).toHaveBeenCalledWith(
      '22222222-2222-2222-2222-222222222222',
      'whatsapp',
    );
  });
});

describe('ConversationsService.getById', () => {
  it('lança 404 quando não existe', async () => {
    const repo = makeRepoMock();
    vi.mocked(repo.findById).mockResolvedValue(null);

    const service = createConversationsService(repo);
    await expect(
      service.getById('99999999-9999-9999-9999-999999999999'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
