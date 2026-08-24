# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------
# build — compila TS e resolve os aliases @/ (tsc-alias)
# ---------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Reinstala só as dependências de produção para copiar adiante.
RUN npm ci --omit=dev

# ---------------------------------------------------------------------
# runtime — imagem final, sem toolchain de build
# ---------------------------------------------------------------------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# `node` já existe na imagem oficial (uid 1000) — não rodar como root.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

USER node

EXPOSE 3001

# O healthcheck bate no mesmo /healthz que o Uptime Kuma monitora.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
