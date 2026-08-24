-- =====================================================================
-- AliançaCRM — Row Level Security (Fase: auth)
-- =====================================================================
-- Modelo de acesso:
--   * O backend usa a service key (bypassa RLS) — nada muda para ele.
--   * Clientes diretos (frontend com anon key + JWT do usuário, Realtime)
--     só enxergam dados se forem usuários ativos em public.users.
--   * CRM de equipe única: todo agente ativo vê tudo; DELETE é só admin
--     (espelha a política do backend em /contacts/:id).
--   * anon (sem login) não tem policy nenhuma => acesso negado.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helpers (security definer para poder ler public.users sob RLS)
-- ---------------------------------------------------------------------
create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
     where u.id = auth.uid()
       and u.is_active
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u
     where u.id = auth.uid()
       and u.is_active
       and u.role = 'admin'
  );
$$;

revoke execute on function public.is_active_user() from anon;
revoke execute on function public.is_admin() from anon;

-- ---------------------------------------------------------------------
-- users — cada um vê o próprio cadastro; admin vê todos.
-- Escrita só via backend (service key); nenhuma policy de insert/update.
-- ---------------------------------------------------------------------
alter table public.users enable row level security;

create policy users_select_own_or_admin
  on public.users for select to authenticated
  using (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- Tabelas de negócio — leitura/escrita para usuário ativo, delete só admin
-- ---------------------------------------------------------------------

-- contacts
alter table public.contacts enable row level security;

create policy contacts_select on public.contacts
  for select to authenticated using (public.is_active_user());
create policy contacts_insert on public.contacts
  for insert to authenticated with check (public.is_active_user());
create policy contacts_update on public.contacts
  for update to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy contacts_delete on public.contacts
  for delete to authenticated using (public.is_admin());

-- conversations
alter table public.conversations enable row level security;

create policy conversations_select on public.conversations
  for select to authenticated using (public.is_active_user());
create policy conversations_insert on public.conversations
  for insert to authenticated with check (public.is_active_user());
create policy conversations_update on public.conversations
  for update to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy conversations_delete on public.conversations
  for delete to authenticated using (public.is_admin());

-- messages
alter table public.messages enable row level security;

create policy messages_select on public.messages
  for select to authenticated using (public.is_active_user());
create policy messages_insert on public.messages
  for insert to authenticated with check (public.is_active_user());
create policy messages_update on public.messages
  for update to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy messages_delete on public.messages
  for delete to authenticated using (public.is_admin());

-- deals
alter table public.deals enable row level security;

create policy deals_select on public.deals
  for select to authenticated using (public.is_active_user());
create policy deals_insert on public.deals
  for insert to authenticated with check (public.is_active_user());
create policy deals_update on public.deals
  for update to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy deals_delete on public.deals
  for delete to authenticated using (public.is_admin());

-- followups
alter table public.followups enable row level security;

create policy followups_select on public.followups
  for select to authenticated using (public.is_active_user());
create policy followups_insert on public.followups
  for insert to authenticated with check (public.is_active_user());
create policy followups_update on public.followups
  for update to authenticated
  using (public.is_active_user()) with check (public.is_active_user());
create policy followups_delete on public.followups
  for delete to authenticated using (public.is_admin());
