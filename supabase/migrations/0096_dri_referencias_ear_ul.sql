-- Completa a public.dri_referencias (migration 0055, que só tinha RDA/AI)
-- com EAR (Estimated Average Requirement) e UL (Tolerable Upper Intake
-- Level) — os dois valores que faltavam pra montar a "régua" de 4 zonas
-- da comparação de micronutrientes do plano alimentar (baixo / EAR-RDA /
-- adequado / acima do UL).
--
-- Fonte: Institute of Medicine / National Academies (mesma fonte já
-- citada na migration 0055), cruzando dois materiais — a tabela de DRI
-- enviada pelo usuário (Padovani et al., Rev. Nutr. 2006, que reproduz
-- as tabelas oficiais do IOM) e as Summary Tables do NCBI Bookshelf
-- (https://www.ncbi.nlm.nih.gov/books/NBK222881/). Cálcio e Vitamina D
-- usam os valores da revisão de 2011 (IOM, "Dietary Reference Intakes
-- for Calcium and Vitamin D"), coerente com o RDA já cadastrado em 0055
-- (que também já reflete essa revisão, não a AI de 1997).
--
-- Nutrientes sem EAR e/ou sem UL estabelecido pelo IOM ficam null nessa
-- coluna, de propósito — "prefiro coluna vazia a dado errado", mesmo
-- princípio usado na curadoria de tabela_alimentos: Cálcio/Vitamina D só
-- tem EAR (não têm menos que isso pra estabelecer); Vitamina K, Ácido
-- Pantotênico, Biotina, Cromo, Manganês, Potássio, Sódio não têm EAR
-- (só AI) nem UL estabelecido — pra sódio em especial, o controle de
-- excesso é orientação clínica corrente, não um UL fixado pelo IOM nessa
-- fonte. Colina e Magnésio têm UL só pra fonte suplementar (não conta
-- ingestão via alimento), mantido aqui como referência mesmo assim.
alter table public.dri_referencias
  add column if not exists ear numeric(10,3),
  add column if not exists ul numeric(10,3);

comment on column public.dri_referencias.ear is 'Estimated Average Requirement — necessidade média (atende 50% do grupo). Null quando o IOM não estabeleceu EAR pra esse nutriente.';
comment on column public.dri_referencias.ul is 'Tolerable Upper Intake Level — maior ingestão contínua sem risco. Null quando o IOM não estabeleceu UL pra esse nutriente.';

update public.dri_referencias d set
  ear = v.ear,
  ul = v.ul
from (values
  -- chave, sexo, idade_min, ear, ul
  -- Vitamina A (µg RAE) — UL é pra vitamina A pré-formada
  ('vitamina_a_mcg', 'M', 19, 625, 3000),
  ('vitamina_a_mcg', 'M', 31, 625, 3000),
  ('vitamina_a_mcg', 'M', 51, 625, 3000),
  ('vitamina_a_mcg', 'M', 71, 625, 3000),
  ('vitamina_a_mcg', 'F', 19, 500, 3000),
  ('vitamina_a_mcg', 'F', 31, 500, 3000),
  ('vitamina_a_mcg', 'F', 51, 500, 3000),
  ('vitamina_a_mcg', 'F', 71, 500, 3000),
  -- Vitamina C (mg)
  ('vitamina_c_mg', 'M', 19, 75, 2000),
  ('vitamina_c_mg', 'M', 31, 75, 2000),
  ('vitamina_c_mg', 'M', 51, 75, 2000),
  ('vitamina_c_mg', 'M', 71, 75, 2000),
  ('vitamina_c_mg', 'F', 19, 60, 2000),
  ('vitamina_c_mg', 'F', 31, 60, 2000),
  ('vitamina_c_mg', 'F', 51, 60, 2000),
  ('vitamina_c_mg', 'F', 71, 60, 2000),
  -- Vitamina D (µg) — revisão IOM 2011 (coerente com o RDA já em 0055)
  ('vitamina_d_mcg', 'M', 19, 10, 100),
  ('vitamina_d_mcg', 'M', 31, 10, 100),
  ('vitamina_d_mcg', 'M', 51, 10, 100),
  ('vitamina_d_mcg', 'M', 71, 10, 100),
  ('vitamina_d_mcg', 'F', 19, 10, 100),
  ('vitamina_d_mcg', 'F', 31, 10, 100),
  ('vitamina_d_mcg', 'F', 51, 10, 100),
  ('vitamina_d_mcg', 'F', 71, 10, 100),
  -- Vitamina E (mg, alfa-tocoferol)
  ('vitamina_e_mg', 'M', 19, 12, 1000),
  ('vitamina_e_mg', 'M', 31, 12, 1000),
  ('vitamina_e_mg', 'M', 51, 12, 1000),
  ('vitamina_e_mg', 'M', 71, 12, 1000),
  ('vitamina_e_mg', 'F', 19, 12, 1000),
  ('vitamina_e_mg', 'F', 31, 12, 1000),
  ('vitamina_e_mg', 'F', 51, 12, 1000),
  ('vitamina_e_mg', 'F', 71, 12, 1000),
  -- Tiamina B1 (mg) — sem UL
  ('tiamina_mg', 'M', 19, 1.0, null),
  ('tiamina_mg', 'M', 31, 1.0, null),
  ('tiamina_mg', 'M', 51, 1.0, null),
  ('tiamina_mg', 'M', 71, 1.0, null),
  ('tiamina_mg', 'F', 19, 0.9, null),
  ('tiamina_mg', 'F', 31, 0.9, null),
  ('tiamina_mg', 'F', 51, 0.9, null),
  ('tiamina_mg', 'F', 71, 0.9, null),
  -- Riboflavina B2 (mg) — sem UL
  ('riboflavina_mg', 'M', 19, 1.1, null),
  ('riboflavina_mg', 'M', 31, 1.1, null),
  ('riboflavina_mg', 'M', 51, 1.1, null),
  ('riboflavina_mg', 'M', 71, 1.1, null),
  ('riboflavina_mg', 'F', 19, 0.9, null),
  ('riboflavina_mg', 'F', 31, 0.9, null),
  ('riboflavina_mg', 'F', 51, 0.9, null),
  ('riboflavina_mg', 'F', 71, 0.9, null),
  -- Niacina B3 (mg, equivalentes de niacina)
  ('niacina_mg', 'M', 19, 12, 35),
  ('niacina_mg', 'M', 31, 12, 35),
  ('niacina_mg', 'M', 51, 12, 35),
  ('niacina_mg', 'M', 71, 12, 35),
  ('niacina_mg', 'F', 19, 11, 35),
  ('niacina_mg', 'F', 31, 11, 35),
  ('niacina_mg', 'F', 51, 11, 35),
  ('niacina_mg', 'F', 71, 11, 35),
  -- Vitamina B6 (mg)
  ('vitamina_b6_mg', 'M', 19, 1.1, 100),
  ('vitamina_b6_mg', 'M', 31, 1.1, 100),
  ('vitamina_b6_mg', 'M', 51, 1.4, 100),
  ('vitamina_b6_mg', 'M', 71, 1.4, 100),
  ('vitamina_b6_mg', 'F', 19, 1.1, 100),
  ('vitamina_b6_mg', 'F', 31, 1.1, 100),
  ('vitamina_b6_mg', 'F', 51, 1.3, 100),
  ('vitamina_b6_mg', 'F', 71, 1.3, 100),
  -- Folato (µg DFE)
  ('folato_mcg', 'M', 19, 320, 1000),
  ('folato_mcg', 'M', 31, 320, 1000),
  ('folato_mcg', 'M', 51, 320, 1000),
  ('folato_mcg', 'M', 71, 320, 1000),
  ('folato_mcg', 'F', 19, 320, 1000),
  ('folato_mcg', 'F', 31, 320, 1000),
  ('folato_mcg', 'F', 51, 320, 1000),
  ('folato_mcg', 'F', 71, 320, 1000),
  -- Vitamina B12 (µg) — sem UL
  ('vitamina_b12_mcg', 'M', 19, 2.0, null),
  ('vitamina_b12_mcg', 'M', 31, 2.0, null),
  ('vitamina_b12_mcg', 'M', 51, 2.0, null),
  ('vitamina_b12_mcg', 'M', 71, 2.0, null),
  ('vitamina_b12_mcg', 'F', 19, 2.0, null),
  ('vitamina_b12_mcg', 'F', 31, 2.0, null),
  ('vitamina_b12_mcg', 'F', 51, 2.0, null),
  ('vitamina_b12_mcg', 'F', 71, 2.0, null),
  -- Colina (mg) — sem EAR (só AI); UL só conta fonte suplementar
  ('colina_mg', 'M', 19, null, 3500),
  ('colina_mg', 'M', 31, null, 3500),
  ('colina_mg', 'M', 51, null, 3500),
  ('colina_mg', 'M', 71, null, 3500),
  ('colina_mg', 'F', 19, null, 3500),
  ('colina_mg', 'F', 31, null, 3500),
  ('colina_mg', 'F', 51, null, 3500),
  ('colina_mg', 'F', 71, null, 3500),
  -- Cálcio (mg) — revisão IOM 2011
  ('calcio_mg', 'M', 19, 800, 2500),
  ('calcio_mg', 'M', 31, 800, 2500),
  ('calcio_mg', 'M', 51, 800, 2000),
  ('calcio_mg', 'M', 71, 1000, 2000),
  ('calcio_mg', 'F', 19, 800, 2500),
  ('calcio_mg', 'F', 31, 800, 2500),
  ('calcio_mg', 'F', 51, 1000, 2000),
  ('calcio_mg', 'F', 71, 1000, 2000),
  -- Cobre (µg)
  ('cobre_mcg', 'M', 19, 700, 10000),
  ('cobre_mcg', 'M', 31, 700, 10000),
  ('cobre_mcg', 'M', 51, 700, 10000),
  ('cobre_mcg', 'M', 71, 700, 10000),
  ('cobre_mcg', 'F', 19, 700, 10000),
  ('cobre_mcg', 'F', 31, 700, 10000),
  ('cobre_mcg', 'F', 51, 700, 10000),
  ('cobre_mcg', 'F', 71, 700, 10000),
  -- Iodo (µg)
  ('iodo_mcg', 'M', 19, 95, 1100),
  ('iodo_mcg', 'M', 31, 95, 1100),
  ('iodo_mcg', 'M', 51, 95, 1100),
  ('iodo_mcg', 'M', 71, 95, 1100),
  ('iodo_mcg', 'F', 19, 95, 1100),
  ('iodo_mcg', 'F', 31, 95, 1100),
  ('iodo_mcg', 'F', 51, 95, 1100),
  ('iodo_mcg', 'F', 71, 95, 1100),
  -- Ferro (mg)
  ('ferro_mg', 'M', 19, 6, 45),
  ('ferro_mg', 'M', 31, 6, 45),
  ('ferro_mg', 'M', 51, 6, 45),
  ('ferro_mg', 'M', 71, 6, 45),
  ('ferro_mg', 'F', 19, 8.1, 45),
  ('ferro_mg', 'F', 31, 8.1, 45),
  ('ferro_mg', 'F', 51, 5, 45),
  ('ferro_mg', 'F', 71, 5, 45),
  -- Magnésio (mg) — UL é só pra fonte suplementar
  ('magnesio_mg', 'M', 19, 330, 350),
  ('magnesio_mg', 'M', 31, 350, 350),
  ('magnesio_mg', 'M', 51, 350, 350),
  ('magnesio_mg', 'M', 71, 350, 350),
  ('magnesio_mg', 'F', 19, 255, 350),
  ('magnesio_mg', 'F', 31, 265, 350),
  ('magnesio_mg', 'F', 51, 265, 350),
  ('magnesio_mg', 'F', 71, 265, 350),
  -- Manganês (mg) — sem EAR (só AI)
  ('manganes_mg', 'M', 19, null, 11),
  ('manganes_mg', 'M', 31, null, 11),
  ('manganes_mg', 'M', 51, null, 11),
  ('manganes_mg', 'M', 71, null, 11),
  ('manganes_mg', 'F', 19, null, 11),
  ('manganes_mg', 'F', 31, null, 11),
  ('manganes_mg', 'F', 51, null, 11),
  ('manganes_mg', 'F', 71, null, 11),
  -- Molibdênio (µg)
  ('molibdenio_mcg', 'M', 19, 34, 2000),
  ('molibdenio_mcg', 'M', 31, 34, 2000),
  ('molibdenio_mcg', 'M', 51, 34, 2000),
  ('molibdenio_mcg', 'M', 71, 34, 2000),
  ('molibdenio_mcg', 'F', 19, 34, 2000),
  ('molibdenio_mcg', 'F', 31, 34, 2000),
  ('molibdenio_mcg', 'F', 51, 34, 2000),
  ('molibdenio_mcg', 'F', 71, 34, 2000),
  -- Fósforo (mg)
  ('fosforo_mg', 'M', 19, 580, 4000),
  ('fosforo_mg', 'M', 31, 580, 4000),
  ('fosforo_mg', 'M', 51, 580, 4000),
  ('fosforo_mg', 'M', 71, 580, 3000),
  ('fosforo_mg', 'F', 19, 580, 4000),
  ('fosforo_mg', 'F', 31, 580, 4000),
  ('fosforo_mg', 'F', 51, 580, 4000),
  ('fosforo_mg', 'F', 71, 580, 3000),
  -- Selênio (µg)
  ('selenio_mcg', 'M', 19, 45, 400),
  ('selenio_mcg', 'M', 31, 45, 400),
  ('selenio_mcg', 'M', 51, 45, 400),
  ('selenio_mcg', 'M', 71, 45, 400),
  ('selenio_mcg', 'F', 19, 45, 400),
  ('selenio_mcg', 'F', 31, 45, 400),
  ('selenio_mcg', 'F', 51, 45, 400),
  ('selenio_mcg', 'F', 71, 45, 400),
  -- Zinco (mg)
  ('zinco_mg', 'M', 19, 9.4, 40),
  ('zinco_mg', 'M', 31, 9.4, 40),
  ('zinco_mg', 'M', 51, 9.4, 40),
  ('zinco_mg', 'M', 71, 9.4, 40),
  ('zinco_mg', 'F', 19, 6.8, 40),
  ('zinco_mg', 'F', 31, 6.8, 40),
  ('zinco_mg', 'F', 51, 6.8, 40),
  ('zinco_mg', 'F', 71, 6.8, 40)
  -- Vitamina K, Ácido Pantotênico, Biotina, Cromo, Manganês (EAR),
  -- Potássio e Sódio ficam sem EAR/UL — o IOM não estabeleceu (todos já
  -- null por padrão na coluna, nenhuma linha necessária aqui).
) as v(chave, sexo, idade_min, ear, ul)
where d.chave = v.chave and d.sexo = v.sexo and d.idade_min = v.idade_min;
