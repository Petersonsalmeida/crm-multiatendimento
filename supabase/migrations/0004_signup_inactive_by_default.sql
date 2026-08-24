-- =====================================================================
-- AliançaCRM — Cadastro novo nasce inativo (Fase: auth)
-- =====================================================================
-- Antes: quem se cadastrasse via Supabase Auth virava 'agente' ativo
-- automaticamente, ganhando acesso de leitura a todos os contatos e
-- conversas. Com o cadastro público habilitado no projeto, bastava
-- descobrir a URL do Supabase.
--
-- Agora: o cadastro continua provisionando a linha em public.users
-- (útil para o admin ver quem pediu acesso), mas com is_active = false.
-- Toda policy de RLS e o middleware do backend checam is_active, então
-- o usuário não enxerga nada até um admin liberar:
--
--   update public.users set is_active = true where email = '...';
--
-- Defesa em profundidade: vale mesmo com o cadastro público desligado
-- no painel, porque não depende daquela configuração.
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
  values (new.id, new.email, derived_full_name, 'agente', false)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_auth_user() from public;

-- Novo default também no schema: qualquer insert que esqueça a coluna
-- (backend, seed, painel) nasce inativo em vez de ativo.
alter table public.users alter column is_active set default false;
