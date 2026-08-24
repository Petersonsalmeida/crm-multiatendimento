# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------
# build — gera os estáticos do Vite
# ---------------------------------------------------------------------
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# ATENÇÃO: variáveis VITE_* são resolvidas em BUILD, não em runtime —
# elas são inlinadas no bundle. Por isso chegam como build args, e não
# como environment do container. Trocar de projeto Supabase ou de URL
# da API exige rebuild da imagem, não só restart.
#
# A anon key do Supabase é pública por design (o que protege os dados é
# o RLS), então não há segredo sendo embutido aqui.
ARG VITE_API_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# ---------------------------------------------------------------------
# runtime — nginx servindo os estáticos
# ---------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
