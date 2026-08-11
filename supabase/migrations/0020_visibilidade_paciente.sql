-- Controle manual de visibilidade pro paciente ("Liga/Desliga").
--
-- Hoje só planos_alimentares tem uma noção de "ativo", e é imposta
-- automaticamente: só pode existir 1 por paciente (índice único parcial),
-- e criar um novo desativa o anterior na hora. Isso causa um bug (excluir
-- o plano novo não reativa o antigo — o paciente fica sem nenhum) e não
-- deixa o nutricionista mostrar 2+ planos ao mesmo tempo de propósito.
--
-- Esta migration:
--   1. Remove a trava de "só 1 ativo por vez" em planos_alimentares — a
--      coluna `ativo` continua existindo, mas passa a significar
--      simplesmente "visível pro paciente" e pode ser true em várias
--      linhas ao mesmo tempo (controle manual, sem renomear a coluna pra
--      não quebrar todo o código que já referencia `ativo`).
--   2. Adiciona `visivel_paciente` (mesmo conceito, nome novo) em
--      avaliacoes, orientacoes_nutricionais e listas_recomendacoes —
--      nenhuma delas tinha qualquer coluna de visibilidade antes.
--   3. Atualiza a RLS pública (migration 0018) pra também filtrar por
--      visibilidade — hoje ela só checa que o paciente existe, então
--      "esconder" algo só no app não impede leitura via token se uma
--      query esquecer o filtro. Aqui a visibilidade passa a ser
--      garantida no banco também.

-- ----------------------------------------------------------------------------
-- 1. planos_alimentares — permite múltiplos "ativo = true" ao mesmo tempo.
-- ----------------------------------------------------------------------------
drop index if exists idx_planos_um_ativo_por_paciente;

-- ----------------------------------------------------------------------------
-- 2. Novas colunas de visibilidade.
-- ----------------------------------------------------------------------------
alter table public.avaliacoes
  add column if not exists visivel_paciente boolean not null default true;

alter table public.orientacoes_nutricionais
  add column if not exists visivel_paciente boolean not null default true;

alter table public.listas_recomendacoes
  add column if not exists visivel_paciente boolean not null default true;

-- ----------------------------------------------------------------------------
-- 3. RLS pública — recria as policies de leitura anônima (0018) com o
--    filtro de visibilidade adicionado.
-- ----------------------------------------------------------------------------
drop policy if exists "avaliacoes_leitura_publica_via_paciente" on public.avaliacoes;
create policy "avaliacoes_leitura_publica_via_paciente" on public.avaliacoes
  for select to anon using (
    visivel_paciente = true
    and exists (select 1 from public.pacientes p where p.id = avaliacoes.id_paciente)
  );

drop policy if exists "planos_leitura_publica_via_paciente" on public.planos_alimentares;
create policy "planos_leitura_publica_via_paciente" on public.planos_alimentares
  for select to anon using (
    ativo = true
    and exists (select 1 from public.pacientes p where p.id = planos_alimentares.id_paciente)
  );

drop policy if exists "refeicoes_leitura_publica_via_paciente" on public.refeicoes_prescritas;
create policy "refeicoes_leitura_publica_via_paciente" on public.refeicoes_prescritas
  for select to anon using (
    exists (
      select 1 from public.planos_alimentares pl
      where pl.id = refeicoes_prescritas.id_plano
        and pl.ativo = true
    )
  );

drop policy if exists "itens_refeicao_leitura_publica_via_paciente" on public.itens_refeicao;
create policy "itens_refeicao_leitura_publica_via_paciente" on public.itens_refeicao
  for select to anon using (
    exists (
      select 1 from public.refeicoes_prescritas r
      join public.planos_alimentares pl on pl.id = r.id_plano
      where r.id = itens_refeicao.id_refeicao
        and pl.ativo = true
    )
  );

drop policy if exists "substitutos_leitura_publica_via_paciente" on public.substitutos_item;
create policy "substitutos_leitura_publica_via_paciente" on public.substitutos_item
  for select to anon using (
    exists (
      select 1 from public.itens_refeicao i
      join public.refeicoes_prescritas r on r.id = i.id_refeicao
      join public.planos_alimentares pl on pl.id = r.id_plano
      where i.id = substitutos_item.id_item_original
        and pl.ativo = true
    )
  );

drop policy if exists "orientacoes_leitura_publica_via_paciente" on public.orientacoes_nutricionais;
create policy "orientacoes_leitura_publica_via_paciente" on public.orientacoes_nutricionais
  for select to anon using (
    visivel_paciente = true
    and exists (select 1 from public.pacientes p where p.id = orientacoes_nutricionais.id_paciente)
  );

-- Nova — não existia tela pública pra Listas de Recomendações antes.
drop policy if exists "listas_leitura_publica_via_paciente" on public.listas_recomendacoes;
create policy "listas_leitura_publica_via_paciente" on public.listas_recomendacoes
  for select to anon using (
    visivel_paciente = true
    and exists (select 1 from public.pacientes p where p.id = listas_recomendacoes.id_paciente)
  );
