import { cn } from '@/lib/cn';
import type { Conversation } from '@/types/api';

export interface ChatListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  error?: string | null;
  search: string;
  onSearchChange: (value: string) => void;
}

const statusLabels: Record<Conversation['status'], string> = {
  aberta: 'Aberta',
  aguardando_cliente: 'Aguardando',
  pausada: 'Pausada',
  finalizada: 'Finalizada',
};

function formatWhen(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const isToday = new Date().toDateString() === date.toDateString();
  return isToday
    ? date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function ChatList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
  error,
  search,
  onSearchChange,
}: ChatListProps) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-border-subtle bg-bg-surface sm:w-80">
      <div className="border-b border-border-subtle p-3">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nome ou telefone"
          aria-label="Buscar conversas"
          className="h-9 w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 text-sm text-text-primary placeholder:text-text-subtle"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <p className="p-4 text-sm text-text-muted">Carregando conversas…</p>
        )}
        {error && <p className="p-4 text-sm text-danger">{error}</p>}
        {!isLoading && !error && conversations.length === 0 && (
          <p className="p-4 text-sm text-text-muted">
            Nenhuma conversa ainda. Elas aparecem aqui quando um cliente manda
            mensagem no WhatsApp.
          </p>
        )}

        <ul>
          {conversations.map((conversation) => {
            const isSelected = conversation.id === selectedId;
            const name =
              conversation.contact?.name ??
              conversation.contact?.phone ??
              'Contato desconhecido';

            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  aria-current={isSelected || undefined}
                  className={cn(
                    'flex w-full flex-col gap-1 border-b border-border-subtle px-4 py-3 text-left transition-colors',
                    isSelected ? 'bg-bg-hover' : 'hover:bg-bg-elevated',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-text-primary">
                      {name}
                    </span>
                    <span className="shrink-0 text-[11px] text-text-muted">
                      {formatWhen(conversation.last_msg_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs text-text-muted">
                      {conversation.contact?.phone ?? ''}
                    </span>
                    <span className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-text-subtle ring-1 ring-border-subtle">
                      {statusLabels[conversation.status]}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
