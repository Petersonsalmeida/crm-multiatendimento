import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

// Strings vazias em variáveis opcionais devem virar `undefined` para que
// validações como `.url()` não falhem por causa de chaves vazias no `.env`.
const optionalString = () =>
  z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v));
const optionalUrl = () =>
  optionalString().pipe(z.string().url().optional());

// `CORS_ORIGINS` é uma lista separada por vírgula (ex.:
// "https://crm.centroautoalianca.com.br,http://localhost:5173").
export function parseCorsOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin.length > 0);
}

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  CORS_ORIGINS: optionalString(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(10),
  SUPABASE_JWT_SECRET: z.string().min(10),

  EVOLUTION_API_URL: optionalUrl(),
  EVOLUTION_API_KEY: optionalString(),
  EVOLUTION_INSTANCE_NAME: optionalString(),
  // Segredo compartilhado entre Evolution API → este backend.
  // Quando definido, exigimos match no header `apikey` em /webhooks/evolution.
  // Quando vazio (dev), o endpoint aceita qualquer chamada — útil pra testar com curl.
  EVOLUTION_WEBHOOK_SECRET: optionalString(),

  ANTHROPIC_API_KEY: optionalString(),
  CLAUDE_MODEL: z.string().default('claude-sonnet-4-5'),

  N8N_WEBHOOK_URL: optionalUrl(),

  JWT_SECRET: z.string().min(10),
});

// Em produção, configurações "convenientes pra dev" viram erro de boot:
// melhor o processo se recusar a subir do que subir aberto.
export const envSchema = schema.superRefine((value, ctx) => {
  if (value.NODE_ENV !== 'production') return;

  if (!value.EVOLUTION_WEBHOOK_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['EVOLUTION_WEBHOOK_SECRET'],
      message: 'obrigatório em produção (webhook aberto sem ele)',
    });
  }
  if (parseCorsOrigins(value.CORS_ORIGINS).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CORS_ORIGINS'],
      message: 'obrigatório em produção (allowlist de origens do frontend)',
    });
  }
  if (value.JWT_SECRET === 'change-this-in-production') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_SECRET'],
      message: 'troque o valor placeholder do .env.example',
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n❌ Variáveis de ambiente inválidas:\n${details}\n`);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
