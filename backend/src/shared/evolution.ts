import { env } from '@/env';
import { AppError } from '@/shared/errors';

// Cliente da Evolution API (v1.7.2, a que roda no VPS).
//
// Atenção ao formato do corpo: a v1 aninha o texto em `textMessage`,
// enquanto a v2 achatou para `{ number, text }`. Trocar a versão da
// Evolution exige mudar `buildSendTextBody` junto.

export interface SendTextArgs {
  /** Telefone canônico, com ou sem '+' — a Evolution aceita só dígitos. */
  phone: string;
  text: string;
}

export interface SendTextResult {
  /** ID da mensagem no WhatsApp, usado como `external_id`. */
  externalId: string | null;
}

export interface EvolutionClient {
  sendText(args: SendTextArgs): Promise<SendTextResult>;
}

export function buildSendTextBody(args: SendTextArgs): Record<string, unknown> {
  return {
    // A Evolution rejeita o '+' inicial: espera só dígitos.
    number: args.phone.replace(/\D/g, ''),
    textMessage: { text: args.text },
  };
}

/** Extrai o id da mensagem da resposta, tolerando variações de formato. */
export function extractExternalId(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const key = (payload as { key?: unknown }).key;
  if (typeof key !== 'object' || key === null) return null;
  const id = (key as { id?: unknown }).id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export function createEvolutionClient(): EvolutionClient {
  return {
    async sendText(args) {
      const { EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME } =
        env;

      // Em dev a integração costuma estar desconfigurada — falhar aqui
      // com mensagem clara é melhor que montar uma URL "undefined".
      if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
        throw new AppError('Evolution API não configurada', {
          statusCode: 503,
          code: 'evolution_not_configured',
        });
      }

      const url = `${EVOLUTION_API_URL.replace(/\/+$/, '')}/message/sendText/${EVOLUTION_INSTANCE_NAME}`;

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            apikey: EVOLUTION_API_KEY,
          },
          body: JSON.stringify(buildSendTextBody(args)),
          // Sem timeout o request pendura o handler do Express até o
          // socket morrer, segurando a resposta ao agente.
          signal: AbortSignal.timeout(15_000),
        });
      } catch (cause) {
        throw new AppError('Falha ao contatar a Evolution API', {
          statusCode: 502,
          code: 'evolution_unreachable',
          details: cause instanceof Error ? cause.message : String(cause),
        });
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new AppError('Evolution API recusou o envio', {
          statusCode: 502,
          code: 'evolution_send_failed',
          details: { status: response.status, body: body.slice(0, 500) },
        });
      }

      const payload: unknown = await response.json().catch(() => null);
      return { externalId: extractExternalId(payload) };
    },
  };
}
