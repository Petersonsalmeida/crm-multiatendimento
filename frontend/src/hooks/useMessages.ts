import { useCallback, useEffect, useState } from 'react';
import { listMessages, sendMessage } from '@/services/api';
import { supabase } from '@/services/supabase';
import type { Message } from '@/types/api';

export interface UseMessagesResult {
  data: Message[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  send: (text: string) => Promise<boolean>;
  isSending: boolean;
  sendError: string | null;
}

/** Insere mantendo ordem por sent_at e sem duplicar (id já presente). */
function mergeMessage(list: Message[], incoming: Message): Message[] {
  if (list.some((m) => m.id === incoming.id)) return list;
  const next = [...list, incoming];
  next.sort((a, b) => a.sent_at.localeCompare(b.sent_at));
  return next;
}

export function useMessages(conversationId: string | null): UseMessagesResult {
  const [data, setData] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (!conversationId) {
      setData([]);
      return;
    }
    setIsLoading(true);
    listMessages(conversationId, { pageSize: 200 })
      .then((result) => {
        setData(result.items);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Erro ao carregar');
      })
      .finally(() => setIsLoading(false));
  }, [conversationId]);

  useEffect(() => {
    setSendError(null);
    refetch();
  }, [refetch]);

  // Realtime só desta conversa — o filtro roda no servidor, então não
  // recebemos tráfego das outras conversas abertas por outros agentes.
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setData((prev) => mergeMessage(prev, payload.new as Message));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const send = useCallback(
    async (text: string): Promise<boolean> => {
      if (!conversationId) return false;
      setIsSending(true);
      setSendError(null);
      try {
        const created = await sendMessage(conversationId, text);
        // Não esperamos o Realtime: a própria resposta já traz a
        // mensagem, e o merge por id evita duplicar quando o evento
        // chegar logo depois.
        setData((prev) => mergeMessage(prev, created));
        return true;
      } catch (err: unknown) {
        setSendError(err instanceof Error ? err.message : 'Falha ao enviar');
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId],
  );

  return { data, isLoading, error, refetch, send, isSending, sendError };
}
