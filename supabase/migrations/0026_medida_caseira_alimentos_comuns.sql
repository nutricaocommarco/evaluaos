-- Medida caseira nos alimentos oficiais mais comuns (ovo, banana, maçã,
-- pão, batata, etc.) — a TACO/IBGE só trazem valores por 100g, nunca peso
-- por unidade (só tabelas pagas trazem isso). Sem essa coluna preenchida,
-- "Unidade(s)" (ver migration 0025) não tinha como calcular os gramas
-- sozinho pros alimentos oficiais, e o nutricionista precisava saber de
-- cabeça quanto pesa "1 ovo" ou "1 banana".
--
-- Os valores abaixo são estimativas profissionais de peso médio por
-- unidade (referências usuais de nutrição — ex: Tabela de Medidas
-- Caseiras, Philippi), não vêm de nenhuma base oficial (porque essa base
-- não existe de graça). É um primeiro lote cobrindo os alimentos mais
-- prescritos por unidade: ovos, frutas inteiras, pães e alguns
-- legumes/tubérculos — a cauda longa de pratos prontos, preparações
-- combinadas (ex: "Cebola, Ao vinagrete") e frutas normalmente fatiadas
-- (mamão, melancia, melão) ficou de fora de propósito, porque forçar uma
-- "unidade" nelas confundiria mais do que ajudaria.
--
-- Qualquer nutricionista pode corrigir um valor individual sem precisar
-- de outra migration: usa a "Medida caseira" (pessoal) em Tabela de
-- Alimentos > alimento oficial > Medida caseira (migration 0025) — a
-- anotação pessoal dele sempre tem prioridade sobre o valor abaixo.
--
-- `and medida_caseira_g is null` é só uma trava de segurança — hoje
-- nenhum alimento oficial tem isso preenchido, então não sobrescreve nada.

update public.tabela_alimentos as t
set
  medida_caseira_desc = v.medida_desc,
  medida_caseira_g = v.g
from (values
  -- ---------------------------------------------------------------------
  -- Ovos
  -- ---------------------------------------------------------------------
  ('TACO', 'Ovo, de codorna, inteiro, cru', '1 unidade', 10),
  ('TACO', 'Ovo, de galinha, clara, cozida/10minutos', '1 unidade (clara)', 33),
  ('TACO', 'Ovo, de galinha, gema, cozida/10minutos', '1 unidade (gema)', 17),
  ('TACO', 'Ovo, de galinha, inteiro, cozido/10minutos', '1 unidade média', 50),
  ('TACO', 'Ovo, de galinha, inteiro, cru', '1 unidade média', 50),
  ('TACO', 'Ovo, de galinha, inteiro, frito', '1 unidade média', 50),
  ('IBGE', 'Ovo de codorna', '1 unidade', 10),
  ('IBGE', 'Ovo de codorna, Cozido(a)', '1 unidade', 10),
  ('IBGE', 'Ovo de codorna, Cru(a)', '1 unidade', 10),
  ('IBGE', 'Ovo de codorna, Frito(a)', '1 unidade', 10),
  ('IBGE', 'Ovo de galinha', '1 unidade média', 50),
  ('IBGE', 'Ovo de galinha, Assado(a)', '1 unidade média', 50),
  ('IBGE', 'Ovo de galinha, Cozido(a)', '1 unidade média', 50),
  ('IBGE', 'Ovo de galinha, Cru(a)', '1 unidade média', 50),
  ('IBGE', 'Ovo de galinha, Frito(a)', '1 unidade média', 50),

  -- ---------------------------------------------------------------------
  -- Bananas
  -- ---------------------------------------------------------------------
  ('TACO', 'Banana, prata, crua', '1 unidade média', 65),
  ('TACO', 'Banana, nanica, crua', '1 unidade média', 100),
  ('TACO', 'Banana, maçã, crua', '1 unidade média', 70),
  ('TACO', 'Banana, ouro, crua', '1 unidade pequena', 30),
  ('TACO', 'Banana, da terra, crua', '1 unidade grande', 130),
  ('TACO', 'Banana, figo, crua', '1 unidade pequena', 40),
  ('TACO', 'Banana, pacova, crua', '1 unidade grande', 150),
  ('IBGE', 'Banana (ouro, prata, d´água, da terra, etc.)', '1 unidade média', 80),
  ('IBGE', 'Banana (ouro, prata, d´água, da terra, etc.), Cru(a)', '1 unidade média', 80),
  ('IBGE', 'Banana (ouro, prata, d´água, da terra, etc.), Cozido(a)', '1 unidade média', 80),
  ('IBGE', 'Banana (ouro, prata, d´água, da terra, etc.), Assado(a)', '1 unidade média', 80),
  ('IBGE', 'Banana (ouro, prata, d´água, da terra, etc.), Com manteiga/óleo', '1 unidade média', 80),
  ('IBGE', 'Banana (ouro, prata, d´água, da terra, etc.), Frito(a)', '1 unidade média', 80),

  -- ---------------------------------------------------------------------
  -- Maçã, laranja e outras frutas inteiras
  -- ---------------------------------------------------------------------
  ('TACO', 'Maçã, Fuji, com casca, crua', '1 unidade média', 130),
  ('TACO', 'Maçã, Argentina, com casca, crua', '1 unidade média', 130),
  ('TACO', 'Laranja, baía, crua', '1 unidade média', 150),
  ('TACO', 'Laranja, pêra, crua', '1 unidade média', 150),
  ('TACO', 'Laranja, lima, crua', '1 unidade média', 150),
  ('TACO', 'Laranja, da terra, crua', '1 unidade média', 150),
  ('TACO', 'Laranja, valência, crua', '1 unidade média', 150),
  ('TACO', 'Tangerina, Poncã, crua', '1 unidade média', 100),
  ('TACO', 'Limão, tahiti, cru', '1 unidade média', 70),
  ('TACO', 'Goiaba, branca, com casca, crua', '1 unidade média', 170),
  ('TACO', 'Goiaba, vermelha, com casca, crua', '1 unidade média', 170),
  ('TACO', 'Kiwi, cru', '1 unidade média', 80),
  ('TACO', 'Morango, cru', '1 unidade', 12),
  ('TACO', 'Pêssego, Aurora, cru', '1 unidade média', 130),
  ('TACO', 'Uva, Itália, crua', '1 unidade (bago)', 8),
  ('TACO', 'Uva, Rubi, crua', '1 unidade (bago)', 8),
  ('IBGE', 'Maçã', '1 unidade média', 130),
  ('IBGE', 'Maçã orgânica', '1 unidade média', 130),
  ('IBGE', 'Laranja (pera, seleta, lima, da terra, etc.)', '1 unidade média', 150),
  ('IBGE', 'Limão (comum, galego, etc.)', '1 unidade média', 70),
  ('IBGE', 'Goiaba', '1 unidade média', 170),
  ('IBGE', 'Kiwi', '1 unidade média', 80),
  ('IBGE', 'Morango', '1 unidade', 12),
  ('IBGE', 'Pêssego', '1 unidade média', 130),
  ('IBGE', 'Tangerina', '1 unidade média', 100),
  ('IBGE', 'Bergamota', '1 unidade média', 100),

  -- ---------------------------------------------------------------------
  -- Legumes e tubérculos
  -- ---------------------------------------------------------------------
  ('TACO', 'Tomate, com semente, cru', '1 unidade média', 120),
  ('TACO', 'Tomate, salada', '1 unidade média', 120),
  ('TACO', 'Cenoura, crua', '1 unidade média', 80),
  ('TACO', 'Cenoura, cozida', '1 unidade média', 80),
  ('TACO', 'Batata, inglesa, crua', '1 unidade média', 130),
  ('TACO', 'Batata, inglesa, cozida', '1 unidade média', 130),
  ('TACO', 'Batata, doce, crua', '1 unidade média', 150),
  ('TACO', 'Batata, doce, cozida', '1 unidade média', 150),
  ('TACO', 'Batata, baroa, crua', '1 unidade média', 80),
  ('TACO', 'Batata, baroa, cozida', '1 unidade média', 80),
  ('TACO', 'Cebola, crua', '1 unidade média', 100),
  ('IBGE', 'Tomate', '1 unidade média', 120),
  ('IBGE', 'Tomate orgânico', '1 unidade média', 120),
  ('IBGE', 'Cenoura', '1 unidade média', 80),
  ('IBGE', 'Cenoura, Cru(a)', '1 unidade média', 80),
  ('IBGE', 'Cenoura, Cozido(a)', '1 unidade média', 80),
  ('IBGE', 'Cenoura amarela (batata-baroa)', '1 unidade média', 80),
  ('IBGE', 'Batata (não especificada)', '1 unidade média', 130),
  ('IBGE', 'Batata (não especificada), Cru(a)', '1 unidade média', 130),
  ('IBGE', 'Batata (não especificada), Cozido(a)', '1 unidade média', 130),
  ('IBGE', 'Batata-doce', '1 unidade média', 150),
  ('IBGE', 'Batata-doce, Cru(a)', '1 unidade média', 150),
  ('IBGE', 'Batata-doce, Cozido(a)', '1 unidade média', 150),
  ('IBGE', 'Batata-inglesa', '1 unidade média', 130),
  ('IBGE', 'Batata-inglesa, Cru(a)', '1 unidade média', 130),
  ('IBGE', 'Batata-inglesa, Cozido(a)', '1 unidade média', 130),
  ('IBGE', 'Cebola', '1 unidade média', 100),
  ('IBGE', 'Cebola, Cru(a)', '1 unidade média', 100),
  ('IBGE', 'Cebola, Cozido(a)', '1 unidade média', 100),

  -- ---------------------------------------------------------------------
  -- Pães
  -- ---------------------------------------------------------------------
  ('TACO', 'Pão, trigo, francês', '1 unidade', 50),
  ('TACO', 'Pão, trigo, forma, integral', '1 fatia', 25),
  ('TACO', 'Pão, aveia, forma', '1 fatia', 25),
  ('TACO', 'Pão, milho, forma', '1 fatia', 25),
  ('TACO', 'Pão, glúten, forma', '1 fatia', 25),
  ('TACO', 'Pão, de soja', '1 fatia', 25),
  ('TACO', 'Pão, de queijo, assado', '1 unidade média', 30),
  ('TACO', 'Pão, de queijo, cru', '1 unidade média', 30),
  ('TACO', 'Pão, trigo, sovado', '1 fatia', 50),
  ('TACO', 'Torrada, pão francês', '1 unidade', 8),
  ('IBGE', 'Pão de forma industrializado de qualquer marca', '1 fatia', 25),
  ('IBGE', 'Pão diet (de forma industrializado)', '1 fatia', 25),
  ('IBGE', 'Pão light (de forma industrializado)', '1 fatia', 25),
  ('IBGE', 'Pão integral', '1 fatia', 25),
  ('IBGE', 'Pão integral light', '1 fatia', 25),
  ('IBGE', 'Pão não especificado', '1 unidade', 50),
  ('IBGE', 'Pão de sal', '1 unidade', 50),
  ('IBGE', 'Pão doce', '1 unidade', 50),
  ('IBGE', 'Pão doce diet', '1 unidade', 50),
  ('IBGE', 'Pão de hambúrguer', '1 unidade', 50),
  ('IBGE', 'Pão de queijo', '1 unidade média', 30),
  ('IBGE', 'Pão de queijo light', '1 unidade média', 30),
  ('IBGE', 'Pão de mel', '1 unidade', 30),
  ('IBGE', 'Pão de mel diet', '1 unidade', 30),
  ('IBGE', 'Pão de milho', '1 fatia', 30)
) as v(fonte, nome, medida_desc, g)
where t.fonte = v.fonte
  and t.nome = v.nome
  and t.medida_caseira_g is null;
