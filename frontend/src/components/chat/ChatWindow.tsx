import { useEffect, useRef } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import type { Conversation, Message } from '@/types/api';

export interface ChatWindowProps {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error?: string | null;
}

export function ChatWindow({
  conversation,
  messages,
  isLoading,
  error,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Rola para a última mensagem quando chega algo novo ou troca a
  // conversa — chat abre no fim, não no começo.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, conversation?.id]);

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-sm text-text-muted">
          Escolha uma conversa à esquerda para ver o histórico.
        </p>
      </div>
    );
  }

  const name = conversation.contact?.name ?? 'Contato desconhecido';

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border-subtle bg-bg-surface px-4 py-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-whatsapp-primary/20 ring-1 ring-whatsapp-primary/40" />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium text-text-primary">
            {name}
          </h2>
          <p className="truncate text-xs text-text-muted">
            {conversation.contact?.phone ?? ''}
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto bg-bg-base p-4">
        {isLoading && (
          <p className="text-sm text-text-muted">Carregando mensagens…</p>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
        {!isLoading && !error && messages.length === 0 && (
          <p className="text-sm text-text-muted">
            Nenhuma mensagem nesta conversa ainda.
          </p>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={bottomRef} />
      </div>
    </section>
  );
}
