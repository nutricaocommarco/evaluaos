-- Área do Paciente — portal único (/area/:tokenUrl, token = pacientes.
-- token_publico). Só adiciona policies de LEITURA pro role anon nas
-- tabelas que já existem — nenhuma tabela nova aqui, nenhuma policy
-- existente é tocada (policies são aditivas: uma linha aparece se
-- QUALQUER policy permitir).
--
-- Mesmo nível de confiança que o app já usa hoje: depois de resolver o
-- paciente pelo token_publico uma vez (já existe), qualquer leitura
-- seguinte via id_paciente é permitida — igual EvolucaoPaciente.jsx já faz
-- uma busca anônima em avaliadores só por id_avaliador, sem exigir outro
-- token. Não introduz função RPC (o projeto não usa nenhuma até agora).

-- ----------------------------------------------------------------------------
-- avaliacoes — pra achar a mais recente e o token_publico dela, e assim
-- linkar pro /laudo/:token já existente sem mexer em ResultadoAvaliacao.jsx.
-- ----------------------------------------------------------------------------
drop policy if exists "avaliacoes_leitura_publica_via_paciente" on public.avaliacoes;
create policy "avaliacoes_leitura_publica_via_paciente" on public.avaliacoes
  for select to anon using (
    exists (select 1 from public.pacientes p where p.id = avaliacoes.id_paciente)
  );

-- ----------------------------------------------------------------------------
-- planos_alimentares + refeições + itens + substitutos — plano ativo,
-- só leitura.
-- ----------------------------------------------------------------------------
drop policy if exists "planos_leitura_publica_via_paciente" on public.planos_alimentares;
create policy "planos_leitura_publica_via_paciente" on public.planos_alimentares
  for select to anon using (
    exists (select 1 from public.pacientes p where p.id = planos_alimentares.id_paciente)
  );

drop policy if exists "refeicoes_leitura_publica_via_paciente" on public.refeicoes_prescritas;
create policy "refeicoes_leitura_publica_via_paciente" on public.refeicoes_prescritas
  for select to anon using (
    exists (
      select 1 from public.planos_alimentares pl
      where pl.id = refeicoes_prescritas.id_plano
    )
  );

drop policy if exists "itens_refeicao_leitura_publica_via_paciente" on public.itens_refeicao;
create policy "itens_refeicao_leitura_publica_via_paciente" on public.itens_refeicao
  for select to anon using (
    exists (
      select 1 from public.refeicoes_prescritas r
      where r.id = itens_refeicao.id_refeicao
    )
  );

drop policy if exists "substitutos_leitura_publica_via_paciente" on public.substitutos_item;
create policy "substitutos_leitura_publica_via_paciente" on public.substitutos_item
  for select to anon using (
    exists (
      select 1 from public.itens_refeicao i
      where i.id = substitutos_item.id_item_original
    )
  );

-- ----------------------------------------------------------------------------
-- orientacoes_nutricionais — só leitura.
-- ----------------------------------------------------------------------------
drop policy if exists "orientacoes_leitura_publica_via_paciente" on public.orientacoes_nutricionais;
create policy "orientacoes_leitura_publica_via_paciente" on public.orientacoes_nutricionais
  for select to anon using (
    exists (select 1 from public.pacientes p where p.id = orientacoes_nutricionais.id_paciente)
  );

-- ----------------------------------------------------------------------------
-- questionario_envios — a policy de leitura pública da migration 0015 só
-- permite achar UM envio pelo próprio token; esta aqui é uma SEGUNDA
-- policy (aditiva) pra listar todos os envios de um paciente na tela de
-- Questionários do portal.
-- ----------------------------------------------------------------------------
drop policy if exists "questionario_envios_leitura_publica_via_paciente" on public.questionario_envios;
create policy "questionario_envios_leitura_publica_via_paciente" on public.questionario_envios
  for select to anon using (
    exists (select 1 from public.pacientes p where p.id = questionario_envios.id_paciente)
  );
