-- Novo lote de alimentos de marca (fonte = Fabricante), pesquisados no
-- extramercado.com.br: iogurtes zero/light de marcas comuns em dietas
-- (Pense Zero/Batavo, Danone, Molico/Nestlé, Itambé, YoPro, Verde
-- Campo), bebidas proteicas (Qualitá Whey, 3 Corações Power, Verde
-- Campo Whey), queijo cottage e filé mignon suíno — nenhum desses
-- estava cadastrado ainda (TACO/IBGE só têm iogurte genérico, sem as
-- versões zero/light de marca, e não têm filé mignon suíno específico).
--
-- Valores extraídos da tabela nutricional oficial de cada produto
-- (rótulo do fabricante, via extramercado.com.br) e convertidos pra
-- padrão 100g/100ml — mesma convenção já usada em toda a tabela_alimentos.
-- medida_caseira_g/medida_caseira_unidade seguem o mesmo princípio já
-- usado no resto da base: o peso da embalagem/porção vale especificamente
-- pra UNIDADE (frasco/pote/copo/caixinha) cadastrada, não um fator
-- genérico.

insert into public.tabela_alimentos
  (nome, categoria, fonte, unidade_padrao, medida_caseira_desc, medida_caseira_g, medida_caseira_unidade,
   energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g, acucares_g, gorduras_saturadas_g, colesterol_mg, calcio_mg, ferro_mg, sodio_mg)
values
  -- Iogurtes zero/light (Leite e derivados)
  ('Iogurte Desnatado Morango Zero Lactose, Batavo Pense Zero', 'Leite e derivados', 'Fabricante', 'g', '1 frasco', 170, 'unidade', 15.3, 1.6, 0, 2.1, 0, 2.1, 0, null, 62.4, null, 26.5),
  ('Iogurte Semidesnatado Natural Zero Lactose, Danone', 'Leite e derivados', 'Fabricante', 'g', '1 copo', 160, 'unidade', 35, 3.9, 1.0, 3.4, 0, 3.4, 0.4, null, 135, null, 54.4),
  ('Iogurte Desnatado Morango Zero Lactose, Molico (Nestlé)', 'Leite e derivados', 'Fabricante', 'g', '1 embalagem', 170, 'unidade', 15.3, 1.5, 0, 2.3, 0, 1.8, 0, null, 105.9, null, 22.9),
  ('Iogurte Desnatado Morango Zero Lactose 25g Proteína, YoPro', 'Leite e derivados', 'Fabricante', 'g', '1 pote', 160, 'unidade', 32.5, 5.9, 0, 2.25, 0, 1.9, 0, null, 63.1, null, 26.9),
  ('Iogurte Desnatado Morango Zero Lactose com Pedaços, Batavo Pense Zero', 'Leite e derivados', 'Fabricante', 'g', '1 copo', 100, 'unidade', 40, 4, 0, 6, 0, null, 0, null, 135, null, 50),
  ('Iogurte Mamão Zero Lactose sem Adição de Açúcar, Batavo Pense Zero', 'Leite e derivados', 'Fabricante', 'g', '1 frasco', 170, 'unidade', 15.9, 1.6, 0, 2.4, 0, 2.2, 0, null, 62.4, null, 26.5),
  ('Iogurte Líquido Light de Morango, Itambé Fit', 'Leite e derivados', 'Fabricante', 'g', '1 unidade', 170, 'unidade', 15.3, 1.8, 0, 2.0, 0.5, 1.8, 0, null, 64.7, null, 20.6),

  -- Bebidas proteicas / lácteas whey (Suplementos)
  ('Bebida Láctea UHT Chocolate Zero Lactose Whey, Qualitá', 'Suplementos', 'Fabricante', 'ml', '1 caixinha', 250, 'unidade', 23.2, 2.4, 0.12, 3.1, 0.2, 2.7, 0.08, 0.9, 77.6, null, 58),
  ('Bebida Láctea UHT Morango Zero Lactose Whey, Qualitá', 'Suplementos', 'Fabricante', 'ml', '1 caixinha', 250, 'unidade', 22.8, 2.4, 0.08, 3.0, 0, 2.7, 0.04, 0.9, 80.4, null, 58),
  ('Bebida Láctea Cappuccino Power Whey 15g Proteína, 3 Corações', 'Suplementos', 'Fabricante', 'ml', '1 unidade', 260, 'unidade', 24.6, 2.2, 1.1, 3.0, 0, 2.7, 0.3, 4.6, null, null, 188.8),
  ('Iogurte Desnatado Morango Zero Lactose Natural Whey 15g Proteína, Verde Campo', 'Leite e derivados', 'Fabricante', 'g', '1 frasco', 250, 'unidade', 20.4, 2.4, 0.2, 2.2, 0, 2.2, 0.12, null, 58.8, null, 27.2),

  -- Carnes (Carnes e derivados)
  ('Filé Mignon Suíno, Cru(a)', 'Carnes e derivados', 'Fabricante', 'g', null, null, null, 106, 22, 2, 0, 0, null, 1, 31, null, 1.4, 68),

  -- Queijo cottage (Leite e derivados) — porção do rótulo é "2 colheres
  -- de sopa" = 50g; medida_caseira registrada por 1 colher (25g), igual
  -- ao padrão já usado pro resto da base.
  ('Queijo Cottage, Tirolez', 'Leite e derivados', 'Fabricante', 'g', '1 colher de sopa cheia', 25, 'colher_sopa', 90, 11.6, 3.6, 2.6, 0, null, 2.2, 13.4, null, null, 362),
  ('Queijo Cottage Zero Lactose, Verde Campo Lacfree', 'Leite e derivados', 'Fabricante', 'g', '1 colher de sopa cheia', 25, 'colher_sopa', 212, 20, 12, 5.8, 0, 5.8, 7.8, null, 206, null, 706);
