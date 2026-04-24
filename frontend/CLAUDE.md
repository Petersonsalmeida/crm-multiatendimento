# Frontend — Regras específicas

> Lê antes de editar qualquer arquivo em `frontend/`. Complementa — não substitui — o `CLAUDE.md` da raiz.

## Stack confirmada

- React 18 + Vite 5 + TypeScript estrito
- TailwindCSS 3 com paleta `whatsapp.*` / `bg.*` / `text.*` (ver `tailwind.config.js`)
- Zustand para estado global (slices por módulo)
- Imports absolutos via alias `@/*` → `src/*`

## Regra de ouro das camadas

```
pages/ → components/ → hooks/ → services/
                         ↑
                       store/ (lido por hooks quando necessário)
```

- **`components/` nunca chama `services/` direto.** Sempre via `hooks/`.
- **`components/` nunca faz fetch.** Recebe dados por prop.
- **`store/` nunca importa de `components/`.**
- **`services/` são funções puras de I/O** — sem estado, sem side effects além da chamada remota.

## Componentes

- Um arquivo = um componente exportado (+ subcomponentes privados locais, se realmente forem usados só ali).
- Arquivo > 200 linhas = refatorar.
- **Props tipadas em `interface ...Props`** exportada quando outros componentes precisam compor.
- Usar `forwardRef` quando o componente renderiza um elemento focável ou precisa de ref externa (ver [Button.tsx](src/components/shared/Button.tsx)).
- Classes compostas via helper `cn()` de [`@/lib/cn`](src/lib/cn.ts) — nunca concatenar strings manualmente.
- **Nada de estilos inline** (`style={{}}`) exceto valores dinâmicos que não cabem em Tailwind (ex: `transform` calculado).

## Acessibilidade

- Todo elemento interativo tem foco visível (já coberto pelo `focus-visible:ring-*` no Button de referência).
- `aria-busy`, `aria-label`, `aria-expanded` onde aplicável.
- Contraste mínimo AA contra `bg-bg-base`/`bg-bg-surface`.

## Hooks

- Nome começa com `use`.
- Um hook por arquivo em `hooks/`.
- Se o hook fizer fetch, deve retornar `{ data, isLoading, error, refetch }` — padrão consistente.
- Não chamar hook dentro de `if/for`.

## Store (Zustand)

- Uma slice por módulo em `store/<modulo>Store.ts`.
- Selectors são funções puras exportadas — não acoplam componentes ao shape interno do state.
- Nada de lógica de negócio no store — só armazenar e normalizar estado vindo de `services/`.

## Referência de padrão

[`src/components/shared/Button.tsx`](src/components/shared/Button.tsx) é o template. Ao criar novo componente shared, copiar a estrutura:

1. `interface ...Props extends HTMLAttributes<...>`
2. Mapas `Record<Variant, string>` para variantes e tamanhos
3. `forwardRef` se for elemento focável
4. `cn(baseStyles, variantStyles[variant], ..., className)` permitindo override externo
5. `type` default quando for `<button>`

## Checklist antes de commitar

- [ ] `npm run typecheck` passa
- [ ] `npm run build` passa
- [ ] Nenhum componente > 200 linhas
- [ ] Nenhum `any` sem comentário justificando
- [ ] Nenhum import relativo `../../` (usar `@/`)
