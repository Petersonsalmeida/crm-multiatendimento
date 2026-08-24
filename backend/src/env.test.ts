import { describe, expect, it } from 'vitest';
import { envSchema, parseCorsOrigins } from '@/env';

// Base mínima válida para o schema (espelha o setup de testes).
const baseEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_KEY: 'test-service-key-1234567890',
  SUPABASE_JWT_SECRET: 'test-jwt-supabase-secret-1234567890',
  JWT_SECRET: 'test-jwt-app-secret-1234567890',
};

describe('parseCorsOrigins', () => {
  it('separa por vírgula, faz trim e remove barra final', () => {
    expect(
      parseCorsOrigins(' https://crm.example.com/ , http://localhost:5173 '),
    ).toEqual(['https://crm.example.com', 'http://localhost:5173']);
  });

  it('retorna vazio para undefined ou string vazia', () => {
    expect(parseCorsOrigins(undefined)).toEqual([]);
    expect(parseCorsOrigins('')).toEqual([]);
    expect(parseCorsOrigins(' , ')).toEqual([]);
  });
});

describe('envSchema — guardas de produção', () => {
  it('aceita config de dev sem webhook secret nem CORS_ORIGINS', () => {
    const result = envSchema.safeParse({ ...baseEnv, NODE_ENV: 'development' });
    expect(result.success).toBe(true);
  });

  it('em produção exige EVOLUTION_WEBHOOK_SECRET e CORS_ORIGINS', () => {
    const result = envSchema.safeParse({ ...baseEnv, NODE_ENV: 'production' });
    expect(result.success).toBe(false);
    const paths = result.success
      ? []
      : result.error.issues.map((i) => i.path.join('.'));
    expect(paths).toContain('EVOLUTION_WEBHOOK_SECRET');
    expect(paths).toContain('CORS_ORIGINS');
  });

  it('em produção rejeita JWT_SECRET placeholder do .env.example', () => {
    const result = envSchema.safeParse({
      ...baseEnv,
      NODE_ENV: 'production',
      JWT_SECRET: 'change-this-in-production',
      EVOLUTION_WEBHOOK_SECRET: 'super-secret',
      CORS_ORIGINS: 'https://crm.example.com',
    });
    expect(result.success).toBe(false);
    const paths = result.success
      ? []
      : result.error.issues.map((i) => i.path.join('.'));
    expect(paths).toEqual(['JWT_SECRET']);
  });

  it('passa em produção com tudo configurado', () => {
    const result = envSchema.safeParse({
      ...baseEnv,
      NODE_ENV: 'production',
      EVOLUTION_WEBHOOK_SECRET: 'super-secret',
      CORS_ORIGINS: 'https://crm.example.com',
    });
    expect(result.success).toBe(true);
  });
});
