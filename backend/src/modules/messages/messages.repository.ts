import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/shared/supabase';
import type {
  ListMessagesQuery,
  MessageKind,
  MessageRow,
} from '@/modules/messages/messages.types';

const TABLE = 'messages';

export interface ListByConversationArgs extends ListMessagesQuery {
  conversationId: string;
}

export interface InsertInboundArgs {
  conversation_id: string;
  external_id: string | null;
  kind: MessageKind;
  content: string | null;
  media_url: string | null;
  sent_at: string;
}

export interface InsertOutboundArgs {
  conversation_id: string;
  external_id: string | null;
  kind: MessageKind;
  content: string | null;
  sent_by: string | null;
  from_bot: boolean;
  sent_at: string;
}

export interface MessagesRepository {
  listByConversation(
    args: ListByConversationArgs,
  ): Promise<{ items: MessageRow[]; total: number }>;
  findByExternalId(externalId: string): Promise<MessageRow | null>;
  insertInbound(args: InsertInboundArgs): Promise<MessageRow>;
  insertOutbound(args: InsertOutboundArgs): Promise<MessageRow>;
}

export function createMessagesRepository(
  client: SupabaseClient = getSupabaseAdmin(),
): MessagesRepository {
  return {
    async listByConversation({ conversationId, page, pageSize }) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await client
        .from(TABLE)
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        // Mais antigas primeiro — UI de chat lê de cima pra baixo.
        .order('sent_at', { ascending: true })
        .range(from, to);
      if (error) throw error;
      return { items: (data as MessageRow[]) ?? [], total: count ?? 0 };
    },

    async findByExternalId(externalId) {
      const { data, error } = await client
        .from(TABLE)
        .select('*')
        .eq('external_id', externalId)
        .maybeSingle();
      if (error) throw error;
      return (data as MessageRow | null) ?? null;
    },

    async insertInbound(args) {
      const { data, error } = await client
        .from(TABLE)
        .insert({ ...args, direction: 'inbound', from_bot: false })
        .select('*')
        .single();
      if (error) throw error;
      return data as MessageRow;
    },

    async insertOutbound(args) {
      const { data, error } = await client
        .from(TABLE)
        .insert({ ...args, direction: 'outbound' })
        .select('*')
        .single();
      if (error) throw error;
      return data as MessageRow;
    },
  };
}
