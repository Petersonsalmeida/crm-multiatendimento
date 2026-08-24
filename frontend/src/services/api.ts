import { getSession } from '@/services/supabase';
import type {
  Conversation,
  ConversationStatus,
  Message,
  Paginated,
} from '@/types/api';

const baseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

/** Erro com o `code` do backend preservado, para a UI decidir a mensagem. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // O backend valida o JWT do Supabase; sem sessão nem vale a chamada.
  const session = await getSession();
  if (!session) {
    throw new ApiError('Sessão expirada', 401, 'auth_missing_token');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${session.access_token}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    // Envelope de erro do backend: { error: { code, message } }.
    const body = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
    } | null;
    throw new ApiError(
      body?.error?.message ?? `Falha na requisição (${response.status})`,
      response.status,
      body?.error?.code ?? 'unknown_error',
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function listConversations(params: {
  status?: ConversationStatus;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<Conversation>> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));

  const qs = search.toString();
  return request<Paginated<Conversation>>(
    `/conversations${qs ? `?${qs}` : ''}`,
  );
}

export function listMessages(
  conversationId: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<Paginated<Message>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));

  const qs = search.toString();
  return request<Paginated<Message>>(
    `/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`,
  );
}

export function sendMessage(
  conversationId: string,
  text: string,
): Promise<Message> {
  return request<Message>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}
