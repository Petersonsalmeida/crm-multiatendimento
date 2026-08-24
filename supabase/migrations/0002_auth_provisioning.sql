-- =====================================================================
-- AliançaCRM — Provisionamento automático de public.users (Fase: auth)
-- =====================================================================
-- Reconciliação: este trigger/função já existiam no projeto Supabase
-- remoto (criados fora do fluxo de migrations) e são capturados aqui
-- para que o schema fique reproduzível em qualquer ambiente novo.
--
-- Ao criar um usuário em auth.users (signup do Supabase Auth), gera
-- automaticamente a linha correspondente em public.users com role
-- padrão 'agente' — promover a admin é feito manualmente depois.
-- =====================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  derived_full_name text;
begin
  -- Sem email não dá pra logar no CRM — skip silencioso.
  if new.email is null or trim(new.email) = '' then
    return new;
  end if;

  -- Tenta full_name do meta; cai pro local-part do email.
  derived_full_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.users (id, email, full_name, role, is_active)
  values (new.id, new.email, derived_full_name, 'agente', true)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Ninguém deve poder chamar via RPC — só o trigger (via SECURITY
-- DEFINER) invoca esta função. Funções recém-criadas recebem GRANT
-- EXECUTE TO PUBLIC por padrão no Postgres: revogar de anon/authenticated
-- não fecha nada, porque toda role herda privilégio via o pseudo-role
-- PUBLIC — é preciso revogar de PUBLIC mesmo.
revoke execute on function public.handle_new_auth_user() from public;

create or replace trigger trg_provision_public_user
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------
-- Hardening: search_path fixo nas funções de 0001_init.sql (linter
-- function_search_path_mutable — sem isso, uma função SECURITY DEFINER
-- chamada com um search_path manipulado pode resolver para objetos de
-- outro schema controlado pelo atacante).
-- ---------------------------------------------------------------------
alter function public.set_updated_at() set search_path = '';
alter function public.bump_conversation_last_msg() set search_path = '';
