-- Mais suplementos (Fase 6) — extraídos da Ficha Nutricional de cada
-- produto em casaspedro.com.br (varejo, não uma fonte única/verificada
-- como TACO/IBGE). Valores por 100g/100ml já vêm prontos na própria ficha
-- do fabricante — não precisou estimar por dose como no lote anterior
-- (tabela_alimentos_suplementos.sql).
--
-- Mesma convenção do lote anterior: entram PÚBLICOS (id_avaliador null,
-- fonte='Fabricante', categoria='Suplementos', visível a todos os
-- avaliadores) — não editáveis pela tela (RLS de update/delete exige
-- id_avaliador = auth.uid()); correção futura é UPDATE/DELETE direto no
-- Supabase.
--
-- Diferente do lote anterior, aqui a ficha do site já trazia fibra,
-- açúcares, gorduras saturadas/trans e sódio pra quase todo produto —
-- populados também, não só os 4 macros básicos.
--
-- Creatina pura e pré-treino aparecem com proteína/gordura zeradas (e
-- creatina com energia zerada) porque é o valor real declarado na ficha
-- do fabricante, não erro de captura.

insert into public.tabela_alimentos (
  nome, categoria, fonte, id_avaliador, unidade_padrao,
  energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g, acucares_g,
  gorduras_saturadas_g, gorduras_trans_g, sodio_mg
) values
  ('Whey Protein Isofort Baunilha Vitafor - 900g', 'Suplementos', 'Fabricante', null, 'g',
    363, 87, 0, 4.3, 0, 2.3, 0, 0, 127),

  ('Whey Protein Isolate Definition Body Action Chocolate - 900g', 'Suplementos', 'Fabricante', null, 'g',
    387, 87, 0, 6.0, 0, 2.0, 0, 0, 440),

  ('Barra Whey Grego Bar Morango Nutrata - 40g', 'Suplementos', 'Fabricante', null, 'g',
    433, 28, 19, 38, 2.5, 10, 13, 0, 225),

  ('Isolate Prime Whey Sabor Morango Body Action - 900g', 'Suplementos', 'Fabricante', null, 'g',
    353, 83, 0, 5.0, 0, 0, 0, 0, 177),

  ('Isolate Prime Whey Baunilha Body Action - 900g', 'Suplementos', 'Fabricante', null, 'g',
    353, 83, 0, 5.0, 0, 0, 0, 0, 177),

  ('Barra Protobar Avelã Whey Nutrata - 70g', 'Suplementos', 'Fabricante', null, 'g',
    451, 27, 23, 33, 5.0, 5.7, 14, 0, 157),

  ('Barra Whey Grego Doce de Leite Havanna Nutrata - 40g', 'Suplementos', 'Fabricante', null, 'g',
    420, 28, 16, 40, 2.5, 20, 11, 0, 225),

  ('Isolate Prime Whey Chocolate Body Action - 900g', 'Suplementos', 'Fabricante', null, 'g',
    353, 83, 0, 5.0, 0, 0, 0, 0, 177),

  ('Bebida Whey Doce de Leite 3 Corações - 250ml', 'Suplementos', 'Fabricante', null, 'ml',
    66, 6.0, 1.1, 8.0, 0.5, 7.2, 0.7, 0, 165),

  ('Bebida Whey Chocolate 3 Corações - 250ml', 'Suplementos', 'Fabricante', null, 'ml',
    66, 6.0, 1.1, 8.0, 0.7, 7.2, 0.7, 0, 165),

  ('Whey Body Baunilha Body Action - 900g', 'Suplementos', 'Fabricante', null, 'g',
    378, 25, 1.3, 67, 0.2, 18, 0.7, 0, 204),

  ('W-100 Whey Doce de Leite Havanna Nutrata - 900g', 'Suplementos', 'Fabricante', null, 'g',
    380, 67, 6.7, 13, 0, 10, 3.7, 0, 307),

  ('Granola Whey Caramelo e Amêndoa Zero Vitalin - 180g', 'Suplementos', 'Fabricante', null, 'g',
    370, 21, 9.5, 45, 5.5, 0, 1.8, 0, 50),

  ('Whey Protein Concentrado Dux Baunilha - 900g', 'Suplementos', 'Fabricante', null, 'g',
    407, 67, 7.0, 19, 0, 0, 4.3, 0, 380),

  ('Whey Protein Body Action 100% Whey Prime Morango - 900g', 'Suplementos', 'Fabricante', null, 'g',
    383, 70, 4.0, 17, 0, 0, 0, 0, 177),

  ('Whey Protein Dux Isolado Cookies - 30g', 'Suplementos', 'Fabricante', null, 'g',
    375, 86, 2.1, 2.9, 0, 2.1, 1.1, 0, 421),

  ('Whey Protein Body Action 100% Whey Prime Chocolate - 900g', 'Suplementos', 'Fabricante', null, 'g',
    423, 73, 6.0, 19, 0, 12, 0, 0, 217),

  ('Whey Protein Body Action 100% Whey Prime Leite Condensado - 900g', 'Suplementos', 'Fabricante', null, 'g',
    383, 70, 4.0, 17, 0, 9.0, 0, 0, 177),

  ('Barrinha Crisp Bar Trufa de Avelã Integralmédica - 45g', 'Suplementos', 'Fabricante', null, 'g',
    427, 29, 16, 42, 5.3, 24, 7.6, 0, 118),

  ('Barrinha Crisp Bar Peanut Butter Integralmédica - 45g', 'Suplementos', 'Fabricante', null, 'g',
    422, 31, 17, 38, 6.4, 19, 8.4, 0, 184),

  ('Barrinha Crisp Bar Leite em Pó com Avelã Integralmédica - 45g', 'Suplementos', 'Fabricante', null, 'g',
    431, 31, 18, 42, 2.2, 21, 9.8, 0, 149),

  ('Crisp Bar Cookies and Cream Integralmédica - 45g', 'Suplementos', 'Fabricante', null, 'g',
    429, 27, 18, 44, 2.7, 18, 9.8, 0, 129),

  ('Hipercalórico C/Whey - 100g', 'Suplementos', 'Fabricante', null, 'g',
    240, 7.0, 0, 51, 0.3, 5.4, 0, 0, 58),

  ('Whey Protein Bold Milkshake de Baunilha - 30g', 'Suplementos', 'Fabricante', null, 'g',
    390, 73, 6.7, 9.0, 0.7, 7.7, 4.0, 0, 160),

  ('Whey Protein Bold Cookies and Cream - 30g', 'Suplementos', 'Fabricante', null, 'g',
    403, 73, 7.0, 11, 1.0, 7.7, 4.3, 0, 163),

  ('Whey Protein Bold Chocolate ao Leite - 30g', 'Suplementos', 'Fabricante', null, 'g',
    393, 73, 6.7, 9.0, 2.3, 7.3, 4.3, 0, 153),

  ('Whey Protein Bold Milkshake de Morango - 30g', 'Suplementos', 'Fabricante', null, 'g',
    400, 73, 6.3, 12, 1.3, 7.3, 4.0, 0, 160),

  ('Whey Protein 100% Pure Pouch Chocolate - 900g', 'Suplementos', 'Fabricante', null, 'g',
    407, 70, 6.7, 20, 0, 10, 3.3, 0, 217),

  ('Barra Whey Doce de Leite Havanna Zero Açúcar - 40g', 'Suplementos', 'Fabricante', null, 'g',
    398, 28, 15, 38, 1.3, 6.3, 10, 0, 225),

  ('Barra Whey Grego Brownie com Doce de Leite Nutrata - 40g', 'Suplementos', 'Fabricante', null, 'g',
    393, 28, 15, 35, 6.3, 23, 13, 0, 313),

  ('Whey Protein Bold Doce de Leite - 30g', 'Suplementos', 'Fabricante', null, 'g',
    407, 73, 6.0, 15, 0, 7.3, 4.0, 0, 153),

  ('Chocowheyfer +mu Chocolate - 25g', 'Suplementos', 'Fabricante', null, 'g',
    500, 24, 32, 40, 4.0, 1.6, 18, 0, 224),

  ('Chocowheyfer +mu Cookies - 25g', 'Suplementos', 'Fabricante', null, 'g',
    504, 24, 32, 40, 4.0, 1.6, 17, 0, 220),

  ('Whey High Protein Baunilha Absolut - 900g', 'Suplementos', 'Fabricante', null, 'g',
    380, 58, 2.5, 33, 0, 21, 0.8, 0, 518),

  ('Creatina Monohidratada Max Titanium - 150g', 'Suplementos', 'Fabricante', null, 'g',
    0, 0, 0, 0, 0, 0, 0, 0, 0),

  ('Creatina Monohidratada Integralmédica - 150g', 'Suplementos', 'Fabricante', null, 'g',
    0, 0, 0, 0, 0, 0, 0, 0, 0),

  ('Creatina Monohidratada Nutrata - 300g', 'Suplementos', 'Fabricante', null, 'g',
    0, 0, 0, 0, 0, 0, 0, 0, 0),

  ('Creatina Sanavita - 300g', 'Suplementos', 'Fabricante', null, 'g',
    0, 0, 0, 0, 0, 0, 0, 0, 0),

  ('Creatina 100% Monohidratada Pura Black Skull - 300g', 'Suplementos', 'Fabricante', null, 'g',
    0, 0, 0, 0, 0, 0, 0, 0, 0),

  ('Creatina em Pó 100% Pura Viva+ - 300g', 'Suplementos', 'Fabricante', null, 'g',
    0, 0, 0, 0, 0, 0, 0, 0, 0),

  ('Creatina 100% Pura Viva+ - 150g', 'Suplementos', 'Fabricante', null, 'g',
    0, 0, 0, 0, 0, 0, 0, 0, 0),

  ('Refil Creatina Monohidratada Nutrata - 300g', 'Suplementos', 'Fabricante', null, 'g',
    0, 0, 0, 0, 0, 0, 0, 0, 0),

  ('Pré-Treino Limão Viva+ - 150g', 'Suplementos', 'Fabricante', null, 'g',
    170, 0, 0, 43, 0, 3.0, 0, 0, 0),

  ('Pré-Treino Frutas Vermelhas Viva+ - 150g', 'Suplementos', 'Fabricante', null, 'g',
    170, 0, 0, 43, 0, 3.0, 0, 0, 0),

  ('Pré-Treino Bope Frutas Vermelhas Black Skull - 150g', 'Suplementos', 'Fabricante', null, 'g',
    180, 0, 0, 44, 0, 0, 0, 0, 0),

  ('Suplemento de L-Glutamina Viva+ - pó', 'Suplementos', 'Fabricante', null, 'g',
    0, 100, 0, 0, 0, 0, 0, 0, 0);
