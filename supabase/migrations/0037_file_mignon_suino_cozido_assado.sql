-- Filé Mignon Suíno, Cozido(a) e Assado(a) — complementa o Cru(a) da
-- migration 0036.
--
-- Não existe tabela nutricional publicada (fabricante nem IBGE/TACO) pra
-- filé mignon suíno cozido/assado — a IBGE trata todos os preparos de
-- carne suína com o MESMO valor (sem diferenciar cru de cozido, uma
-- particularidade da fonte, não um dado real de cocção). Em vez de
-- repetir o valor do cru (que subestimaria bastante calorias/proteína
-- por 100g, já que cozinhar concentra o alimento pela perda de água),
-- derivamos aplicando o fator real de concentração da TACO pra peito de
-- frango SEM PELE — carne magra sem pele, com comportamento de cocção
-- comparável ao filé mignon suíno (outro corte magro, sem pele/gordura
-- de cobertura):
--   Cozido:  fator = TACO "peito de frango sem pele, cozido" ÷ "cru"
--            (kcal ×1,367 / proteína ×1,462 / lipídios ×1,046 / sódio
--            ×0,644 / colesterol ×1,508)
--   Assado:  fator = TACO "peito de frango sem pele, grelhado" ÷ "cru"
--            (calor seco, mais perto de assar do que cozinhar em água;
--            kcal ×1,336 / proteína ×1,488 / lipídios ×0,822 / sódio
--            ×0,895 / colesterol ×1,519)
-- Aplicado sobre o valor real do fabricante pro cru (106kcal/22g
-- proteína/2g lipídios/68mg sódio/31mg colesterol/1,4mg ferro por 100g).
-- Estimativa por derivação, não valor medido — mais preciso que repetir
-- o cru, mas se aparecer uma tabela nutricional real de algum fabricante
-- pro cozido/assado, substituir por ela.

insert into public.tabela_alimentos
  (nome, categoria, fonte, unidade_padrao, energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g, gorduras_saturadas_g, colesterol_mg, ferro_mg, sodio_mg)
values
  ('Filé Mignon Suíno, Cozido(a)', 'Carnes e derivados', 'Fabricante', 'g', 145, 32.2, 2.1, 0, 0, 1.0, 47, 2.0, 44),
  ('Filé Mignon Suíno, Assado(a)', 'Carnes e derivados', 'Fabricante', 'g', 142, 32.7, 1.6, 0, 0, 0.8, 47, 1.9, 61);
