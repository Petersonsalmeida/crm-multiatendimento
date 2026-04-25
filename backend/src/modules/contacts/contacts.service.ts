import { AppError } from '@/shared/errors';
import type { ContactsRepository } from '@/modules/contacts/contacts.repository';
import { createContactsRepository } from '@/modules/contacts/contacts.repository';
import type {
  ContactRow,
  CreateContactInput,
  ListContactsQuery,
  PaginatedContacts,
  UpdateContactInput,
} from '@/modules/contacts/contacts.types';

// ---------------------------------------------------------------------
// Normalizações — exportadas para serem testáveis isoladamente
// ---------------------------------------------------------------------
/**
 * Remove espaços, parênteses e traços; preserva '+' inicial se houver.
 * Não tenta inferir DDI — responsabilidade do cliente mandar formato canônico.
 */
export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 0) {
    throw new AppError('Telefone inválido', {
      statusCode: 400,
      code: 'invalid_phone',
    });
  }
  return hasPlus ? `+${digits}` : digits;
}

export function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim().toLowerCase();
    if (!tag) continue;
    if (seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

function trimOrNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const t = value.trim();
  return t.length === 0 ? null : t;
}

// ---------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------
export interface ContactsService {
  list(query: ListContactsQuery): Promise<PaginatedContacts>;
  getById(id: string): Promise<ContactRow>;
  create(input: CreateContactInput): Promise<ContactRow>;
  update(id: string, patch: UpdateContactInput): Promise<ContactRow>;
  remove(id: string): Promise<void>;
  /**
   * Idempotente: garante existência de um contato pelo telefone.
   * Usado por integrações inbound (webhooks, importação). Se já existe e
   * `fallbackName` foi informado, atualiza o nome quando o atual é genérico.
   */
  ensureByPhone(input: { phone: string; fallbackName?: string }): Promise<ContactRow>;
}

export function createContactsService(
  repo: ContactsRepository = createContactsRepository(),
): ContactsService {
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
        throw new AppError('Contato não encontrado', {
          statusCode: 404,
          code: 'contact_not_found',
        });
      }
      return found;
    },

    async create(input) {
      const phone = normalizePhone(input.phone);
      const existing = await repo.findByPhone(phone);
      if (existing) {
        throw new AppError('Já existe um contato com esse telefone', {
          statusCode: 409,
          code: 'contact_phone_conflict',
          details: { id: existing.id },
        });
      }

      return repo.create({
        ...input,
        phone,
        name: input.name.trim(),
        email: trimOrNull(input.email ?? null),
        company: trimOrNull(input.company ?? null),
        notes: trimOrNull(input.notes ?? null),
        source: trimOrNull(input.source ?? null),
        tags: normalizeTags(input.tags),
      });
    },

    async update(id, patch) {
      // Garante que o contato existe (404 antes de 409 de conflito)
      await this.getById(id);

      const normalized: UpdateContactInput = { ...patch };

      if (patch.phone !== undefined) {
        const phone = normalizePhone(patch.phone);
        const existing = await repo.findByPhone(phone);
        if (existing && existing.id !== id) {
          throw new AppError('Já existe um contato com esse telefone', {
            statusCode: 409,
            code: 'contact_phone_conflict',
            details: { id: existing.id },
          });
        }
        normalized.phone = phone;
      }

      if (patch.name !== undefined) normalized.name = patch.name.trim();
      if (patch.email !== undefined) normalized.email = trimOrNull(patch.email);
      if (patch.company !== undefined) normalized.company = trimOrNull(patch.company);
      if (patch.notes !== undefined) normalized.notes = trimOrNull(patch.notes);
      if (patch.source !== undefined) normalized.source = trimOrNull(patch.source);
      if (patch.tags !== undefined) normalized.tags = normalizeTags(patch.tags);

      const updated = await repo.update(id, normalized);
      if (!updated) {
        // Race: contato foi apagado entre o getById e o update
        throw new AppError('Contato não encontrado', {
          statusCode: 404,
          code: 'contact_not_found',
        });
      }
      return updated;
    },

    async remove(id) {
      const ok = await repo.remove(id);
      if (!ok) {
        throw new AppError('Contato não encontrado', {
          statusCode: 404,
          code: 'contact_not_found',
        });
      }
    },

    async ensureByPhone({ phone, fallbackName }) {
      const normalized = normalizePhone(phone);
      const existing = await repo.findByPhone(normalized);
      if (existing) return existing;

      const name = (fallbackName ?? '').trim() || normalized;
      return repo.create({
        name,
        phone: normalized,
        email: null,
        company: null,
        notes: null,
        source: 'whatsapp',
        tags: [],
      });
    },
  };
}
