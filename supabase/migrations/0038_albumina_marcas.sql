-- Albumina (proteína de clara de ovo em pó) de marcas ainda não cadastradas.
-- Já tínhamos Albumina Growth (sabor Natural/Banana), mas cadastrada por
-- porção/scoop, não por 100g (padrão diferente do resto da base). As três
-- novas abaixo seguem o padrão real da base (valores por 100g), extraídas
-- do tabeladealimentos.com.br (fonte = Fabricante).
--
-- Sódio varia bastante entre marcas (Saltos e Naturovos têm sódio alto,
-- Fama não informa/zerado no rótulo de origem) — mantido como está na
-- fonte, sem ajuste.

insert into public.tabela_alimentos
  (nome, categoria, fonte, unidade_padrao, energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g, sodio_mg)
values
  ('Albumina em Pó, Saltos', 'Suplementos', 'Fabricante', 'g', 385, 78.5, 0, 7, 0, 1278),
  ('Albumina em Pó, Fama', 'Suplementos', 'Fabricante', 'g', 392, 81, 0, 7, 0, 0),
  ('Albumina em Pó, Naturovos', 'Suplementos', 'Fabricante', 'g', 364, 84, 0, 5, 0, 1014);
