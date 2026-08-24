-- =====================================================================
-- AliançaCRM — Realtime em conversations e messages (Fase: chat)
-- =====================================================================
-- Reconciliação: as duas tabelas já estavam na publicação no projeto
-- remoto (habilitadas pelo painel), mas isso não estava em migration
-- nenhuma — um ambiente novo subiria com o chat mudo, sem erro visível.
--
-- Sem estar na publicação `supabase_realtime`, o Postgres não emite os
-- eventos de replicação que o Realtime escuta: o frontend assina o
-- canal, recebe SUBSCRIBED e simplesmente nunca é notificado.
--
-- O RLS continua valendo para o Realtime: só usuário ativo recebe
-- eventos, pelas policies de 0003.
-- =====================================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
