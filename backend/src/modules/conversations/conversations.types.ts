import { z } from 'zod';

// ---------------------------------------------------------------------
// Enums — espelham public.channel + public.conversation_status
// ---------------------------------------------------------------------
export const channelValues = ['whatsapp', 'instagram', 'webchat'] as const;
export const channelSchema = z.enum(channelValues);
export type Channel = z.infer<typeof channelSchema>;

export const conversationStatusValues = [
  'aberta',
  'aguardando_cliente',
  'pausada',
  'finalizada',
] as const;
export const conversationStatusSchema = z.enum(conversationStatusValues);
export type ConversationStatus = z.infer<typeof conversationStatusSchema>;

// ---------------------------------------------------------------------
// Row — formato da tabela public.conversations
// ---------------------------------------------------------------------
export interface ConversationRow {
  id: string;
  contact_id: string;
  channel: Channel;
  assigned_to: string | null;
  status: ConversationStatus;
  last_msg_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Dados do contato embutidos na conversa. A lista de conversas do chat
 * precisa exibir nome e telefone; sem o embed do PostgREST o frontend
 * faria uma request por linha (N+1) só para montar a lateral.
 */
export interface ContactSummary {
  id: string;
  name: string;
  phone: string;
}

export interface ConversationWithContact extends ConversationRow {
  contact: ContactSummary | null;
}

// ---------------------------------------------------------------------
// Listagem — query params de GET /conversations
// ---------------------------------------------------------------------
export const listConversationsQuerySchema = z.object({
  status: conversationStatusSchema.optional(),
  channel: channelSchema.optional(),
  contactId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;

// ---------------------------------------------------------------------
// IdParam — :id de rotas /conversations/:id/...
// ---------------------------------------------------------------------
export const conversationIdParamSchema = z.object({
  id: z.string().uuid('ID de conversa inválido'),
});
export type ConversationIdParam = z.infer<typeof conversationIdParamSchema>;

// ---------------------------------------------------------------------
// Respostas
// ---------------------------------------------------------------------
export interface PaginatedConversations {
  items: ConversationWithContact[];
  page: number;
  pageSize: number;
  total: number;
}

// `Open` = qualquer status que não seja `finalizada`. Usado no
// `ensureOpenForContact` pra decidir se reaproveita ou cria nova conversa.
export const openStatusValues: ConversationStatus[] = [
  'aberta',
  'aguardando_cliente',
  'pausada',
];
