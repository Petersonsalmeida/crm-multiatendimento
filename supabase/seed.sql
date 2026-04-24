-- =====================================================================
-- Seed de desenvolvimento — apenas para ambiente local
-- =====================================================================
-- NÃO rodar em produção. Insere dados fictícios para validar UI.
-- Depende de 0001_init.sql aplicada.
-- =====================================================================

-- Contato exemplo (sem relação com auth.users, apenas dado de teste)
insert into public.contacts (id, name, phone, company, status, tags)
values (
  '11111111-1111-1111-1111-111111111111',
  'Cliente Exemplo',
  '+5551999990000',
  'Oficina Teste',
  'novo',
  array['demo', 'seed']
)
on conflict (phone) do nothing;
