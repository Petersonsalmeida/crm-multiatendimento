// Carrega antes dos test files. Popula as variáveis exigidas por `@/env`
// com valores dummy, evitando que o boot dispare `process.exit(1)` ao
// carregar arquivos da app indiretamente em testes unitários.

process.env.NODE_ENV ??= 'test';
process.env.SUPABASE_URL ??= 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY ??= 'test-service-key-1234567890';
process.env.SUPABASE_JWT_SECRET ??= 'test-jwt-supabase-secret-1234567890';
process.env.JWT_SECRET ??= 'test-jwt-app-secret-1234567890';
process.env.LOG_LEVEL ??= 'silent';
