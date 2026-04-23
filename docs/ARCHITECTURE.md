# Arquitetura — AliançaCRM

## Princípio central: componentização

Inspirado na metodologia do vídeo de referência: **dividir o código em pequenas partes garante segurança e escalabilidade**. Cada unidade tem responsabilidade única e pode ser testada/substituída isoladamente.

## Diagrama de alto nível

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE WHATSAPP                      │
└────────────────────────┬────────────────────────────────────┘
                         │ (mensagens)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              EVOLUTION API (evo.centroautoalianca)           │
│                   ─ já rodando no VPS ─                      │
└─────────────┬───────────────────────────────────┬───────────┘
              │ webhook                           │ send-message
              ▼                                   ▲
┌─────────────────────────────────────────────────┴───────────┐
│                   BACKEND (Node + Express)                   │
│  modules/chat   modules/leads   modules/followup   modules/ai│
└──────┬──────────────────┬────────────────────────┬──────────┘
       │ realtime         │ REST                   │ prompt
       ▼                  ▼                        ▼
┌──────────────┐  ┌──────────────┐       ┌──────────────────┐
│   SUPABASE   │  │  FRONTEND    │       │   CLAUDE API     │
│  (Postgres)  │◄─┤  React+Vite  │       │  (sonnet-4-5)    │
└──────────────┘  └──────────────┘       └──────────────────┘
       ▲
       │ scheduler
┌──────┴──────────────────────────────────────────────────────┐
│              N8N (n8n.centroautoalianca)                     │
│        - Roda a cada hora, identifica leads em risco         │
│        - Dispara endpoint /ai/analyze-conversation           │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo: mensagem recebida no WhatsApp

1. Cliente envia mensagem → Evolution API
2. Evolution API dispara webhook → `POST /webhooks/evolution`
3. Backend valida assinatura, identifica contato (ou cria), cria mensagem
4. Insert no Supabase `messages` → Supabase Realtime publica evento
5. Frontend (já conectado via Realtime) recebe evento → atualiza ChatList e ChatWindow
6. Se conversa não tem agente atribuído E está fora do horário comercial → bot IA responde (opcional)

## Fluxo: mensagem enviada pelo agente

1. Agente digita no `MessageInput` → `POST /conversations/:id/messages`
2. Backend valida, persiste no Supabase, chama Evolution API
3. Evolution entrega no WhatsApp
4. Supabase Realtime propaga a nova mensagem para outros agentes abertos na mesma conversa

## Fluxo: follow-up automático

1. N8N roda cron `0 * * * *` (de hora em hora)
2. Query Supabase: conversas com última mensagem do cliente > 24h atrás, sem resposta do agente, não finalizadas
3. Para cada uma, N8N chama `POST /ai/analyze-conversation` com o histórico
4. Claude API retorna `{priority, reason, message}`
5. Backend persiste em `followups` com `status = 'pending'`
6. Frontend mostra na tela de Follow-up em tempo real

## Camadas do frontend

```
┌────────────────────────────────────────┐
│  pages/      ← rotas, orquestração     │
├────────────────────────────────────────┤
│  components/ ← UI pura, recebem props  │
├────────────────────────────────────────┤
│  hooks/      ← useChat, useLeads, etc. │
├────────────────────────────────────────┤
│  store/      ← Zustand (estado global) │
├────────────────────────────────────────┤
│  services/   ← api.ts, supabase.ts     │
└────────────────────────────────────────┘
```

Regra de ouro: **componente nunca chama `services/` direto**. Sempre via `hooks/`.

## Camadas do backend

Cada módulo em `modules/<nome>/` contém:

```
modules/chat/
├── chat.routes.ts       ← define endpoints, chama controller
├── chat.controller.ts   ← valida input (Zod), chama service
├── chat.service.ts      ← lógica de negócio, chama repository
├── chat.repository.ts   ← queries Supabase
├── chat.types.ts        ← tipos e schemas Zod
└── chat.test.ts         ← testes
```

Sem pular camadas. Controller nunca fala com Supabase direto.

## Realtime: Supabase vs WebSocket próprio

**Decisão:** usar Supabase Realtime. Motivos:
- Já vem com o banco
- Row-level security integrada (agentes só veem suas conversas se quiser)
- Sem infra adicional
- Backend não precisa empurrar eventos — inserts no banco bastam

## Autenticação

- Supabase Auth com email/senha (inicialmente)
- JWT do Supabase usado no backend (validação via `SUPABASE_JWT_SECRET`)
- Roles via tabela `user_roles` (admin, agente)
- RLS (Row Level Security) no Supabase para garantir isolamento

## Estratégia de testes

- **Unit:** lógica de classificação de leads, cálculo de métricas, prompts de IA
- **Integration:** endpoints do backend com banco em memória ou container de teste
- **E2E:** Playwright nos fluxos críticos (login, enviar mensagem, mover card no Kanban)

Cobertura alvo: 60% no início, 80% nas fases finais.

## Por que NÃO Next.js

Escolha consciente de React + Vite puro:
- SPA é suficiente (CRM interno, não precisa SEO)
- Build mais rápido
- Menos "magia", mais controle
- Facilita debug para um solo dev + IA

## Por que Zustand e não Redux

- Menos boilerplate
- Tipagem natural com TS
- Slices por módulo ficam organizadas
- Tamanho: ~1KB vs ~20KB do Redux+toolkit
