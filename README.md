# AliançaCRM

CRM de multiatendimento integrado ao WhatsApp para o Centro Automotivo Aliança.

## Stack

React + Vite + TailwindCSS · Node.js + Express + TypeScript · Supabase · Evolution API · N8N · Claude API

## Módulos

- **Chat / Multiatendimento** — atendimento ao vivo via WhatsApp
- **Kanban de Negociações** — funil de vendas com drag-and-drop
- **Gestão de Contatos** — CRUD completo de leads e clientes
- **Dashboard** — métricas, gráficos e insights da IA
- **Follow-up com IA** — Claude sugere mensagens para reativar leads

## Como começar

Leia `docs/COMECAR-AQUI.md`.

## Documentação

- [`CLAUDE.md`](./CLAUDE.md) — contexto do projeto para Claude Code
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — decisões técnicas
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — fases de implementação
- [`docs/COMECAR-AQUI.md`](./docs/COMECAR-AQUI.md) — guia para iniciar no Claude Code

## Princípios

1. Componentização radical — arquivos pequenos, responsabilidade única
2. Separação de camadas — UI, hooks, services, store
3. TypeScript estrito
4. Reaproveitar a infra existente no VPS
