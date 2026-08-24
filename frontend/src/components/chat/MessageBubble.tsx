import { cn } from '@/lib/cn';
import type { Message } from '@/types/api';

export interface MessageBubbleProps {
  message: Message;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Mídia ainda não é renderizada — mostramos um rótulo do tipo. */
const kindLabels: Record<string, string> = {
  image: '📷 Imagem',
  audio: '🎤 Áudio',
  video: '🎬 Vídeo',
  document: '📎 Documento',
  sticker: '🌟 Figurinha',
  location: '📍 Localização',
  system: 'Evento do sistema',
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound';
  const fallback = kindLabels[message.kind] ?? 'Mensagem';
  const body = message.kind === 'text' ? message.content : fallback;

  return (
    <div
      className={cn('flex w-full', isOutbound ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[75%] rounded-lg px-3 py-2 text-sm',
          isOutbound
            ? 'bg-whatsapp-secondary text-text-primary'
            : 'bg-bg-elevated text-text-primary',
        )}
      >
        {message.from_bot && (
          <span className="mb-1 block text-xs font-medium text-whatsapp-primary">
            Resposta automática
          </span>
        )}
        <p className="whitespace-pre-wrap break-words">
          {body ?? <span className="text-text-muted">{fallback}</span>}
        </p>
        <time
          dateTime={message.sent_at}
          className="mt-1 block text-right text-[11px] text-text-muted"
        >
          {formatTime(message.sent_at)}
        </time>
      </div>
    </div>
  );
}
