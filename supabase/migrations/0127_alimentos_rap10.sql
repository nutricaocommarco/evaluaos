-- Adiciona os 4 produtos da linha Rap10 (Bimbo/Pullman) na Tabela de
-- Alimentos como itens OFICIAIS (id_avaliador = null), visíveis pra todos
-- os nutricionistas — mesmo padrão de tabela_alimentos/grupos_alimentos
-- oficiais já usado no sistema (RLS bloqueia insert com id_avaliador=null
-- por uma sessão autenticada normal, por isso este arquivo precisa ser
-- rodado direto no SQL Editor do Supabase).
--
-- Valores por 100g, calculados a partir da porção de 40g impressa no
-- rótulo (informação nutricional oficial do fabricante) — conferido em
-- pelo menos 2 fontes independentes por produto (Doce Malu, Pão de
-- Açúcar, FatSecret, Open Food Facts). Rap10 Chocolate veio direto do
-- Open Food Facts já por 100g (scan do rótulo).
--
-- Nutrientes não confirmados em nenhuma fonte (ex: açúcares/gordura trans
-- do Fit) ficam null — melhor faltar do que inventar.
--
-- "fonte" só aceita TACO/IBGE/USDA/Customizado (check constraint da
-- tabela) — usa 'Customizado' pra todos, já que não é nenhuma base
-- oficial; a origem real (rótulo do fabricante) fica documentada aqui em
-- cima, não no banco.

insert into public.tabela_alimentos (
  id_avaliador, nome, categoria, fonte,
  energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g, acucares_g,
  gorduras_saturadas_g, gorduras_trans_g, sodio_mg,
  medida_caseira_desc, medida_caseira_g, medida_caseira_unidade
) values
  (
    null, 'Rap10 Tradicional (Bimbo)', 'Pães e tortillas', 'Customizado',
    275, 8.25, 7, 45, 2.75, 2,
    3.75, 0, 395,
    '1 unidade', 40, 'unidade'
  ),
  (
    null, 'Rap10 Integral (Bimbo)', 'Pães e tortillas', 'Customizado',
    272.5, 7.25, 7.75, 42.5, 6, 0.25,
    4, 0, 397.5,
    '1 unidade', 40, 'unidade'
  ),
  (
    null, 'Rap10 Fit (Bimbo)', 'Pães e tortillas', 'Customizado',
    252.5, 7, 2, 52.5, 9.5, null,
    1.25, null, 430,
    '1 unidade', 40, 'unidade'
  ),
  (
    null, 'Rap10 Chocolate (Bimbo)', 'Pães e tortillas', 'Customizado',
    265, 7.8, 6.1, 45, 3.8, 9.4,
    3.3, null, 324,
    '1 unidade', 40, 'unidade'
  );
