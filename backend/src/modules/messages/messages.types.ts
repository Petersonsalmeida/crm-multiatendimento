import { z } from 'zod';

// ---------------------------------------------------------------------
// Enums — espelham public.message_direction + public.message_kind
// ---------------------------------------------------------------------
export const messageDirectionValues = ['inbound', 'outbound'] as const;
export const messageDirectionSchema = z.enum(messageDirectionValues);
export type MessageDirection = z.infer<typeof messageDirectionSchema>;

export const messageKindValues = [
  'text',
  'image',
  'audio',
  'video',
  'document',
  'sticker',
  'location',
  'system',
] as const;
export const messageKindSchema = z.enum(messageKindValues);
export type MessageKind = z.infer<typeof messageKindSchema>;

// ---------------------------------------------------------------------
// Row — formato da tabela public.messages
// ---------------------------------------------------------------------
export interface MessageRow {
  id: string;
  conversation_id: string;
  external_id: string | null;
  direction: MessageDirection;
  kind: MessageKind;
  content: string | null;
  media_url: string | null;
  from_bot: boolean;
  sent_by: string | null;
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
}

// ---------------------------------------------------------------------
// Inputs internos (não vêm do controller — vêm do webhook ou do service de envio)
// ---------------------------------------------------------------------
export interface PersistInboundInput {
  conversationId: string;
  externalId: string | null;
  kind: MessageKind;
  content: string | null;
  mediaUrl?: string | null;
  sentAt?: string;
}

// ---------------------------------------------------------------------
// Listagem — query params de GET /conversations/:id/messages
// ---------------------------------------------------------------------
export const listMessagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;

// ---------------------------------------------------------------------
// Respostas
// ---------------------------------------------------------------------
export interface PaginatedMessages {
  items: MessageRow[];
  page: number;
  pageSize: number;
  total: number;
}
