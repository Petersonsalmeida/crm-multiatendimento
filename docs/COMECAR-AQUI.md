# Começando no Claude Code — AliançaCRM

## 1. Instalar Claude Code

```bash
npm install -g @anthropic-ai/claude-code
```

Requer Node.js 18+.

## 2. Abrir o projeto

```bash
cd alianca-crm
claude
```

O Claude Code vai ler automaticamente o `CLAUDE.md` na raiz. Esse arquivo tem prompt caching: o custo da leitura é amortizado entre todas as chamadas da sessão.

## 3. Primeiro prompt recomendado

Cole exatamente isto no Claude Code:

```
Leia o CLAUDE.md e depois docs/ROADMAP.md e docs/ARCHITECTURE.md.

Estamos começando a Fase 1 — Fundação. Por favor:

1. Me mostre um plano passo-a-passo do que vai fazer antes de escrever qualquer código
2. Espere minha confirmação
3. Só então comece a scaffoldar

Não pule etapas do ROADMAP. Comece pelo frontend (Vite + React + TS + Tailwind
com tema dark + verde WhatsApp). Crie o tsconfig com paths absolutos (@/*).
```

Esse prompt segue o princípio do vídeo: **planejar primeiro, codar depois**.

## 4. Fluxo de trabalho recomendado por sessão

Para cada nova feature:

```
1. Abrir Claude Code
2. Dizer: "Vamos trabalhar na [feature X]. Leia o CLAUDE.md do módulo
   e o trecho relevante do ROADMAP."
3. Pedir plano antes de código
4. Implementar em commits pequenos
5. Ao final: pedir para atualizar docs e fazer commit
```

## 5. Comandos úteis do Claude Code

| Comando | O que faz |
|---|---|
| `/clear` | Limpa o contexto da sessão (útil entre tarefas grandes) |
| `/cost` | Mostra quanto você já gastou na sessão |
| `/memory` | Abre o CLAUDE.md para editar |
| `!<comando>` | Executa comando bash diretamente |
| `#<nota>` | Adiciona nota persistente ao CLAUDE.md |

## 6. Anti-padrões a evitar

- ❌ "Cria o CRM inteiro pra mim" — ele vai gerar código ruim e você perde o controle
- ❌ Aceitar código sem ler — componentização só funciona se você entende cada peça
- ❌ Ignorar TypeScript errors — resolve na hora que aparecem
- ❌ Commits gigantes — um commit = uma ideia isolada

## 7. Padrões a adotar

- ✅ Pedir explicação antes de aceitar refatorações grandes
- ✅ Após cada fase, rodar `/clear` e começar sessão nova
- ✅ Atualizar o CLAUDE.md conforme o projeto evolui
- ✅ Criar CLAUDE.md específicos por módulo (`frontend/src/components/chat/CLAUDE.md`) para regras detalhadas que não precisam estar no raiz

## 8. Quando pedir ajuda aqui (neste chat) e quando usar Claude Code

**Neste chat (claude.ai):**
- Planejar features novas
- Discutir arquitetura
- Gerar mockups visuais
- Escrever prompts de IA (como o de follow-up)
- Revisar código que você copia e cola

**No Claude Code:**
- Escrever e editar arquivos
- Rodar comandos bash
- Fazer commits
- Debug que precisa ler múltiplos arquivos
- Refatorações que afetam vários arquivos

## 9. Economizando tokens no Claude Code

- Use `/clear` entre tarefas independentes
- Mantenha CLAUDE.md enxuto (atualmente ~150 linhas, ok)
- Prefira edits com `str_replace` em vez de reescrever arquivos inteiros
- Não peça pro Claude Code "explicar o que fez" — leia o diff

## 10. Próximo passo literal

```bash
# Copiar esta pasta para seu computador
# No Windows, via WSL ou diretamente:
cd C:\projetos
git init alianca-crm
cd alianca-crm

# Copiar os arquivos gerados aqui para dentro

# Primeiro commit
git add .
git commit -m "docs: setup inicial do projeto com CLAUDE.md e roadmap"

# Abrir Claude Code
claude
```
