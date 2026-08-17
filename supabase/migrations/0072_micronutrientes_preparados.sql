-- Micronutrientes pra "Alimentos preparados" (32 itens) — mesma
-- metodologia das categorias anteriores (0054-0071), fonte USDA
-- FoodData Central.
--
-- Essa categoria é dominada por pratos regionais brasileiros compostos
-- (acarajé, barreado, camarão à baiana, cuscuz nordestino, dobradinha,
-- feijão tropeiro, maniçoba, quibebe, sarapatel, tacacá, vatapá, virado
-- à paulista, vaca atolada, yakisoba, etc.) — receitas com muitos
-- ingredientes e preparo específico, sem equivalente USDA possível (a
-- USDA não cataloga pratos regionais brasileiros). Os poucos itens que
-- o algoritmo tinha casado com algo estavam errados: cuscuz de milho
-- (prato nordestino) casado com couscous de trigo; frango com açafrão
-- casado com "patê de frango" (spread industrializado); macarrão ao
-- bolognesa casado com macarrão de ARROZ; salada de legumes com
-- maionese casada com "patê de presunto".
--
-- Só 2 de 32 itens aprovados: macarrão com molho bolognesa (usando um
-- prato de restaurante italiano equivalente da USDA) e salada de
-- legumes cozida no vapor (vegetais mistos cozidos, sem maionese — a
-- versão COM maionese ficou de fora por não ter equivalente). Os
-- outros 30 ficaram sem dado novo — prefiro coluna vazia a inventar
-- composição pra um prato regional que a USDA simplesmente não tem.

update public.tabela_alimentos set calcio_mg = coalesce(calcio_mg, 17), ferro_mg = coalesce(ferro_mg, 0.97), magnesio_mg = 17, fosforo_mg = 59, potassio_mg = 172, sodio_mg = coalesce(sodio_mg, 230), zinco_mg = coalesce(zinco_mg, 0.69), cobre_mcg = 97, manganes_mg = 0.212, selenio_mcg = 13.1, vitamina_a_mcg = coalesce(vitamina_a_mcg, 12), vitamina_e_mg = 0.63, vitamina_c_mg = coalesce(vitamina_c_mg, 0.7), tiamina_mg = coalesce(tiamina_mg, 0.09), riboflavina_mg = coalesce(riboflavina_mg, 0.147), niacina_mg = coalesce(niacina_mg, 1.643), acido_pantotenico_mg = 0.247, vitamina_b6_mg = coalesce(vitamina_b6_mg, 0.109), vitamina_b12_mcg = coalesce(vitamina_b12_mcg, 0.17), colina_mg = 15.6, vitamina_k_mcg = 4.2 where nome = 'Macarrão, molho bolognesa' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set calcio_mg = coalesce(calcio_mg, 25), ferro_mg = coalesce(ferro_mg, 0.82), magnesio_mg = 22, fosforo_mg = 51, potassio_mg = 169, sodio_mg = coalesce(sodio_mg, 35), zinco_mg = coalesce(zinco_mg, 0.49), cobre_mcg = 83, manganes_mg = 0.379, selenio_mcg = 0.3, vitamina_a_mcg = coalesce(vitamina_a_mcg, 214), vitamina_e_mg = 0.38, vitamina_d_mcg = coalesce(vitamina_d_mcg, 0), vitamina_c_mg = coalesce(vitamina_c_mg, 3.2), tiamina_mg = coalesce(tiamina_mg, 0.071), riboflavina_mg = coalesce(riboflavina_mg, 0.12), niacina_mg = coalesce(niacina_mg, 0.851), acido_pantotenico_mg = 0.151, vitamina_b6_mg = coalesce(vitamina_b6_mg, 0.074), vitamina_b12_mcg = coalesce(vitamina_b12_mcg, 0), colina_mg = 24.1, vitamina_k_mcg = 23.5, folato_mcg = 19 where nome = 'Salada, de legumes, cozida no vapor' and fonte = 'TACO' and id_avaliador is null;
