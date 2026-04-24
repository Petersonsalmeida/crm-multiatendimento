import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/shared/supabase';
import type {
  ContactRow,
  CreateContactInput,
  ListContactsQuery,
  UpdateContactInput,
} from '@/modules/contacts/contacts.types';

const TABLE = 'contacts';

export interface ContactsRepository {
  list(query: ListContactsQuery): Promise<{ items: ContactRow[]; total: number }>;
  findById(id: string): Promise<ContactRow | null>;
  findByPhone(phone: string): Promise<ContactRow | null>;
  create(input: CreateContactInput & { phone: string }): Promise<ContactRow>;
  update(id: string, patch: UpdateContactInput): Promise<ContactRow | null>;
  remove(id: string): Promise<boolean>;
}

export function createContactsRepository(
  client: SupabaseClient = getSupabaseAdmin(),
): ContactsRepository {
  return {
    async list(query) {
      const from = (query.page - 1) * query.pageSize;
      const to = from + query.pageSize - 1;

      let q = client
        .from(TABLE)
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (query.status) q = q.eq('status', query.status);
      if (query.tag) q = q.contains('tags', [query.tag]);
      if (query.search) {
        // Busca simples em name, phone ou company
        const term = `%${query.search}%`;
        q = q.or(`name.ilike.${term},phone.ilike.${term},company.ilike.${term}`);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { items: (data as ContactRow[]) ?? [], total: count ?? 0 };
    },

    async findById(id) {
      const { data, error } = await client
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data as ContactRow | null) ?? null;
    },

    async findByPhone(phone) {
      const { data, error } = await client
        .from(TABLE)
        .select('*')
        .eq('phone', phone)
        .maybeSingle();
      if (error) throw error;
      return (data as ContactRow | null) ?? null;
    },

    async create(input) {
      const { data, error } = await client
        .from(TABLE)
        .insert(input)
        .select('*')
        .single();
      if (error) throw error;
      return data as ContactRow;
    },

    async update(id, patch) {
      const { data, error } = await client
        .from(TABLE)
        .update(patch)
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return (data as ContactRow | null) ?? null;
    },

    async remove(id) {
      const { error, count } = await client
        .from(TABLE)
        .delete({ count: 'exact' })
        .eq('id', id);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
  };
}
