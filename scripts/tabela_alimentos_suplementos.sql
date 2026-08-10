-- Suplementos comuns (Whey, barras, YoPRO, albumina, etc.), catados via
-- busca web em sites de varejo/nutrição e no Tabela TACO Online
-- (tabelatacoonline.com.br), NÃO de uma fonte única e verificada como a
-- TACO/IBGE. A pedido do usuário, entram PÚBLICOS (id_avaliador null,
-- fonte='Fabricante', visível a todos os avaliadores) — rode a migration
-- 0004 ANTES deste arquivo, ela libera 'Fabricante' no check de fonte.
--
-- Diferente da TACO/IBGE/Customizado, estes NÃO ficam editáveis pela tela
-- (a RLS de update/delete exige id_avaliador = auth.uid(), que aqui é
-- null) — qualquer correção futura precisa ser um novo UPDATE/DELETE SQL
-- direto no Supabase.
--
-- Itens marcados com [ASSUMIDO 30g] tinham a informação nutricional na
-- página de origem por "dose"/"dosador" sem o peso exato declarado — usei
-- 30g (dose padrão da maioria dos whey) pra normalizar por 100g. Confira
-- contra o rótulo real se usar esse produto específico.

insert into public.tabela_alimentos (
  nome, categoria, fonte, id_avaliador, unidade_padrao,
  energia_kcal, proteina_g, lipidios_g, carboidrato_g
) values
  ('YoPRO Bebida Láctea 25g Proteína, Chocolate, 250ml', 'Suplementos', 'Fabricante', null, 'ml',
    74, 10, 1.1, 5.7),

  ('Whey Protein Concentrado Growth, sabor Natural', 'Suplementos', 'Fabricante', null, 'g',
    410, 76.7, 6.7, 11.0),

  ('Whey Protein Concentrado Growth, sabor Chocolate', 'Suplementos', 'Fabricante', null, 'g',
    426.7, 73.3, 8.3, 14.0),

  ('Whey Protein Concentrado Growth, sabor Caramelo', 'Suplementos', 'Fabricante', null, 'g',
    127, 23, 2, 4.2),

  ('Whey Protein Concentrado Growth, sabor Baunilha', 'Suplementos', 'Fabricante', null, 'g',
    127, 23, 2, 4.2),

  ('Whey Protein Isolado Growth, sabor Natural [ASSUMIDO 30g]', 'Suplementos', 'Fabricante', null, 'g',
    390, 90.0, 0, 6.7),

  ('Barra de Proteína Growth, sabor Cookies and Cream', 'Suplementos', 'Fabricante', null, 'g',
    118, 9, 2.8, 14),

  ('Whey Protein Dr Peanut 100% Whey Max Titanium, sabor Avelã', 'Suplementos', 'Fabricante', null, 'g',
    162, 20, 3.1, 13),

  ('100% Whey Max Titanium, sabor Chocolate', 'Suplementos', 'Fabricante', null, 'g',
    130, 21, 2.6, 5.6),

  ('Top Whey 3W+ Max Titanium, sabor Leite', 'Suplementos', 'Fabricante', null, 'g',
    163, 26, 2.8, 8.5),

  ('3W Whey Protein Growth, sabor Chocolate', 'Suplementos', 'Fabricante', null, 'g',
    114, 24, 1.5, 1.6),

  ('Medium Whey Protein Growth, sabor Chocolate', 'Suplementos', 'Fabricante', null, 'g',
    125, 17, 1.9, 10),

  ('Albumina Growth, sabor Natural', 'Suplementos', 'Fabricante', null, 'g',
    104, 24, 0, 2),

  ('Albumina Growth, sabor Banana', 'Suplementos', 'Fabricante', null, 'g',
    104, 23, 0, 3),

  ('Blend Vegano Growth, sabor Natural', 'Suplementos', 'Fabricante', null, 'g',
    98, 22, 1, 0.2),

  ('Whey Protein Isolado Integralmédica, sabor Morango [ASSUMIDO 30g]', 'Suplementos', 'Fabricante', null, 'g',
    370, 86.7, 0, 6.7),

  ('Maltodextrina (genérica)', 'Suplementos', 'Fabricante', null, 'g',
    380, 0, 0, 95);
