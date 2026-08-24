import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { MessageInput } from '@/components/chat/MessageInput';
import { Button } from '@/components/shared/Button';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';

export default function ChatPage() {
  const { user, signOut } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const conversations = useConversations();
  const messages = useMessages(selectedId);

  // Filtro local: a lista já vem limitada a 50 conversas, então buscar
  // no cliente evita uma ida ao servidor a cada tecla.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return conversations.data;
    return conversations.data.filter((conversation) => {
      const name = conversation.contact?.name?.toLowerCase() ?? '';
      const phone = conversation.contact?.phone ?? '';
      return name.includes(term) || phone.includes(term);
    });
  }, [conversations.data, search]);

  const selected =
    conversations.data.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex h-screen flex-col bg-bg-base text-text-primary">
      <header className="flex items-center justify-between border-b border-border-subtle bg-bg-surface px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-whatsapp-primary/20 ring-1 ring-whatsapp-primary/40" />
          <h1 className="text-sm font-semibold tracking-tight">AliançaCRM</h1>
          <Link
            to="/"
            className="ml-2 text-xs text-text-muted underline-offset-2 hover:underline"
          >
            Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-text-muted sm:inline">
            {user?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sair
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <ChatList
          conversations={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          isLoading={conversations.isLoading}
          error={conversations.error}
          search={search}
          onSearchChange={setSearch}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          <ChatWindow
            conversation={selected}
            messages={messages.data}
            isLoading={messages.isLoading}
            error={messages.error}
          />
          {selected && (
            <MessageInput
              onSend={(text) => void messages.send(text)}
              isSending={messages.isSending}
              error={messages.sendError}
              disabled={selected.status === 'finalizada'}
            />
          )}
        </main>
      </div>
    </div>
  );
}
