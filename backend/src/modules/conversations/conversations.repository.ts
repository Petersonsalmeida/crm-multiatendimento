import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/shared/supabase';
import type {
  Channel,
  ConversationRow,
  ListConversationsQuery,
} from '@/modules/conversations/conversations.types';
import { openStatusValues } from '@/modules/conversations/conversations.types';

const TABLE = 'conversations';

export interface ConversationsRepository {
  list(
    query: ListConversationsQuery,
  ): Promise<{ items: ConversationRow[]; total: number }>;
  findById(id: string): Promise<ConversationRow | null>;
  findOpenForContact(
    contactId: string,
    channel: Channel,
  ): Promise<ConversationRow | null>;
  create(input: {
    contact_id: string;
    channel: Channel;
  }): Promise<ConversationRow>;
}

export function createConversationsRepository(
  client: SupabaseClient = getSupabaseAdmin(),
): ConversationsRepository {
  return {
    async list(query) {
      const from = (query.page - 1) * query.pageSize;
      const to = from + query.pageSize - 1;

      let q = client
        .from(TABLE)
        .select('*', { count: 'exact' })
        // Mais recente primeiro — fallback pra created_at quando ainda não
        // chegou mensagem (last_msg_at é null nesse caso).
        .order('last_msg_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (query.status) q = q.eq('status', query.status);
      if (query.channel) q = q.eq('channel', query.channel);
      if (query.contactId) q = q.eq('contact_id', query.contactId);

      const { data, error, count } = await q;
      if (error) throw error;
      return { items: (data as ConversationRow[]) ?? [], total: count ?? 0 };
    },

    async findById(id) {
      const { data, error } = await client
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data as ConversationRow | null) ?? null;
    },

    async findOpenForContact(contactId, channel) {
      const { data, error } = await client
        .from(TABLE)
        .select('*')
        .eq('contact_id', contactId)
        .eq('channel', channel)
        .in('status', openStatusValues)
        .order('last_msg_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as ConversationRow | null) ?? null;
    },

    async create(input) {
      const { data, error } = await client
        .from(TABLE)
        .insert(input)
        .select('*')
        .single();
      if (error) throw error;
      return data as ConversationRow;
    },
  };
}
