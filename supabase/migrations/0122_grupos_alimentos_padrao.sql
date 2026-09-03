-- 1) Torna Grupos de Alimentos suportar grupos PÚBLICOS/OFICIAIS (visíveis
-- pra todo nutricionista), no mesmo padrão já usado em tabela_alimentos
-- ("alimentos_leitura_oficial_ou_proprio": id_avaliador null = oficial).
-- Os 9 grupos "padrão" cadastrados nesta migration entram com
-- id_avaliador = null; grupos criados pela tela (+ Novo grupo) continuam
-- privados (id_avaliador = auth.uid()) e a leitura já mostra os dois juntos.

alter table public.grupos_alimentos_modelo alter column id_avaliador drop not null;

drop policy if exists "grupos_alimentos_modelo_isolamento_avaliador" on public.grupos_alimentos_modelo;

create policy "grupos_alimentos_modelo_leitura_oficial_ou_proprio" on public.grupos_alimentos_modelo
  for select using (id_avaliador is null or id_avaliador = auth.uid());

create policy "grupos_alimentos_modelo_escrita_somente_proprio" on public.grupos_alimentos_modelo
  for insert with check (id_avaliador = auth.uid());

create policy "grupos_alimentos_modelo_update_somente_proprio" on public.grupos_alimentos_modelo
  for update using (id_avaliador = auth.uid()) with check (id_avaliador = auth.uid());

create policy "grupos_alimentos_modelo_delete_somente_proprio" on public.grupos_alimentos_modelo
  for delete using (id_avaliador = auth.uid());

drop policy if exists "grupos_alimentos_modelo_itens_isolamento_via_grupo" on public.grupos_alimentos_modelo_itens;

create policy "grupos_alimentos_modelo_itens_leitura_oficial_ou_proprio" on public.grupos_alimentos_modelo_itens
  for select using (
    exists (
      select 1 from public.grupos_alimentos_modelo g
      where g.id = grupos_alimentos_modelo_itens.id_grupo
        and (g.id_avaliador is null or g.id_avaliador = auth.uid())
    )
  );

create policy "grupos_alimentos_modelo_itens_escrita_via_grupo_proprio" on public.grupos_alimentos_modelo_itens
  for insert with check (
    exists (select 1 from public.grupos_alimentos_modelo g where g.id = grupos_alimentos_modelo_itens.id_grupo and g.id_avaliador = auth.uid())
  );

create policy "grupos_alimentos_modelo_itens_update_via_grupo_proprio" on public.grupos_alimentos_modelo_itens
  for update using (
    exists (select 1 from public.grupos_alimentos_modelo g where g.id = grupos_alimentos_modelo_itens.id_grupo and g.id_avaliador = auth.uid())
  );

create policy "grupos_alimentos_modelo_itens_delete_via_grupo_proprio" on public.grupos_alimentos_modelo_itens
  for delete using (
    exists (select 1 from public.grupos_alimentos_modelo g where g.id = grupos_alimentos_modelo_itens.id_grupo and g.id_avaliador = auth.uid())
  );


-- 2) Alimentos que faltavam na base pra montar os grupos abaixo (nenhum
-- achado na TACO/IBGE já importada). Entram como oficiais (id_avaliador
-- null) pelo mesmo motivo do 0120: RLS normal só deixa cada avaliador
-- inserir alimento pra si mesmo, então isso só roda com privilégio de dono
-- do projeto, direto no SQL Editor do Supabase.
--
-- Valores por 100g de referências nutricionais públicas conhecidas (USDA
-- FoodData Central / rótulos nutricionais típicos) — não são TACO/IBGE
-- oficiais, ajuste se você tiver uma fonte mais específica.

insert into public.tabela_alimentos (id_avaliador, nome, categoria, fonte, energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g) values
  (null, 'Tilápia, filé, grelhado', 'Peixes e frutos do mar', 'Customizado', 128, 26.15, 2.67, 0, 0),
  (null, 'Contra filé, bovino, sem gordura, grelhado', 'Carnes', 'Customizado', 219, 32, 9, 0, 0),
  (null, 'Tortilha, trigo integral', 'Cereais e derivados', 'Customizado', 290, 8, 7, 48, 4),
  (null, 'Farelo de aveia', 'Cereais e derivados', 'Customizado', 246, 17.3, 7, 66.2, 15.4),
  (null, 'Creme de ricota', 'Leite e derivados', 'Customizado', 140, 8, 10, 4, 0),
  (null, 'Morango, cru', 'Frutas', 'Customizado', 30, 0.9, 0.3, 6.8, 1.65);


-- 3) Os 9 grupos padrão, cada um com os alimentos intercambiáveis
-- calibrados pra ~kcal_alvo (gramas calculados a partir do energia_kcal/100g
-- de cada alimento já na base; descricao_porcao é só a medida caseira
-- informativa, igual ao padrão já usado em unidade_medida/quantidade_medida
-- de itens_refeicao).

do $$
declare
  v_id_grupo bigint;
  v_id_tilapia bigint; v_id_contrafile bigint; v_id_tortilha bigint; v_id_farelo bigint; v_id_creme_ricota bigint; v_id_morango bigint;
begin
  select id into v_id_tilapia from public.tabela_alimentos where nome = 'Tilápia, filé, grelhado' and id_avaliador is null limit 1;
  select id into v_id_contrafile from public.tabela_alimentos where nome = 'Contra filé, bovino, sem gordura, grelhado' and id_avaliador is null limit 1;
  select id into v_id_tortilha from public.tabela_alimentos where nome = 'Tortilha, trigo integral' and id_avaliador is null limit 1;
  select id into v_id_farelo from public.tabela_alimentos where nome = 'Farelo de aveia' and id_avaliador is null limit 1;
  select id into v_id_creme_ricota from public.tabela_alimentos where nome = 'Creme de ricota' and id_avaliador is null limit 1;
  select id into v_id_morango from public.tabela_alimentos where nome = 'Morango, cru' and id_avaliador is null limit 1;

  -- 1) Folhas cruas
  insert into public.grupos_alimentos_modelo (id_avaliador, titulo, kcal_alvo) values (null, 'Folhas cruas', 10) returning id into v_id_grupo;
  insert into public.grupos_alimentos_modelo_itens (id_grupo, id_alimento, quantidade_g, descricao_porcao, ordem) values
    (v_id_grupo, 74, 45, '4 folhas médias', 0),
    (v_id_grupo, 889, 40, '6 colheres de sopa cheias (picado)', 1),
    (v_id_grupo, 844, 65, '5 folhas médias', 2),
    (v_id_grupo, 84, 55, '8 colheres de sopa cheias (picado)', 3),
    (v_id_grupo, 111, 70, '5 folhas médias', 4),
    (v_id_grupo, 115, 35, '2 colheres de sopa cheias (picada)', 5),
    (v_id_grupo, 850, 20, '2 xícaras de chá (picada)', 6),
    (v_id_grupo, 869, 45, '4 folhas', 7),
    (v_id_grupo, 874, 40, '1 xícara de chá (picada)', 8),
    (v_id_grupo, 878, 40, '2 folhas médias', 9),
    (v_id_grupo, 152, 75, '8 colheres de sopa cheias (picada)', 10);

  -- 2) Legumes e verduras
  insert into public.grupos_alimentos_modelo (id_avaliador, titulo, kcal_alvo) values (null, 'Legumes e verduras', 15) returning id into v_id_grupo;
  insert into public.grupos_alimentos_modelo_itens (id_grupo, id_alimento, quantidade_g, descricao_porcao, ordem) values
    (v_id_grupo, 64, 30, '1 colher de sopa cheia', 0),
    (v_id_grupo, 64, 30, '1 colher de sopa cheia', 1),
    (v_id_grupo, 898, 105, '3 colheres de sopa cheias', 2),
    (v_id_grupo, 70, 100, '3 colheres de sopa cheias', 3),
    (v_id_grupo, 890, 135, '12 colheres de sopa cheias', 4),
    (v_id_grupo, 844, 100, '18 folhas médias', 5),
    (v_id_grupo, 95, 80, '4 colheres de sopa cheias', 6),
    (v_id_grupo, 720, 35, '2 colheres de sopa cheias', 7),
    (v_id_grupo, 100, 60, '6 colheres de sopa cheias', 8),
    (v_id_grupo, 726, 40, '3 colheres de sopa cheias', 9),
    (v_id_grupo, 112, 80, '2 colheres de sopa cheias', 10),
    (v_id_grupo, 863, 65, '4 colheres de sopa cheias', 11),
    (v_id_grupo, 116, 15, '1 colher de sopa cheia', 12),
    (v_id_grupo, 982, 55, '4 colheres de servir cheias', 13),
    (v_id_grupo, 142, 155, '1,5 unidade média', 14),
    (v_id_grupo, 152, 115, '12 colheres de sopa cheias (picada)', 15),
    (v_id_grupo, 157, 100, '5 fatias médias', 16),
    (v_id_grupo, 162, 60, '4 colheres de sopa cheias', 17);

  -- 3) Carnes e peixes
  insert into public.grupos_alimentos_modelo (id_avaliador, titulo, kcal_alvo) values (null, 'Carnes e peixes', 190) returning id into v_id_grupo;
  insert into public.grupos_alimentos_modelo_itens (id_grupo, id_alimento, quantidade_g, descricao_porcao, ordem) values
    (v_id_grupo, 410, 110, '1 filé médio', 0),
    (v_id_grupo, 413, 95, '1 unidade grande', 1),
    (v_id_grupo, 277, 120, '7,5 colheres de sopa cheias', 2),
    (v_id_grupo, v_id_tilapia, 150, '1,5 filé médio', 3),
    (v_id_grupo, 326, 87.5, '3,5 colheres de sopa cheias', 4),
    (v_id_grupo, v_id_contrafile, 110, '1 bife médio', 5),
    (v_id_grupo, 2893, 110, '1 filé médio', 6),
    (v_id_grupo, 1338, 90, '2 bifes pequenos', 7),
    (v_id_grupo, 1493, 110, '1 fatia média', 8),
    (v_id_grupo, 1478, 55, '0,5 fatia média', 9);

  -- 4) Carboidratos (refeições principais)
  insert into public.grupos_alimentos_modelo (id_avaliador, titulo, kcal_alvo) values (null, 'Carboidratos (refeições principais)', 150) returning id into v_id_grupo;
  insert into public.grupos_alimentos_modelo_itens (id_grupo, id_alimento, quantidade_g, descricao_porcao, ordem) values
    (v_id_grupo, 1, 125, '5 colheres de sopa cheias', 0),
    (v_id_grupo, 91, 300, '10 colheres de sopa cheias', 1),
    (v_id_grupo, 88, 210, '5 colheres de sopa cheias', 2),
    (v_id_grupo, 94, 225, '9 colheres de sopa cheias', 3),
    (v_id_grupo, 793, 75, '1,5 colher de servir cheia', 4),
    (v_id_grupo, 542, 125, '2,5 colheres de servir cheias', 5),
    (v_id_grupo, 129, 120, '4 colheres de sopa cheias', 6),
    (v_id_grupo, 533, 140, '2 pedaços médios', 7);

  -- 5) Frutas
  insert into public.grupos_alimentos_modelo (id_avaliador, titulo, kcal_alvo) values (null, 'Frutas', 70) returning id into v_id_grupo;
  insert into public.grupos_alimentos_modelo_itens (id_grupo, id_alimento, quantidade_g, descricao_porcao, ordem) values
    (v_id_grupo, 163, 67.5, '1,5 colher de sopa cheia', 0),
    (v_id_grupo, 164, 150, '2 fatias médias', 1),
    (v_id_grupo, 182, 60, '2 unidades pequenas', 2),
    (v_id_grupo, 1082, 170, '1 unidade média', 3),
    (v_id_grupo, 208, 140, '1 unidade média', 4),
    (v_id_grupo, 222, 150, '1 unidade média', 5),
    (v_id_grupo, 226, 135, '0,5 unidade pequena', 6),
    (v_id_grupo, 231, 100, '0,5 unidade média', 7),
    (v_id_grupo, 235, 200, '2 fatias pequenas', 8),
    (v_id_grupo, 236, 230, '2 fatias grandes', 9),
    (v_id_grupo, 238, 135, '1 unidade média', 10),
    (v_id_grupo, v_id_morango, 240, '12 unidades grandes', 11),
    (v_id_grupo, 243, 130, '1 unidade média', 12),
    (v_id_grupo, 2501, 152, '4 colheres de sopa cheias', 13),
    (v_id_grupo, 1077, 120, '15 unidades médias', 14);

  -- 6) Oleaginosas e sementes
  insert into public.grupos_alimentos_modelo (id_avaliador, titulo, kcal_alvo) values (null, 'Oleaginosas e sementes', 75) returning id into v_id_grupo;
  insert into public.grupos_alimentos_modelo_itens (id_grupo, id_alimento, quantidade_g, descricao_porcao, ordem) values
    (v_id_grupo, 558, 10, '1 colher de sopa cheia', 0),
    (v_id_grupo, 3121, 10, '13 unidades', 1),
    (v_id_grupo, 588, 10, '5 unidades médias', 2),
    (v_id_grupo, 2638, 10, '3 unidades', 3),
    (v_id_grupo, 597, 10, '2 unidades', 4),
    (v_id_grupo, 622, 15, '1,5 colher de sobremesa rasa', 5),
    (v_id_grupo, 2753, 20, '1 colher de sopa', 6),
    (v_id_grupo, 2750, 15, '1,5 colher de sobremesa rasa', 7),
    (v_id_grupo, 2742, 15, '1 colher de sobremesa rasa', 8);

  -- 7) Leite e derivados
  insert into public.grupos_alimentos_modelo (id_avaliador, titulo, kcal_alvo) values (null, 'Leite e derivados', 120) returning id into v_id_grupo;
  insert into public.grupos_alimentos_modelo_itens (id_grupo, id_alimento, quantidade_g, descricao_porcao, ordem) values
    (v_id_grupo, 448, 235, '1,5 unidade média', 0),
    (v_id_grupo, 449, 290, '2,5 unidades médias', 1),
    (v_id_grupo, 2010, 25, '2,5 colheres de sobremesa cheias', 2),
    (v_id_grupo, 2011, 35, '3,5 colheres de sobremesa cheias', 3),
    (v_id_grupo, 2007, 200, '1 copo americano pequeno', 4),
    (v_id_grupo, 2057, 350, '2 copos americanos pequenos', 5),
    (v_id_grupo, 461, 45, '2 fatias pequenas', 6),
    (v_id_grupo, 2030, 35, '2 fatias médias', 7),
    (v_id_grupo, 468, 45, '1,5 colher de sopa cheia', 8),
    (v_id_grupo, 2081, 50, '2 colheres de sopa cheias', 9),
    (v_id_grupo, 469, 85, '3 fatias médias', 10),
    (v_id_grupo, 2890, 135, '5 colheres de sopa', 11),
    (v_id_grupo, v_id_creme_ricota, 85, '3,5 colheres de sopa', 12);

  -- 8) Leguminosas
  insert into public.grupos_alimentos_modelo (id_avaliador, titulo, kcal_alvo) values (null, 'Leguminosas', 55) returning id into v_id_grupo;
  insert into public.grupos_alimentos_modelo_itens (id_grupo, id_alimento, quantidade_g, descricao_porcao, ordem) values
    (v_id_grupo, 567, 70, '5 colheres de sopa cheias', 0),
    (v_id_grupo, 567, 70, '2,5 colheres de sopa cheias', 1),
    (v_id_grupo, 577, 60, '4 colheres de sopa', 2),
    (v_id_grupo, 577, 60, '1,5 colher de sopa cheia', 3),
    (v_id_grupo, 634, 30, '2 colheres de sopa rasas', 4),
    (v_id_grupo, 618, 65, '3 colheres de sopa cheias', 5),
    (v_id_grupo, 560, 75, '3 colheres de sopa cheias', 6),
    (v_id_grupo, 624, 30, '2 colheres de sopa cheias', 7);

  -- 9) Carboidratos (refeições intermediárias)
  insert into public.grupos_alimentos_modelo (id_avaliador, titulo, kcal_alvo) values (null, 'Carboidratos (refeições intermediárias)', 150) returning id into v_id_grupo;
  insert into public.grupos_alimentos_modelo_itens (id_grupo, id_alimento, quantidade_g, descricao_porcao, ordem) values
    (v_id_grupo, 2726, 45, '3 colheres de sopa cheias', 0),
    (v_id_grupo, 533, 130, '2 pedaços médios', 1),
    (v_id_grupo, 52, 60, '2,5 fatias médias', 2),
    (v_id_grupo, 53, 50, '1 unidade', 3),
    (v_id_grupo, 2100, 50, '2,5 unidades médias', 4),
    (v_id_grupo, 63, 40, '4 unidades', 5),
    (v_id_grupo, v_id_tortilha, 50, '1,5 unidade', 6),
    (v_id_grupo, 772, 45, '3,5 colheres de sopa cheias', 7),
    (v_id_grupo, 7, 40, '2,5 colheres de sopa cheias', 8),
    (v_id_grupo, v_id_farelo, 60, '5 colheres de sopa', 9),
    (v_id_grupo, 805, 40, '3,5 colheres de sopa', 10);
end $$;
