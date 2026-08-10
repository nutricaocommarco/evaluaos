-- Mais alimentos (Fase 6, continuação) — Bebidas Vegetais (leites de
-- castanha, amêndoa, aveia, coco), extraídos da Ficha Nutricional de
-- cada produto em casaspedro.com.br, mesmo método dos lotes anteriores
-- desta fase.
--
-- Mesma convenção: PÚBLICOS (id_avaliador null, fonte='Fabricante',
-- visível a todos os avaliadores), não editáveis pela tela.
--
-- Categoria toda em unidade_padrao='ml' (bebidas). Nenhum item excluído
-- neste lote — todas as 12 fichas bateram na conferência de sanidade
-- (soma de macros e energia consistentes).

insert into public.tabela_alimentos (
  nome, categoria, fonte, id_avaliador, unidade_padrao,
  energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g, acucares_g,
  gorduras_saturadas_g, gorduras_trans_g, sodio_mg
) values
  ('Bebida de Castanha de Caju Original A Tal da Castanha - 1l', 'Bebidas Vegetais', 'Fabricante', null, 'ml',
    48, 1.5, 4.0, 1.5, 0.7, 0.5, 0.7, 0, 0),
  ('Bebida de Castanha Choconuts A Tal da Castanha - 1l', 'Bebidas Vegetais', 'Fabricante', null, 'ml',
    75, 1.5, 3.7, 9.0, 0.6, 7.0, 0.8, 0, 0),
  ('Bebida de Amêndoa A Tal da Castanha - 1l', 'Bebidas Vegetais', 'Fabricante', null, 'ml',
    29, 1.0, 2.4, 0.9, 0.5, 0, 0.2, 0, 0),
  ('Bebida de Castanha Caju + Coco A Tal da Castanha - 1l', 'Bebidas Vegetais', 'Fabricante', null, 'ml',
    46, 1.3, 3.4, 2.6, 0, 0.5, 0.9, 0, 0),
  ('Bebida de Amêndoa Original Nuts - 1l', 'Bebidas Vegetais', 'Fabricante', null, 'ml',
    33, 0.6, 1.5, 4.6, 0.3, 4.1, 0.1, 0, 20),
  ('Água de Coco Integral Casas Pedro - 1l', 'Bebidas Vegetais', 'Fabricante', null, 'ml',
    22, 0, 0, 5.5, 0, 5.0, 0, 0, 0),
  ('Água de Coco Integral Casas Pedro - 300ml', 'Bebidas Vegetais', 'Fabricante', null, 'ml',
    22, 0, 0, 5.3, 0, 5.0, 0, 0, 0),
  ('Bebida de Aveia Orgânico Baunilha Nude - 1l', 'Bebidas Vegetais', 'Fabricante', null, 'ml',
    49, 2.0, 0.8, 8.5, 0.3, 5.5, 0.1, 0, 42),
  ('Bebida de Aveia Tudão Nude - 1l', 'Bebidas Vegetais', 'Fabricante', null, 'ml',
    45, 4.0, 0.9, 5.0, 3.3, 0.4, 0.3, 0, 60),
  ('Bebida de Amêndoa Original Zero Nuts - 1l', 'Bebidas Vegetais', 'Fabricante', null, 'ml',
    23, 1.0, 1.9, 0.5, 0, 0, 0, 0, 5.5),
  ('Bebida Nuts de Coco - 1l', 'Bebidas Vegetais', 'Fabricante', null, 'ml',
    32, 0, 0, 7.5, 0, 0, 0, 0, 0),
  ('Bebida de Aveia A Tal da Castanha - 1l', 'Bebidas Vegetais', 'Fabricante', null, 'ml',
    38, 0, 0.6, 8.0, 0, 0, 0, 0, 50);
