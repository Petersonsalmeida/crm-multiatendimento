# AliançaCRM — Contexto do Projeto

> Este arquivo é lido automaticamente pelo Claude Code em toda sessão. Mantenha-o enxuto e atualizado.

## O que estamos construindo

CRM de multiatendimento integrado ao WhatsApp para o **Centro Automotivo Aliança** (Porto Alegre). Combina gestão de leads, funil Kanban, atendimento ao vivo via WhatsApp e follow-up com IA.

## Stack técnica

- **Frontend:** React 18 + Vite + TailwindCSS
- **Backend:** Node.js + Express + TypeScript
- **Banco de dados:** Supabase (Postgres + Realtime + Auth)
- **WhatsApp:** Evolution API v1.7.2 (já rodando no VPS)
- **Automação:** N8N (já rodando no VPS) — webhooks, follow-up scheduler
- **IA:** Claude API (claude-sonnet-4-5) para sugestões de resposta e análise de conversas
- **Deploy:** Hostinger KVM2 VPS, Docker Compose, Nginx + Certbot
- **Domínio:** centroautoalianca.com.br

## Infraestrutura existente (já no VPS)

Não recriar — **reutilizar**:
- N8N em `n8n.centroautoalianca.com.br`
- Evolution API em `evo.centroautoalianca.com.br`
- PostgreSQL compartilhado com N8N
- Nginx reverse proxy + Certbot SSL
- Uptime Kuma para monitoramento

## Princípios de arquitetura (NÃO NEGOCIÁVEIS)

1. **Componentização radical.** Cada componente React faz UMA coisa. Arquivo > 200 linhas = refatorar.
2. **Separação rigorosa** entre camadas:
   - `components/` — UI pura, sem lógica de negócio
   - `hooks/` — lógica reutilizável e fetch
   - `services/` — chamadas à API
   - `store/` — estado global (Zustand)
   - `types/` — tipos TypeScript compartilhados
3. **Backend por domínio, não por tipo.** Estrutura: `modules/chat/`, `modules/leads/`, `modules/followup/` — cada módulo tem seu controller + service + routes + types.
4. **Sem lógica de negócio em componentes.** UI só renderiza e dispara eventos.
5. **TypeScript estrito.** `strict: true`, sem `any` sem justificativa em comentário.
6. **Testes para lógica crítica.** Funil de leads, cálculo de métricas, classificação de leads pela IA.

## Estrutura de pastas

```
alianca-crm/
├── CLAUDE.md                    ← este arquivo
├── docs/
│   ├── ARCHITECTURE.md          ← decisões arquiteturais
│   ├── ROADMAP.md               ← fases e entregas
│   └── API.md                   ← endpoints documentados
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/            ← ChatList, ChatWindow, MessageBubble
│   │   │   ├── kanban/          ← KanbanBoard, KanbanColumn, DealCard
│   │   │   ├── contacts/        ← ContactTable, ContactRow, ContactForm
│   │   │   ├── dashboard/       ← MetricCard, FunnelChart, BarChart
│   │   │   ├── followup/        ← FollowupCard, AISuggestion
│   │   │   └── shared/          ← Button, Modal, Badge, Avatar
│   │   ├── hooks/
│   │   ├── services/            ← api.ts, supabase.ts, realtime.ts
│   │   ├── store/               ← Zustand slices por módulo
│   │   ├── types/
│   │   └── pages/
│   └── CLAUDE.md                ← regras específicas do frontend
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── chat/            ← recebe/envia via Evolution API
│   │   │   ├── contacts/
│   │   │   ├── leads/           ← Kanban e funil
│   │   │   ├── followup/        ← integração com N8N scheduler
│   │   │   ├── ai/              ← wrapper do Claude API
│   │   │   └── dashboard/
│   │   ├── shared/              ← middleware, errors, logger
│   │   └── server.ts
│   └── CLAUDE.md
├── supabase/
│   ├── migrations/              ← SQL versionado
│   └── seed.sql
└── docker-compose.yml
```

## Convenções de código

- **Nomes de arquivo:** PascalCase para componentes (`ChatList.tsx`), camelCase para hooks/services (`useChat.ts`, `chatService.ts`).
- **Imports:** sempre absolutos a partir de `src/` (configurar `@/` no vite/tsconfig).
- **Commits:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`).
- **Branches:** `main` (produção), `dev` (integração), `feat/nome-feature`.

## Roadmap (ver docs/ROADMAP.md para detalhes)

- **Fase 1 — Fundação** (1 semana): setup, auth, schema, Evolution API webhook
- **Fase 2 — Chat/Multiatendimento** (1 semana): receber/enviar mensagens, lista de conversas, atribuição
- **Fase 3 — Contatos e Kanban** (1 semana): CRUD, drag-and-drop, funil
- **Fase 4 — Dashboard** (3 dias): métricas, gráficos, insights
- **Fase 5 — Follow-up IA** (1 semana): análise de conversas, sugestões, scheduler no N8N
- **Fase 6 — Polimento e Deploy** (3 dias): testes, perf, deploy em produção

## Contexto do negócio

- **Proprietário:** Peterson (sócio do padrasto)
- **Operação:** pintura automotiva e funilaria em Porto Alegre
- **Canais principais:** WhatsApp (dominante), Instagram DM (futuro), web chat (futuro)
- **Ticket médio:** R$ 1.500–R$ 3.000 (pessoa física), até R$ 22.000 (frotas)

## Como o Claude Code deve trabalhar aqui

1. **Antes de codar**, sempre ler o CLAUDE.md do módulo específico (se existir).
2. **Perguntar antes de assumir.** Se não souber qual tabela usar, qual endpoint chamar, peça.
3. **Componentes pequenos, arquivos pequenos.** Se um arquivo estiver passando de 200 linhas, propor refatoração.
4. **Commits atômicos.** Uma feature = vários commits pequenos, não um commit gigante.
5. **Nunca mockar dados** sem avisar explicitamente. Se o endpoint não existe, criar uma issue ou TODO visível.
6. **Sempre atualizar docs.** Mudou schema? Atualiza `supabase/migrations/`. Mudou endpoint? Atualiza `docs/API.md`.

## Credenciais e variáveis de ambiente

Nunca commitar `.env`. Usar `.env.example` com placeholders. Segredos ficam apenas:
- No VPS (via Docker secrets ou env file com 600)
- No gerenciador de senhas do Peterson

Variáveis necessárias (ver `.env.example` quando criado):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`
- `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`
- `ANTHROPIC_API_KEY`
- `N8N_WEBHOOK_URL`
- `JWT_SECRET`
