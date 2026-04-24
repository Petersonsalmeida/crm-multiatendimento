-- =====================================================================
-- AliançaCRM — Schema inicial (Fase 1)
-- =====================================================================
-- Convenções:
--   * IDs sempre uuid v4 (gen_random_uuid()), gerados pelo banco
--   * Timestamps em timestamptz, default now()
--   * updated_at atualizado via trigger
--   * Nenhuma lógica de negócio no banco além de integridade referencial
-- RLS será adicionado em migration separada junto com o módulo de auth.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Trigger utilitário para manter updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- users — agentes do sistema (vinculados ao auth.users do Supabase)
-- ---------------------------------------------------------------------
create type public.user_role as enum ('admin', 'agente');

create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  full_name     text not null,
  role          public.user_role not null default 'agente',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- contacts — leads e clientes
-- ---------------------------------------------------------------------
create type public.contact_status as enum (
  'novo',
  'qualificado',
  'em_negociacao',
  'cliente',
  'perdido',
  'arquivado'
);

create table public.contacts (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text not null,
  email         text,
  company       text,
  status        public.contact_status not null default 'novo',
  tags          text[] not null default '{}',
  notes         text,
  source        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint contacts_phone_unique unique (phone)
);

create trigger trg_contacts_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

create index idx_contacts_status on public.contacts(status);
create index idx_contacts_created_at on public.contacts(created_at desc);
create index idx_contacts_tags on public.contacts using gin(tags);

-- ---------------------------------------------------------------------
-- conversations — uma thread por canal por contato
-- ---------------------------------------------------------------------
create type public.channel as enum ('whatsapp', 'instagram', 'webchat');

create type public.conversation_status as enum (
  'aberta',
  'aguardando_cliente',
  'pausada',
  'finalizada'
);

create table public.conversations (
  id            uuid primary key default gen_random_uuid(),
  contact_id    uuid not null references public.contacts(id) on delete cascade,
  channel       public.channel not null default 'whatsapp',
  assigned_to   uuid references public.users(id) on delete set null,
  status        public.conversation_status not null default 'aberta',
  last_msg_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create index idx_conversations_contact on public.conversations(contact_id);
create index idx_conversations_assigned on public.conversations(assigned_to);
create index idx_conversations_status on public.conversations(status);
create index idx_conversations_last_msg on public.conversations(last_msg_at desc nulls last);

-- ---------------------------------------------------------------------
-- messages — mensagens individuais de cada conversa
-- ---------------------------------------------------------------------
create type public.message_direction as enum ('inbound', 'outbound');

create type public.message_kind as enum (
  'text',
  'image',
  'audio',
  'video',
  'document',
  'sticker',
  'location',
  'system'
);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  external_id     text,
  direction       public.message_direction not null,
  kind            public.message_kind not null default 'text',
  content         text,
  media_url       text,
  from_bot        boolean not null default false,
  sent_by         uuid references public.users(id) on delete set null,
  sent_at         timestamptz not null default now(),
  delivered_at    timestamptz,
  read_at         timestamptz,
  constraint messages_external_id_unique unique (external_id)
);

create index idx_messages_conversation on public.messages(conversation_id, sent_at);
create index idx_messages_direction on public.messages(direction);

-- Mantém conversations.last_msg_at atualizado conforme chegam mensagens
create or replace function public.bump_conversation_last_msg()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
     set last_msg_at = new.sent_at,
         updated_at = now()
   where id = new.conversation_id
     and (last_msg_at is null or last_msg_at < new.sent_at);
  return new;
end;
$$;

create trigger trg_messages_bump_last_msg
after insert on public.messages
for each row execute function public.bump_conversation_last_msg();

-- ---------------------------------------------------------------------
-- deals — oportunidades de negócio no Kanban
-- ---------------------------------------------------------------------
create type public.deal_stage as enum (
  'lead',
  'qualificado',
  'orcamento_enviado',
  'negociacao',
  'ganho',
  'perdido'
);

create table public.deals (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid not null references public.contacts(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  title           text not null,
  value_cents     bigint not null default 0 check (value_cents >= 0),
  stage           public.deal_stage not null default 'lead',
  position        integer not null default 0,
  owner_id        uuid references public.users(id) on delete set null,
  expected_close  date,
  lost_reason     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_deals_updated_at
before update on public.deals
for each row execute function public.set_updated_at();

create index idx_deals_contact on public.deals(contact_id);
create index idx_deals_stage_position on public.deals(stage, position);
create index idx_deals_owner on public.deals(owner_id);

-- ---------------------------------------------------------------------
-- followups — sugestões de follow-up geradas pela IA
-- ---------------------------------------------------------------------
create type public.followup_priority as enum ('urgente', 'medio', 'baixo');

create type public.followup_status as enum (
  'pending',
  'sent',
  'snoozed',
  'dismissed',
  'edited_and_sent'
);

create table public.followups (
  id               uuid primary key default gen_random_uuid(),
  contact_id       uuid not null references public.contacts(id) on delete cascade,
  conversation_id  uuid references public.conversations(id) on delete set null,
  priority         public.followup_priority not null,
  reason           text not null,
  suggested_text   text not null,
  final_text       text,
  scheduled_for    timestamptz,
  status           public.followup_status not null default 'pending',
  sent_at          timestamptz,
  resolved_by      uuid references public.users(id) on delete set null,
  ai_model         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_followups_updated_at
before update on public.followups
for each row execute function public.set_updated_at();

create index idx_followups_status on public.followups(status);
create index idx_followups_contact on public.followups(contact_id);
create index idx_followups_scheduled on public.followups(scheduled_for);
