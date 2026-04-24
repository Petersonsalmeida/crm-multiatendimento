import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(10),
  SUPABASE_JWT_SECRET: z.string().min(10),

  EVOLUTION_API_URL: z.string().url().optional(),
  EVOLUTION_API_KEY: z.string().optional(),
  EVOLUTION_INSTANCE_NAME: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  CLAUDE_MODEL: z.string().default('claude-sonnet-4-5'),

  N8N_WEBHOOK_URL: z.string().url().optional(),

  JWT_SECRET: z.string().min(10),
});

const parsed = schema.safeParse(process.env);

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
