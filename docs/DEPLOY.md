# Deploy — VPS Hostinger

Stack: dois containers (backend Node, frontend estático via Nginx) atrás do
**Nginx que já roda no host**, com TLS do Certbot. O banco é o Supabase
gerenciado — não há Postgres nesta stack.

```
internet ──► Nginx do host (:80/:443, Certbot)
                 │
                 ├─ /api/  ──► 127.0.0.1:3001  container backend
                 └─ /      ──► 127.0.0.1:8080  container frontend
```

Nenhum container publica 80/443: essas portas já são do Nginx do host, que
atende `n8n.centroautoalianca.com.br` e `evo.centroautoalianca.com.br`.
Os containers escutam apenas em `127.0.0.1`, então não são alcançáveis da
internet a não ser através do Nginx.

## Pré-requisitos

- Docker + Docker Compose plugin no VPS
- Nginx e Certbot já instalados (já estão, servindo n8n e Evolution)
- DNS: registro `A` de `crm.centroautoalianca.com.br` apontando para o VPS

## 1. Código e variáveis

```bash
git clone git@github.com:Petersonsalmeida/crm-multiatendimento.git
cd crm-multiatendimento
cp .env.example .env
```

Edite o `.env`. Em produção o backend **se recusa a subir** se faltar algo —
é proposital, melhor falhar no boot que rodar aberto:

| Variável | Valor em produção |
|---|---|
| `NODE_ENV` | `production` |
| `CORS_ORIGINS` | `https://crm.centroautoalianca.com.br` |
| `EVOLUTION_WEBHOOK_SECRET` | segredo compartilhado com a Evolution API |
| `JWT_SECRET` | valor forte e único (não o placeholder) |
| `SUPABASE_*` | do painel do Supabase |
| `VITE_API_URL` | `https://crm.centroautoalianca.com.br/api` |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | do painel do Supabase |

> As `VITE_*` são lidas em **build**, não em runtime — ficam inlinadas no
> bundle. Mudou alguma? É `--build`, não `restart`.

## 2. Nginx do host

```bash
sudo cp deploy/nginx/crm.centroautoalianca.com.br.conf \
        /etc/nginx/sites-available/crm.centroautoalianca.com.br
sudo ln -s /etc/nginx/sites-available/crm.centroautoalianca.com.br \
           /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Na primeira vez, comente o bloco `server { listen 443 ... }` — o certificado
ainda não existe e o `nginx -t` falha. O Certbot devolve o bloco pronto:

```bash
sudo certbot --nginx -d crm.centroautoalianca.com.br
```

## 3. Subir

```bash
docker compose up -d --build
docker compose ps
curl -s https://crm.centroautoalianca.com.br/api/healthz
```

O `healthz` deve responder `{"status":"ok",...}` com `"env":"production"`.

## 4. Webhook da Evolution API

Aponte a instância para o novo endereço, com o mesmo segredo do `.env`:

```
URL:    https://crm.centroautoalianca.com.br/api/webhooks/evolution
Header: apikey: <EVOLUTION_WEBHOOK_SECRET>
```

## 5. Monitoramento

Adicione no Uptime Kuma que já roda no VPS:
`https://crm.centroautoalianca.com.br/api/healthz`, esperando HTTP 200.

## Operação

```bash
docker compose logs -f backend       # logs (retidos: 5 arquivos de 10MB)
docker compose restart backend       # restart sem rebuild
git pull && docker compose up -d --build   # deploy de nova versão
docker compose down                  # derrubar a stack
```

### Liberar um agente novo

Cadastros nascem **inativos** por segurança (migration `0004`). Depois que a
pessoa se cadastra, libere pelo SQL editor do Supabase:

```sql
update public.users set is_active = true where email = 'agente@exemplo.com';
-- para promover a admin:
update public.users set role = 'admin' where email = 'agente@exemplo.com';
```

### Migrations do banco

As migrations em `supabase/migrations/` são aplicadas no projeto Supabase
(via CLI ou SQL editor), não pelos containers. Rode-as antes de subir uma
versão que dependa de schema novo.

## Notas

- **Não** suba um container Nginx nas portas 80/443: derruba n8n e Evolution.
- O backend roda com `trust proxy`, lendo `X-Forwarded-For` do Nginx para
  aplicar rate limit por IP real. Alterar o proxy exige revisar isso.
- O `docker compose up --build` reconstrói o frontend com as `VITE_*` do
  `.env` naquele momento — confira o arquivo antes de deployar.
