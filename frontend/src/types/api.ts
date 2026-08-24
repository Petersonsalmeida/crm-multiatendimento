// Espelham os tipos do backend (backend/src/modules/*/**.types.ts).
// Mantidos à mão porque o backend não publica um pacote de tipos —
// mudou lá, mude aqui.

export type ConversationStatus =
  | 'aberta'
  | 'aguardando_cliente'
  | 'pausada'
  | 'finalizada';

export type Channel = 'whatsapp' | 'instagram' | 'webchat';

export type MessageDirection = 'inbound' | 'outbound';

export type MessageKind =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'sticker'
  | 'location'
  | 'system';

export interface ContactSummary {
  id: string;
  name: string;
  phone: string;
}

export interface Conversation {
  id: string;
  contact_id: string;
  channel: Channel;
  assigned_to: string | null;
  status: ConversationStatus;
  last_msg_at: string | null;
  created_at: string;
  updated_at: string;
  contact: ContactSummary | null;
}

export interface Message {
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

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
