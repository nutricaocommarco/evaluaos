-- A RLS de public.avaliadores hoje só deixa cada um ler a própria linha
-- (auth_id = auth.uid()) — foi criada direto no Supabase, fora de
-- migration, então não tem arquivo pra editar aqui. Isso bloqueava a tela
-- "Quem você já indicou" em Configuracoes.jsx: mesmo com indicado_por
-- gravado certo pela trigger, a consulta do referenciador voltava vazia
-- porque RLS filtra por linha, não por indicado_por.
--
-- Policy adicional (RLS soma policies do mesmo comando com OR, não
-- substitui a existente): libera leitura só das linhas em que
-- indicado_por aponta pra você mesmo — ou seja, só quem você
-- pessoalmente indicou, nada além disso.
drop policy if exists "avaliadores_leitura_indicados" on public.avaliadores;
create policy "avaliadores_leitura_indicados" on public.avaliadores
  for select
  using (
    indicado_por in (select id from public.avaliadores where auth_id = auth.uid())
  );
