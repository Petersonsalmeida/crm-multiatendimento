import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/errors';
import {
  createContactsService,
  normalizePhone,
  normalizeTags,
} from '@/modules/contacts/contacts.service';
import type { ContactsRepository } from '@/modules/contacts/contacts.repository';
import type { ContactRow } from '@/modules/contacts/contacts.types';

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------
function makeContact(partial: Partial<ContactRow> = {}): ContactRow {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'João',
    phone: '+5551999990000',
    email: null,
    company: null,
    status: 'novo',
    tags: [],
    notes: null,
    source: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...partial,
  };
}

function makeRepoMock(): ContactsRepository {
  return {
    list: vi.fn(),
    findById: vi.fn(),
    findByPhone: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
}

// ---------------------------------------------------------------------
// Normalização — funções puras
// ---------------------------------------------------------------------
describe('normalizePhone', () => {
  it('remove espaços, parênteses e traços', () => {
    expect(normalizePhone('(51) 99999-0000')).toBe('51999990000');
  });

  it('preserva o prefixo +', () => {
    expect(normalizePhone('+55 (51) 99999-0000')).toBe('+5551999990000');
  });

  it('não adiciona + se não havia', () => {
    expect(normalizePhone('51 99999 0000')).toBe('51999990000');
  });

  it('lança AppError quando não sobra dígito nenhum', () => {
    expect(() => normalizePhone('(-)')).toThrow(AppError);
  });
});

describe('normalizeTags', () => {
  it('retorna array vazio quando undefined', () => {
    expect(normalizeTags(undefined)).toEqual([]);
  });

  it('trim + lowercase + dedupe preservando ordem', () => {
    expect(normalizeTags(['  VIP ', 'vip', 'Frota', 'frota ', 'novo'])).toEqual([
      'vip',
      'frota',
      'novo',
    ]);
  });

  it('ignora strings vazias depois do trim', () => {
    expect(normalizeTags(['  ', 'ok'])).toEqual(['ok']);
  });
});

// ---------------------------------------------------------------------
// Service — orquestração
// ---------------------------------------------------------------------
describe('ContactsService.create', () => {
  it('normaliza telefone e cria quando não há duplicado', async () => {
    const repo = makeRepoMock();
    vi.mocked(repo.findByPhone).mockResolvedValue(null);
    vi.mocked(repo.create).mockImplementation(async (input) =>
      makeContact({ ...input, id: 'abc' }),
    );

    const service = createContactsService(repo);
    const created = await service.create({
      name: 'Maria',
      phone: '(51) 99999-1111',
    });

    expect(created.phone).toBe('51999991111');
    expect(repo.findByPhone).toHaveBeenCalledWith('51999991111');
    expect(repo.create).toHaveBeenCalledOnce();
  });

  it('lança 409 quando telefone já existe', async () => {
    const repo = makeRepoMock();
    vi.mocked(repo.findByPhone).mockResolvedValue(makeContact({ id: 'dup' }));

    const service = createContactsService(repo);

    await expect(
      service.create({ name: 'Maria', phone: '+5551999990000' }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'contact_phone_conflict',
    });
    expect(repo.create).not.toHaveBeenCalled();
  });
});

describe('ContactsService.update', () => {
  it('lança 404 quando o id não existe', async () => {
    const repo = makeRepoMock();
    vi.mocked(repo.findById).mockResolvedValue(null);

    const service = createContactsService(repo);

    await expect(
      service.update('22222222-2222-2222-2222-222222222222', { name: 'X' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('permite manter o mesmo telefone (não conflita consigo)', async () => {
    const id = '33333333-3333-3333-3333-333333333333';
    const repo = makeRepoMock();
    vi.mocked(repo.findById).mockResolvedValue(makeContact({ id }));
    vi.mocked(repo.findByPhone).mockResolvedValue(makeContact({ id }));
    vi.mocked(repo.update).mockImplementation(async (_id, patch) =>
      makeContact({ id, ...patch }),
    );

    const service = createContactsService(repo);
    const result = await service.update(id, { phone: '(51) 99999-0000' });

    expect(result.phone).toBe('51999990000');
  });

  it('lança 409 quando o telefone já está em outro contato', async () => {
    const id = '33333333-3333-3333-3333-333333333333';
    const other = '44444444-4444-4444-4444-444444444444';
    const repo = makeRepoMock();
    vi.mocked(repo.findById).mockResolvedValue(makeContact({ id }));
    vi.mocked(repo.findByPhone).mockResolvedValue(makeContact({ id: other }));

    const service = createContactsService(repo);

    await expect(
      service.update(id, { phone: '+5551988887777' }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'contact_phone_conflict',
    });
    expect(repo.update).not.toHaveBeenCalled();
  });
});

describe('ContactsService.remove', () => {
  it('lança 404 quando o repo reporta 0 linhas', async () => {
    const repo = makeRepoMock();
    vi.mocked(repo.remove).mockResolvedValue(false);

    const service = createContactsService(repo);

    await expect(
      service.remove('55555555-5555-5555-5555-555555555555'),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
