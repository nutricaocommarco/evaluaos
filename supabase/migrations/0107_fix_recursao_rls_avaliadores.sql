-- URGENTE: a policy "avaliadores_leitura_indicados" (migration 0106) causa
-- "infinite recursion detected in policy for relation avaliadores" — o
-- USING dela faz um select em public.avaliadores, e como RLS reavalia as
-- policies da própria tabela dentro desse select, entra em loop. Isso
-- quebra QUALQUER leitura de avaliadores pra usuário logado, não só a
-- lista de indicados.
--
-- Fix padrão do Postgres/Supabase pra esse caso: resolver "meu id" numa
-- função security definer — ela roda com privilégio elevado, então o
-- select interno não reaciona as policies da tabela (não recursa).
create or replace function public.meu_avaliador_id()
returns bigint
language sql
security definer
stable
as $$
  select id from public.avaliadores where auth_id = auth.uid();
$$;

drop policy if exists "avaliadores_leitura_indicados" on public.avaliadores;
create policy "avaliadores_leitura_indicados" on public.avaliadores
  for select
  using (indicado_por = public.meu_avaliador_id());
