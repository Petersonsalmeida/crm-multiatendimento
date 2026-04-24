# Backend — Regras específicas

> Lê antes de editar qualquer arquivo em `backend/`. Complementa — não substitui — o `CLAUDE.md` da raiz.

## Stack confirmada

- Node 20+ ESM (`"type": "module"`)
- Express 4 + TypeScript estrito
- Zod para validação (env + payloads)
- Pino + pino-http para logging estruturado
- Supabase JS SDK (service-role no backend, JWT de usuário nunca)
- Imports absolutos via alias `@/*` → `src/*`

## Padrão de módulo (obrigatório)

Cada domínio mora em `src/modules/<nome>/` com esses arquivos:

```
modules/<nome>/
├── <nome>.routes.ts       ← registra endpoints, chama controller
├── <nome>.controller.ts   ← valida input com Zod, chama service
├── <nome>.service.ts      ← lógica de negócio, chama repository
├── <nome>.repository.ts   ← queries Supabase (sem regra de negócio)
├── <nome>.types.ts        ← tipos + schemas Zod exportados
└── <nome>.test.ts         ← testes
```

**Regra de não-pular-camadas:**
- `routes` → só chama `controller`
- `controller` → só chama `service` e valida payload via Zod
- `service` → lógica de negócio, pode orquestrar múltiplos `repository`
- `repository` → único lugar que fala com Supabase

Controller nunca fala com Supabase direto. Service nunca importa `express`.

## Referência de padrão

[`src/modules/health/`](src/modules/health/) é o exemplo mínimo. Ao criar um novo módulo, copiar essa estrutura e expandir conforme necessário (adicionar service/repository/test quando houver lógica real).

## Validação com Zod

- Todo payload entrando (`req.body`, `req.query`, `req.params` relevantes) passa por `schema.parse()` no controller.
- `ZodError` é pego pelo error handler global e convertido em `400 validation_error` com os issues.
- Schemas ficam em `<nome>.types.ts` e são exportados.

## Erros

- Jogar `AppError` com `statusCode`, `code`, `message` (e `details` opcional).
- Erros de validação: deixar o `ZodError` subir — handler global formata.
- **Nunca** capturar erro e retornar 200 com `{ ok: false }`. Use status HTTP correto.
- Para async handlers, envolver com `asyncHandler` de `@/shared/asyncHandler`.

## Env

- Adicionar campo novo em `env.ts` com schema Zod (required por padrão, `.optional()` explícito se não for).
- Nunca `process.env.X` fora de `env.ts`. Sempre importar `env` de `@/env`.
- Refletir no `.env.example` da raiz.

## Logging

- Usar `logger` de `@/shared/logger` — não `console.*`.
- Sempre passar contexto como primeiro argumento: `logger.info({ userId, action }, 'message')`.
- `pino-http` já injeta `req.log` com trace por request — preferir `req.log` dentro de handlers.

## Supabase

- Único cliente: `getSupabaseAdmin()` de `@/shared/supabase` (service-role key).
- Validação de JWT do frontend acontece em middleware de auth (ainda não criado) usando `SUPABASE_JWT_SECRET`.
- Queries sempre com tipos — depois da Fase 1 vamos gerar types com `supabase gen types typescript`.

## Checklist antes de commitar

- [ ] `npm run typecheck` passa
- [ ] Novo endpoint tem Zod no controller
- [ ] Novo módulo segue o padrão de 6 arquivos (ou justificar ausência)
- [ ] Nenhum `any` sem comentário justificando
- [ ] Nenhum `console.log` — usar `logger`
- [ ] Nenhum import relativo `../../` (usar `@/`)
