import { useCallback, useEffect, useState } from 'react';
import { listConversations } from '@/services/api';
import { supabase } from '@/services/supabase';
import type { Conversation } from '@/types/api';

export interface UseConversationsResult {
  data: Conversation[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useConversations(): UseConversationsResult {
  const [data, setData] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    let active = true;
    setIsLoading(true);
    listConversations({ pageSize: 50 })
      .then((result) => {
        if (!active) return;
        setData(result.items);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => refetch(), [refetch]);

  // Uma mensagem nova muda last_msg_at e reordena a lista; um contato
  // novo cria uma conversa. Recarregamos a lista em vez de aplicar o
  // patch localmente porque o payload do Realtime não traz o contato
  // embutido, que a lista precisa exibir.
  useEffect(() => {
    const channel = supabase
      .channel('conversations-list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => refetch(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
