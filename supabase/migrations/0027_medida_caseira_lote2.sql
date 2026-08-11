-- Medida caseira nos alimentos oficiais — segundo lote (o primeiro foi a
-- migration 0026: ovos, bananas, frutas inteiras, legumes/tubérculos e
-- pães). Mesmo método: estimativas profissionais de peso médio por
-- unidade/fatia/porção usual, não vindas de nenhuma base oficial (TACO/
-- IBGE só trazem por 100g). Sempre substituível pela Medida Caseira
-- PESSOAL de cada nutricionista (migration 0025), que tem prioridade.
--
-- Este lote cobre: queijos e frios (fatia), biscoitos (unidade), salgados
-- assados/fritos (unidade), oleaginosas (unidade), legumes adicionais
-- (unidade/folha/dente), hambúrguer/salsicha/linguiça (unidade), iogurte
-- (pote), sorvete (bola), pizza (fatia) e bolo pronto (fatia).
--
-- Fora de propósito, como no lote 1: pratos combinados/molhados (ex:
-- "Salsicha, Ensopado", "Cebola, Molho vermelho"), sanduíches prontos
-- (já são o prato inteiro, não um alimento simples) e itens cujo "peso
-- por unidade" varia demais pra dar um número confiável (ex: alho-poró,
-- castanha-da-índia).

update public.tabela_alimentos as t
set
  medida_caseira_desc = v.medida_desc,
  medida_caseira_g = v.g
from (values
  -- ---------------------------------------------------------------------
  -- Queijos e frios (fatia)
  -- ---------------------------------------------------------------------
  ('TACO', 'Queijo, minas, frescal', '1 fatia', 30),
  ('TACO', 'Queijo, minas, meia cura', '1 fatia', 20),
  ('TACO', 'Queijo, mozarela', '1 fatia', 15),
  ('TACO', 'Queijo, pasteurizado', '1 fatia', 20),
  ('TACO', 'Queijo, prato', '1 fatia', 20),
  ('TACO', 'Presunto, com capa de gordura', '1 fatia', 15),
  ('TACO', 'Presunto, sem capa de gordura', '1 fatia', 15),
  ('TACO', 'Mortadela', '1 fatia', 15),
  ('TACO', 'Salame', '1 fatia', 10),
  ('IBGE', 'Queijo muçarela', '1 fatia', 15),
  ('IBGE', 'Queijo muçarela light', '1 fatia', 15),
  ('IBGE', 'Queijo prato', '1 fatia', 20),
  ('IBGE', 'Queijo prato light', '1 fatia', 20),
  ('IBGE', 'Queijo de minas', '1 fatia', 30),
  ('IBGE', 'Queijo de minas light', '1 fatia', 30),
  ('IBGE', 'Queijo de minas frescal orgânico', '1 fatia', 30),
  ('IBGE', 'Queijo de coalho', '1 unidade pequena', 50),
  ('IBGE', 'Queijo de coalho light', '1 unidade pequena', 50),
  ('IBGE', 'Queijo não especificado', '1 fatia', 20),
  ('IBGE', 'Queijo não especificado light', '1 fatia', 20),
  ('IBGE', 'Queijo polenguinho', '1 unidade', 20),
  ('IBGE', 'Queijo polenguinho light', '1 unidade', 20),
  ('IBGE', 'Queijo provolone', '1 fatia', 20),
  ('IBGE', 'Presunto', '1 fatia', 15),
  ('IBGE', 'Peito de peru', '1 fatia', 15),
  ('IBGE', 'Peito de peru light', '1 fatia', 15),
  ('IBGE', 'Mortadela', '1 fatia', 15),
  ('IBGE', 'Mortadela light', '1 fatia', 15),
  ('IBGE', 'Salame', '1 fatia', 10),
  ('IBGE', 'Salame light', '1 fatia', 10),
  ('IBGE', 'Bacon', '1 fatia', 10),

  -- ---------------------------------------------------------------------
  -- Biscoitos e bolachas (unidade)
  -- ---------------------------------------------------------------------
  ('TACO', 'Biscoito, doce, maisena', '1 unidade', 5),
  ('TACO', 'Biscoito, doce, recheado com chocolate', '1 unidade', 14),
  ('TACO', 'Biscoito, doce, recheado com morango', '1 unidade', 14),
  ('TACO', 'Biscoito, doce, wafer, recheado de chocolate', '1 unidade', 8),
  ('TACO', 'Biscoito, doce, wafer, recheado de morango', '1 unidade', 8),
  ('TACO', 'Biscoito, polvilho doce', '1 unidade', 5),
  ('TACO', 'Biscoito, salgado, cream cracker', '1 unidade', 7),
  ('IBGE', 'Biscoito de polvilho', '1 unidade', 5),
  ('IBGE', 'Biscoito doce', '1 unidade', 5),
  ('IBGE', 'Biscoito doce diet', '1 unidade', 5),
  ('IBGE', 'Biscoito doce light', '1 unidade', 5),
  ('IBGE', 'Biscoito não especificado', '1 unidade', 6),
  ('IBGE', 'Biscoito recheado', '1 unidade', 14),
  ('IBGE', 'Biscoito recheado diet', '1 unidade', 14),
  ('IBGE', 'Biscoito recheado light', '1 unidade', 14),
  ('IBGE', 'Biscoito salgado', '1 unidade', 7),
  ('IBGE', 'Biscoito salgado integral', '1 unidade', 7),
  ('IBGE', 'Biscoito salgado light', '1 unidade', 7),
  ('IBGE', 'Biscoito waffer light', '1 unidade', 8),
  ('IBGE', 'Bolacha doce', '1 unidade', 5),
  ('IBGE', 'Bolacha doce diet', '1 unidade', 5),
  ('IBGE', 'Bolacha doce light', '1 unidade', 5),
  ('IBGE', 'Bolacha recheada', '1 unidade', 14),
  ('IBGE', 'Bolacha recheada diet', '1 unidade', 14),
  ('IBGE', 'Bolacha recheada light', '1 unidade', 14),
  ('IBGE', 'Bolacha salgada', '1 unidade', 7),
  ('IBGE', 'Bolacha salgada light', '1 unidade', 7),
  ('IBGE', 'Alfajores (biscoito)', '1 unidade', 40),
  ('IBGE', 'Alfajores (biscoito) light', '1 unidade', 40),

  -- ---------------------------------------------------------------------
  -- Salgados (unidade)
  -- ---------------------------------------------------------------------
  ('TACO', 'Coxinha de frango, frita', '1 unidade média', 70),
  ('TACO', 'Empada de frango, pré-cozida, assada', '1 unidade', 40),
  ('TACO', 'Empada, de frango, pré-cozida', '1 unidade', 40),
  ('TACO', 'Pastel, de carne, cru', '1 unidade', 60),
  ('TACO', 'Pastel, de carne, frito', '1 unidade', 60),
  ('TACO', 'Pastel, de queijo, cru', '1 unidade', 60),
  ('TACO', 'Pastel, de queijo, frito', '1 unidade', 60),
  ('TACO', 'Paçoca, amendoim', '1 unidade', 20),
  ('TACO', 'Pé-de-moleque, amendoim', '1 unidade', 30),
  ('IBGE', 'Coxinha', '1 unidade média', 70),
  ('IBGE', 'Esfirra', '1 unidade', 40),
  ('IBGE', 'Esfirra de carne', '1 unidade', 40),
  ('IBGE', 'Esfirra de frango', '1 unidade', 40),
  ('IBGE', 'Esfirra de queijo', '1 unidade', 40),
  ('IBGE', 'Esfirra de ricota', '1 unidade', 40),
  ('IBGE', 'Empada (queijo, carne, camarão, etc.)', '1 unidade', 40),
  ('IBGE', 'Empadão (queijo, frango, camarão, palmito, etc.)', '1 fatia', 100),
  ('IBGE', 'Pastel (queijo, carne, palmito, etc.)', '1 unidade', 60),
  ('IBGE', 'Minipastel', '1 unidade', 15),
  ('IBGE', 'Rissole  (queijo, carne, camarão, etc.)', '1 unidade', 30),

  -- ---------------------------------------------------------------------
  -- Oleaginosas (unidade)
  -- ---------------------------------------------------------------------
  ('TACO', 'Castanha-de-caju, torrada, salgada', '1 unidade', 1.5),
  ('TACO', 'Castanha-do-Brasil, crua', '1 unidade', 5),
  ('TACO', 'Amêndoa, torrada, salgada', '1 unidade', 1.2),
  ('TACO', 'Noz, crua', '1 unidade', 4),
  ('IBGE', 'Castanha de caju', '1 unidade', 1.5),
  ('IBGE', 'Castanha-do-pará', '1 unidade', 5),
  ('IBGE', 'Castanha portuguesa', '1 unidade', 10),
  ('IBGE', 'Amêndoa', '1 unidade', 1.2),

  -- ---------------------------------------------------------------------
  -- Legumes e folhas adicionais
  -- ---------------------------------------------------------------------
  ('TACO', 'Pepino, cru', '1 unidade média', 200),
  ('TACO', 'Pimentão, amarelo, cru', '1 unidade média', 150),
  ('TACO', 'Pimentão, verde, cru', '1 unidade média', 150),
  ('TACO', 'Pimentão, vermelho, cru', '1 unidade média', 150),
  ('TACO', 'Berinjela, crua', '1 unidade média', 250),
  ('TACO', 'Berinjela, cozida', '1 unidade média', 250),
  ('TACO', 'Abobrinha, italiana, crua', '1 unidade média', 200),
  ('TACO', 'Abobrinha, italiana, cozida', '1 unidade média', 200),
  ('TACO', 'Abobrinha, paulista, crua', '1 unidade média', 300),
  ('TACO', 'Alface, americana, crua', '1 folha', 15),
  ('TACO', 'Alface, crespa, crua', '1 folha', 15),
  ('TACO', 'Alface, lisa, crua', '1 folha', 15),
  ('TACO', 'Alface, roxa, crua', '1 folha', 15),
  ('TACO', 'Alho, cru', '1 dente', 4),
  ('TACO', 'Brócolis, cru', '1 ramalhete pequeno', 20),
  ('TACO', 'Brócolis, cozido', '1 ramalhete pequeno', 20),
  ('TACO', 'Couve-flor, crua', '1 ramalhete pequeno', 20),
  ('TACO', 'Couve-flor, cozida', '1 ramalhete pequeno', 20),
  ('TACO', 'Rúcula, crua', '1 folha', 5),
  ('IBGE', 'Alface', '1 folha', 15),
  ('IBGE', 'Alface orgânica', '1 folha', 15),
  ('IBGE', 'Berinjela', '1 unidade média', 250),
  ('IBGE', 'Berinjela, Cru(a)', '1 unidade média', 250),
  ('IBGE', 'Berinjela, Cozido(a)', '1 unidade média', 250),
  ('IBGE', 'Abobrinha, Cru(a)', '1 unidade média', 200),
  ('IBGE', 'Abobrinha, Cozido(a)', '1 unidade média', 200),
  ('IBGE', 'Pimentão', '1 unidade média', 150),
  ('IBGE', 'Pimentão orgânico', '1 unidade média', 150),
  ('IBGE', 'Brócolis', '1 ramalhete pequeno', 20),
  ('IBGE', 'Brócolis, Cru(a)', '1 ramalhete pequeno', 20),
  ('IBGE', 'Brócolis, Cozido(a)', '1 ramalhete pequeno', 20),
  ('IBGE', 'Couve-flor', '1 ramalhete pequeno', 20),
  ('IBGE', 'Couve-flor, Cru(a)', '1 ramalhete pequeno', 20),
  ('IBGE', 'Couve-flor, Cozido(a)', '1 ramalhete pequeno', 20),
  ('IBGE', 'Rúcula', '1 folha', 5),

  -- ---------------------------------------------------------------------
  -- Hambúrguer, salsicha e linguiça (unidade)
  -- ---------------------------------------------------------------------
  ('TACO', 'Hambúrguer, bovino, cru', '1 unidade', 90),
  ('TACO', 'Hambúrguer, bovino, frito', '1 unidade', 70),
  ('TACO', 'Hambúrguer, bovino, grelhado', '1 unidade', 70),
  ('IBGE', 'Hambúrguer de carne bovina', '1 unidade', 90),
  ('IBGE', 'Hambúrguer de carne bovina, Cru(a)', '1 unidade', 90),
  ('IBGE', 'Hambúrguer de carne bovina, Assado(a)', '1 unidade', 70),
  ('IBGE', 'Hambúrguer de carne bovina, Cozido(a)', '1 unidade', 70),
  ('IBGE', 'Hambúrguer de carne bovina, Frito(a)', '1 unidade', 70),
  ('IBGE', 'Hambúrguer de carne bovina, Grelhado(a)/brasa/churrasco', '1 unidade', 70),
  ('IBGE', 'Hambúrguer de frango', '1 unidade', 90),
  ('IBGE', 'Hambúrguer de frango, Assado(a)', '1 unidade', 70),
  ('IBGE', 'Hambúrguer de frango, Cozido(a)', '1 unidade', 70),
  ('IBGE', 'Hambúrguer de frango, Empanado(a)/à milanesa', '1 unidade', 70),
  ('IBGE', 'Hambúrguer de frango, Frito(a)', '1 unidade', 70),
  ('IBGE', 'Hambúrguer de frango, Grelhado(a)/brasa/churrasco', '1 unidade', 70),
  ('IBGE', 'Hambúrguer de peru, Assado(a)', '1 unidade', 70),
  ('IBGE', 'Hambúrguer de peru, Cozido(a)', '1 unidade', 70),
  ('IBGE', 'Hambúrguer de peru, Empanado(a)/à milanesa', '1 unidade', 70),
  ('IBGE', 'Hambúrguer não especificado', '1 unidade', 90),
  ('IBGE', 'Hambúrguer não especificado light', '1 unidade', 90),
  ('IBGE', 'Hambúrguer não especificado, Assado(a)', '1 unidade', 70),
  ('IBGE', 'Hambúrguer não especificado, Cozido(a)', '1 unidade', 70),
  ('IBGE', 'Hambúrguer não especificado, Frito(a)', '1 unidade', 70),
  ('IBGE', 'Hambúrguer não especificado, Grelhado(a)/brasa/churrasco', '1 unidade', 70),
  ('IBGE', 'Salsicha no varejo', '1 unidade', 50),
  ('IBGE', 'Salsicha no varejo, Cru(a)', '1 unidade', 50),
  ('IBGE', 'Salsicha no varejo, Assado(a)', '1 unidade', 45),
  ('IBGE', 'Salsicha no varejo, Cozido(a)', '1 unidade', 45),
  ('IBGE', 'Salsicha no varejo, Frito(a)', '1 unidade', 45),
  ('IBGE', 'Salsicha no varejo, Grelhado(a)/brasa/churrasco', '1 unidade', 45),
  ('IBGE', 'Linguiça (suína, bovina, mista, etc.)', '1 gomo', 60),
  ('IBGE', 'Linguiça (suína, bovina, mista, etc.), Cru(a)', '1 gomo', 60),
  ('IBGE', 'Linguiça (suína, bovina, mista, etc.), Assado(a)', '1 gomo', 50),
  ('IBGE', 'Linguiça (suína, bovina, mista, etc.), Cozido(a)', '1 gomo', 50),
  ('IBGE', 'Linguiça (suína, bovina, mista, etc.), Frito(a)', '1 gomo', 50),
  ('IBGE', 'Linguiça (suína, bovina, mista, etc.), Grelhado(a)/brasa/churrasco', '1 gomo', 50),
  ('IBGE', 'Linguiça de frango, Cru(a)', '1 gomo', 60),
  ('IBGE', 'Linguiça de frango, Assado(a)', '1 gomo', 50),
  ('IBGE', 'Linguiça de frango, Cozido(a)', '1 gomo', 50),
  ('IBGE', 'Linguiça de frango, Frito(a)', '1 gomo', 50),
  ('IBGE', 'Linguiça de frango, Grelhado(a)/brasa/churrasco', '1 gomo', 50),

  -- ---------------------------------------------------------------------
  -- Sardinha (unidade)
  -- ---------------------------------------------------------------------
  ('TACO', 'Sardinha, inteira, crua', '1 unidade', 30),
  ('TACO', 'Sardinha, assada', '1 unidade', 30),
  ('TACO', 'Sardinha, frita', '1 unidade', 30),
  ('TACO', 'Sardinha, conserva em óleo', '1 unidade', 15),

  -- ---------------------------------------------------------------------
  -- Iogurte (pote), sorvete (bola), pizza e bolo (fatia)
  -- ---------------------------------------------------------------------
  ('TACO', 'Iogurte, natural', '1 pote', 170),
  ('TACO', 'Iogurte, natural, desnatado', '1 pote', 170),
  ('TACO', 'Iogurte, sabor abacaxi', '1 pote', 170),
  ('TACO', 'Iogurte, sabor morango', '1 pote', 170),
  ('TACO', 'Iogurte, sabor pêssego', '1 pote', 170),
  ('IBGE', 'Iogurte natural', '1 pote', 170),
  ('IBGE', 'Iogurte natural de qualquer sabor orgânico', '1 pote', 170),
  ('IBGE', 'Iogurte de qualquer sabor', '1 pote', 170),
  ('IBGE', 'Iogurte de qualquer sabor diet', '1 pote', 170),
  ('IBGE', 'Iogurte de qualquer sabor light', '1 pote', 170),
  ('IBGE', 'Iogurte de qualquer sabor orgânico', '1 pote', 170),
  ('IBGE', 'Iogurte de qualquer sabor desnatado orgânico', '1 pote', 170),
  ('IBGE', 'Iogurte desnatado', '1 pote', 170),
  ('IBGE', 'Sorvete de qualquer sabor industrializado', '1 bola', 60),
  ('IBGE', 'Sorvete de qualquer sabor industrializado diet', '1 bola', 60),
  ('IBGE', 'Sorvete de qualquer sabor industrializado light', '1 bola', 60),
  ('IBGE', 'Pizza', '1 fatia', 100),
  ('IBGE', 'Pizza calabreza', '1 fatia', 100),
  ('IBGE', 'Pizza muçarela', '1 fatia', 100),
  ('IBGE', 'Pizza portuguesa', '1 fatia', 100),
  ('IBGE', 'Pizza portuguesa light', '1 fatia', 100),
  ('IBGE', 'Pizza presunto', '1 fatia', 100),
  ('IBGE', 'Pizza pronta light', '1 fatia', 100),
  ('IBGE', 'Mini pizza semipronta', '1 unidade', 80),
  ('IBGE', 'Mini pizza semipronta, Assado(a)', '1 unidade', 80),
  ('IBGE', 'Mini pizza semipronta, Cozido(a)', '1 unidade', 80),
  ('IBGE', 'Mini pizza semipronta, Cru(a)', '1 unidade', 80),
  ('IBGE', 'Mini pizza semipronta, Frito(a)', '1 unidade', 80),
  ('IBGE', 'Mini pizza semipronta light, Assado(a)', '1 unidade', 80),
  ('TACO', 'Bolo, pronto, aipim', '1 fatia', 60),
  ('TACO', 'Bolo, pronto, chocolate', '1 fatia', 60),
  ('TACO', 'Bolo, pronto, coco', '1 fatia', 60),
  ('TACO', 'Bolo, pronto, milho', '1 fatia', 60),
  ('IBGE', 'Bolo de banana', '1 fatia', 60),
  ('IBGE', 'Bolo de batata-doce', '1 fatia', 60),
  ('IBGE', 'Bolo de cenoura', '1 fatia', 60),
  ('IBGE', 'Bolo de cenoura diet', '1 fatia', 60),
  ('IBGE', 'Bolo de laranja', '1 fatia', 60),
  ('IBGE', 'Bolo de laranja light', '1 fatia', 60),
  ('IBGE', 'Bolo de macaxeira', '1 fatia', 60)
) as v(fonte, nome, medida_desc, g)
where t.fonte = v.fonte
  and t.nome = v.nome
  and t.medida_caseira_g is null;
