import { z } from 'zod';
import type { MessageKind } from '@/modules/messages/messages.types';

// ---------------------------------------------------------------------
// Schemas — Evolution API v1.7+ webhook envelope
//
// A Evolution emite vários eventos (messages.upsert, presence.update,
// connection.update, etc.). Validamos o envelope geral e detalhamos
// `messages.upsert` (o único que ingerimos por enquanto).
// ---------------------------------------------------------------------

// Subseções de `data.message` — só anotamos os campos que extraímos.
// `passthrough()` mantém os outros para não falhar quando a Evolution
// adicionar campos novos.
const imageMessage = z
  .object({ url: z.string().optional(), caption: z.string().optional() })
  .passthrough();
const mediaWithUrl = z
  .object({ url: z.string().optional() })
  .passthrough();

const evolutionMessageBody = z
  .object({
    conversation: z.string().optional(),
    extendedTextMessage: z
      .object({ text: z.string().optional() })
      .passthrough()
      .optional(),
    imageMessage: imageMessage.optional(),
    audioMessage: mediaWithUrl.optional(),
    videoMessage: imageMessage.optional(),
    documentMessage: imageMessage.optional(),
    stickerMessage: mediaWithUrl.optional(),
    locationMessage: z.unknown().optional(),
  })
  .passthrough();

export const evolutionMessageDataSchema = z
  .object({
    key: z
      .object({
        remoteJid: z.string().min(1),
        fromMe: z.boolean().default(false),
        id: z.string().min(1).optional(),
      })
      .passthrough(),
    pushName: z.string().optional(),
    messageTimestamp: z.union([z.number(), z.string()]).optional(),
    messageType: z.string().optional(),
    message: evolutionMessageBody.optional(),
  })
  .passthrough();

export const evolutionWebhookEnvelopeSchema = z
  .object({
    event: z.string().min(1),
    instance: z.string().optional(),
    data: z.unknown(),
  })
  .passthrough();
export type EvolutionWebhookEnvelope = z.infer<
  typeof evolutionWebhookEnvelopeSchema
>;

// ---------------------------------------------------------------------
// Resultado da extração — null quando o evento não é processável
// (grupo, fromMe, evento que não é messages.upsert, etc.)
// ---------------------------------------------------------------------
export interface ExtractedInboundMessage {
  phone: string;
  pushName: string | null;
  externalId: string | null;
  kind: MessageKind;
  content: string | null;
  mediaUrl: string | null;
  sentAt: string;
}
