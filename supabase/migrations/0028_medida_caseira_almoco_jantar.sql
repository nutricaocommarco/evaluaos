-- Medida caseira nos alimentos do dia a dia de almoço/jantar — arroz,
-- feijão, macarrão, farofa, purê e as carnes/frango mais prescritos.
-- Continuação das migrations 0026/0027, mesmo método (estimativa
-- profissional de peso médio, substituível pela Medida Caseira pessoal
-- de cada nutricionista via 0025).
--
-- Pra arroz/feijão/macarrão/farofa/purê, o "1 unidade" representa a
-- colher de sopa (ou concha, pro feijão) CHEIA daquele alimento
-- específico — não é o fator genérico de colher (~15g) que já existe
-- pra qualquer alimento, é o peso real de arroz/feijão/macarrão por
-- colher, que pesa diferente um do outro. O nutricionista continua
-- selecionando "Unidade(s)" no seletor de medida — o texto de apoio
-- avisa que ali representa "1 colher de sopa" ou "1 concha" daquele
-- alimento específico.

update public.tabela_alimentos as t
set
  medida_caseira_desc = v.medida_desc,
  medida_caseira_g = v.g
from (values
  -- ---------------------------------------------------------------------
  -- Arroz, feijão, macarrão, farofa, purê
  -- ---------------------------------------------------------------------
  ('TACO', 'Arroz, tipo 1, cozido', '1 colher de sopa cheia', 25),
  ('TACO', 'Arroz, tipo 2, cozido', '1 colher de sopa cheia', 25),
  ('TACO', 'Arroz, integral, cozido', '1 colher de sopa cheia', 25),
  ('TACO', 'Feijão, carioca, cozido', '1 concha média', 90),
  ('TACO', 'Feijão, preto, cozido', '1 concha média', 90),
  ('TACO', 'Feijão, fradinho, cozido', '1 concha média', 90),
  ('TACO', 'Feijão, jalo, cozido', '1 concha média', 90),
  ('TACO', 'Feijão, rajado, cozido', '1 concha média', 90),
  ('TACO', 'Feijão, rosinha, cozido', '1 concha média', 90),
  ('TACO', 'Feijão, roxo, cozido', '1 concha média', 90),
  ('IBGE', 'Arroz (polido, parboilizado, agulha, agulhinha, etc.)', '1 colher de sopa cheia', 25),
  ('IBGE', 'Arroz integral', '1 colher de sopa cheia', 25),
  ('IBGE', 'Feijão (preto, mulatinho, roxo, rosinha, etc.)', '1 concha média', 90),
  ('IBGE', 'Feijão-tropeiro', '1 colher de sopa cheia', 30),
  ('IBGE', 'Macarrão', '1 colher de sopa cheia', 25),
  ('IBGE', 'Macarrão, Cozido(a)', '1 colher de sopa cheia', 25),
  ('IBGE', 'Farofa', '1 colher de sopa cheia', 15),
  ('IBGE', 'Farofa pronta', '1 colher de sopa cheia', 15),
  ('IBGE', 'Purê de batata', '1 colher de sopa cheia', 30),

  -- ---------------------------------------------------------------------
  -- Carne moída, bife (unidade)
  -- ---------------------------------------------------------------------
  ('TACO', 'Carne, bovina, acém, moído, cozido', '1 colher de sopa cheia', 20),
  ('TACO', 'Carne, bovina, patinho, sem gordura, cru', '1 bife médio', 120),
  ('TACO', 'Carne, bovina, patinho, sem gordura, grelhado', '1 bife médio', 100),
  ('TACO', 'Carne, bovina, coxão mole, sem gordura, cozido', '1 bife médio', 100),
  ('TACO', 'Carne, bovina, coxão duro, sem gordura, cozido', '1 bife médio', 100),
  ('IBGE', 'Carne moída', '1 colher de sopa cheia', 20),
  ('IBGE', 'Carne moída, Cru(a)', '1 colher de sopa cheia', 25),
  ('IBGE', 'Carne moída, Cozido(a)', '1 colher de sopa cheia', 20),
  ('IBGE', 'Carne moída, Assado(a)', '1 colher de sopa cheia', 20),
  ('IBGE', 'Carne moída, Refogado(a)', '1 colher de sopa cheia', 20),
  ('IBGE', 'Carne moída, Frito(a)', '1 colher de sopa cheia', 20),

  -- ---------------------------------------------------------------------
  -- Frango (peito, coxa, sobrecoxa, em pedaços) — unidade
  -- ---------------------------------------------------------------------
  ('TACO', 'Frango, peito, sem pele, cru', '1 filé médio', 150),
  ('TACO', 'Frango, peito, sem pele, cozido', '1 filé médio', 100),
  ('TACO', 'Frango, peito, sem pele, grelhado', '1 filé médio', 100),
  ('TACO', 'Frango, peito, com pele, cru', '1 filé médio', 180),
  ('TACO', 'Frango, peito, com pele, assado', '1 filé médio', 120),
  ('TACO', 'Frango, coxa, com pele, crua', '1 unidade', 70),
  ('TACO', 'Frango, coxa, com pele, assada', '1 unidade', 55),
  ('TACO', 'Frango, coxa, sem pele, crua', '1 unidade', 60),
  ('TACO', 'Frango, coxa, sem pele, cozida', '1 unidade', 45),
  ('TACO', 'Frango, sobrecoxa, com pele, crua', '1 unidade', 120),
  ('TACO', 'Frango, sobrecoxa, com pele, assada', '1 unidade', 90),
  ('TACO', 'Frango, sobrecoxa, sem pele, crua', '1 unidade', 100),
  ('TACO', 'Frango, sobrecoxa, sem pele, assada', '1 unidade', 75),
  ('IBGE', 'Frango em pedaços', '1 pedaço', 80),
  ('IBGE', 'Frango em pedaços, Cru(a)', '1 pedaço', 100),
  ('IBGE', 'Frango em pedaços, Assado(a)', '1 pedaço', 80),
  ('IBGE', 'Frango em pedaços, Cozido(a)', '1 pedaço', 80),
  ('IBGE', 'Frango em pedaços, Grelhado(a)/brasa/churrasco', '1 pedaço', 80),
  ('IBGE', 'Frango em pedaços, Frito(a)', '1 pedaço', 80)
) as v(fonte, nome, medida_desc, g)
where t.fonte = v.fonte
  and t.nome = v.nome
  and t.medida_caseira_g is null;
