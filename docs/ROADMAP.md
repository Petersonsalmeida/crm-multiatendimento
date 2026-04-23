# Roadmap — AliançaCRM

Metodologia: **componentização + arquitetura em camadas**. Cada fase entrega valor funcional testável.

---

## Fase 1 — Fundação (1 semana)

**Objetivo:** base técnica rodando localmente + primeiro webhook funcional.

### Entregas

- [ ] Repositório git inicializado (`main`, `dev`, `.gitignore`)
- [ ] Scaffold frontend: Vite + React 18 + TS + Tailwind + Zustand
- [ ] Scaffold backend: Express + TS + Zod + Pino (logger)
- [ ] `docker-compose.yml` para ambiente local (frontend, backend, postgres)
- [ ] Supabase projeto criado + schema inicial:
  - `contacts` (id, name, phone, company, status, tags, created_at)
  - `conversations` (id, contact_id, channel, assigned_to, status, last_msg_at)
  - `messages` (id, conversation_id, direction, content, sent_at, from_bot)
  - `deals` (id, contact_id, title, value, stage, created_at)
  - `followups` (id, contact_id, reason, suggested_text, scheduled_for, status)
  - `users` (agentes + roles)
- [ ] Auth via Supabase (email/senha, roles: admin, agente)
- [ ] Webhook do Evolution API → backend → insere mensagem no Supabase
- [ ] Primeira tela: login + dashboard vazio

### Prompt de partida sugerido para o Claude Code

```
Leia CLAUDE.md. Fase atual: Fase 1 — Fundação.
Começar pelo scaffold do frontend. Criar estrutura de pastas conforme CLAUDE.md,
instalar dependências, configurar Tailwind com o tema dark+verde WhatsApp,
criar o componente shared/Button.tsx como primeiro componente.
```

---

## Fase 2 — Chat / Multiatendimento (1 semana)

**Objetivo:** conversar com clientes via WhatsApp dentro do CRM.

### Entregas

- [ ] `ChatList` — lista lateral de conversas com busca e filtros
- [ ] `ChatWindow` — histórico de mensagens da conversa ativa
- [ ] `MessageBubble` — bolha individual (recebida, enviada, do bot)
- [ ] `MessageInput` — campo de envio com respostas rápidas
- [ ] Realtime via Supabase: nova mensagem aparece sem reload
- [ ] Envio de mensagem: frontend → backend → Evolution API → WhatsApp
- [ ] Atribuição de conversa a agente (transferir, finalizar)
- [ ] Indicador de "bot respondeu" vs "humano respondeu"

### Componentes (um arquivo cada)

```
components/chat/
├── ChatList.tsx          ← container
├── ChatListItem.tsx      ← linha individual
├── ChatFilters.tsx       ← botões de filtro
├── ChatSearch.tsx        ← input de busca
├── ChatWindow.tsx        ← container da direita
├── ChatHeader.tsx        ← header com nome + ações
├── MessageList.tsx       ← scroll de mensagens
├── MessageBubble.tsx     ← uma mensagem
├── MessageInput.tsx      ← área de digitação
└── QuickReplies.tsx      ← respostas rápidas
```

---

## Fase 3 — Contatos e Kanban (1 semana)

**Objetivo:** visualizar e mover leads pelo funil.

### Entregas

- [ ] `ContactTable` com filtros, busca, paginação
- [ ] `ContactForm` (criar/editar) em modal
- [ ] `ContactDetail` — perfil completo com histórico de conversas
- [ ] `KanbanBoard` com 5 colunas padrão (customizáveis)
- [ ] `DealCard` com drag-and-drop (dnd-kit)
- [ ] Atualização de stage persiste no Supabase
- [ ] Vincular negócio a contato e a conversa

---

## Fase 4 — Dashboard (3 dias)

**Objetivo:** métricas em tempo real.

### Entregas

- [ ] `MetricCard` — atendimentos hoje, leads, taxa de resposta, receita
- [ ] `BarChart` — volume por dia da semana (Recharts)
- [ ] `FunnelChart` — conversão por estágio
- [ ] Query Supabase com views agregadas (não calcular no frontend)

---

## Fase 5 — Follow-up com IA (1 semana) ⭐ diferencial

**Objetivo:** IA identifica leads em risco e sugere mensagem personalizada.

### Entregas

- [ ] Workflow N8N: roda a cada 1h, busca conversas sem resposta > X horas
- [ ] Endpoint `POST /ai/analyze-conversation` — recebe conversa, retorna:
  - prioridade (urgente/médio/baixo)
  - motivo do follow-up
  - mensagem sugerida personalizada
- [ ] Tela `Follow-up` lista sugestões pendentes
- [ ] Botão "Enviar via WhatsApp" dispara Evolution API
- [ ] Botões: editar mensagem, adiar 1 dia, descartar
- [ ] Aprendizado: IA considera se sugestões anteriores foram aceitas/rejeitadas

### Prompt do sistema para o Claude API

Separar em `backend/src/modules/ai/prompts/followup.ts`. Template:

```typescript
export const FOLLOWUP_SYSTEM_PROMPT = `Você é um assistente de vendas da
Centro Automotivo Aliança, uma oficina de pintura e funilaria em Porto Alegre.

Dado o histórico da conversa abaixo, avalie:
1. Prioridade do follow-up (urgente/médio/baixo)
2. Motivo pelo qual o lead parou de responder
3. Uma mensagem curta, cordial e em português brasileiro para reativar o contato

Regras:
- Tom amigável mas profissional, como um vendedor experiente
- Máximo 2 frases
- Se o lead recebeu orçamento, mencionar flexibilidade/condição especial
- Se o lead sumiu sem motivo claro, ser casual e perguntar se precisa de algo
- Nunca ser insistente ou usar gatilhos agressivos de urgência falsa

Responda APENAS em JSON válido:
{"priority": "urgente"|"medio"|"baixo", "reason": "...", "message": "..."}`;
```

---

## Fase 6 — Polimento e Deploy (3 dias)

- [ ] Testes de integração nos módulos críticos
- [ ] Lighthouse score > 90 no frontend
- [ ] Error tracking (Sentry ou similar)
- [ ] Deploy no VPS: `docker-compose up -d`
- [ ] Certbot para `crm.centroautoalianca.com.br`
- [ ] Uptime Kuma monitorando backend
- [ ] Documentação de onboarding para novos agentes

---

## Regras de "pronto"

Um item só é considerado entregue quando:

1. Código commitado e revisado (mesmo que por você mesmo, fazendo pausa)
2. Funciona no ambiente local via `docker-compose up`
3. TypeScript compila sem erros e sem `any` não justificado
4. Tem pelo menos um teste se for lógica de negócio
5. Documentação atualizada (ROADMAP, API, ou comentários relevantes)
