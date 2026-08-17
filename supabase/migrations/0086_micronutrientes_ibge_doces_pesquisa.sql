-- Migration 0086: micronutrientes IBGE — doces (pesquisa TBCA) e item avulso
--
-- Continuação da migration 0085 (refrigerantes/sucos), agora cobrindo o
-- que deu pra recuperar da categoria de doces do IBGE via pesquisa na
-- TBCA. Rendimento baixo (3 itens) — mesmo padrão já visto em "Alimentos
-- preparados" da TACO e "Doces" do Fabricante: a maioria dos doces do
-- IBGE (pastas/caldas/cristalizados de fruta "de qualquer sabor", barra
-- de cereal genérica, doce à base de ovos/leite, versões diet/light) não
-- tem um produto único e real por trás — são categorias guarda-chuva sem
-- equivalente confiável em nenhuma base de composição.
--
-- Itens aprovados:
--   - Achocolatado em pó / Achocolatado em pó diet: TBCA tem entrada
--     própria pra achocolatado brasileiro genérico e pra versão sem
--     adição de açúcar.
--   - Doce de frutas em pasta de qualquer sabor: usa goiabada (TBCA) como
--     representante — é literalmente a definição de "doce de fruta em
--     pasta" mais comum no Brasil.
--   - Amendoim cozido: item avulso que já estava correto no casamento
--     automático (USDA) desde o início, mas nunca tinha entrado em
--     nenhum lote anterior — incluído aqui pra não ficar de fora.
--
-- Achado durante a pesquisa: as entradas "diet" da TBCA pra Doce de leite
-- (BRC0077N) e Goiabada (BRC0078N) retornaram exatamente os MESMOS 20
-- valores de nutrientes uma da outra — inconsistência/bug da própria
-- base de dados da TBCA na seção "Alimentos para fins especiais" (dois
-- produtos diferentes não podem ter composição idêntica até a segunda
-- casa decimal em 20 nutrientes distintos). Não foram usadas por não
-- serem dado confiável pra nenhum dos dois — "Doce de leite light" e
-- "Doce de leite diet" do IBGE ficaram de fora deste lote por causa
-- disso.
--
-- Como sempre: coalesce() preserva os valores já existentes nas 12
-- colunas legadas; as 15 colunas novas (migration 0054) recebem o valor
-- diretamente.
--
-- Com isso fecha a rodada de pesquisa externa do IBGE (refrigerantes,
-- sucos, doces recuperáveis). O que resta do IBGE — doces sem produto
-- único identificável e os ~1600 itens fora do pool "rigoroso" já
-- revisado — fica pra uma eventual triagem futura, fora do escopo desta
-- sessão de curadoria.

update public.tabela_alimentos set calcio_mg = coalesce(calcio_mg, 55), ferro_mg = coalesce(ferro_mg, 1.01), magnesio_mg = 102, fosforo_mg = 198, potassio_mg = 180, sodio_mg = coalesce(sodio_mg, 751), zinco_mg = coalesce(zinco_mg, 1.83), cobre_mcg = 499, manganes_mg = 1.023, selenio_mcg = 4.4, vitamina_a_mcg = coalesce(vitamina_a_mcg, 0), vitamina_e_mg = 4.1, vitamina_d_mcg = coalesce(vitamina_d_mcg, 0), vitamina_c_mg = coalesce(vitamina_c_mg, 0), tiamina_mg = coalesce(tiamina_mg, 0.259), riboflavina_mg = coalesce(riboflavina_mg, 0.063), niacina_mg = coalesce(niacina_mg, 5.259), acido_pantotenico_mg = 0.825, vitamina_b6_mg = coalesce(vitamina_b6_mg, 0.152), vitamina_b12_mcg = coalesce(vitamina_b12_mcg, 0), colina_mg = 32.7, vitamina_k_mcg = 0, folato_mcg = 75 where nome = 'Amendoim cozido' and fonte = 'IBGE' and id_avaliador is null;
update public.tabela_alimentos set calcio_mg = coalesce(calcio_mg, 44.6), ferro_mg = coalesce(ferro_mg, 5.38), magnesio_mg = 77.1, fosforo_mg = 200, potassio_mg = 498, sodio_mg = coalesce(sodio_mg, 65.1), zinco_mg = coalesce(zinco_mg, 1.04), cobre_mcg = 560, manganes_mg = 0.55, selenio_mcg = 2.7, vitamina_a_mcg = coalesce(vitamina_a_mcg, 795), vitamina_e_mg = 0.14, vitamina_d_mcg = coalesce(vitamina_d_mcg, 0), tiamina_mg = coalesce(tiamina_mg, 1.39), riboflavina_mg = coalesce(riboflavina_mg, 1.02), niacina_mg = coalesce(niacina_mg, 5.01), vitamina_b6_mg = coalesce(vitamina_b6_mg, 1.53), vitamina_b12_mcg = coalesce(vitamina_b12_mcg, 0), folato_mcg = 6.05 where nome = 'Achocolatado em pó' and fonte = 'IBGE' and id_avaliador is null; -- TBCA BRC0001K
update public.tabela_alimentos set calcio_mg = coalesce(calcio_mg, 576), ferro_mg = coalesce(ferro_mg, 4.96), magnesio_mg = 208, fosforo_mg = 893, potassio_mg = 2702, sodio_mg = coalesce(sodio_mg, 876), zinco_mg = coalesce(zinco_mg, 3.44), cobre_mcg = 730, selenio_mcg = 16.9, vitamina_a_mcg = coalesce(vitamina_a_mcg, 4), vitamina_e_mg = 0.04, vitamina_d_mcg = coalesce(vitamina_d_mcg, 0), vitamina_c_mg = coalesce(vitamina_c_mg, 0), tiamina_mg = coalesce(tiamina_mg, 0.27), riboflavina_mg = coalesce(riboflavina_mg, 1.4), niacina_mg = coalesce(niacina_mg, 1.08), vitamina_b6_mg = coalesce(vitamina_b6_mg, 0.32), vitamina_b12_mcg = coalesce(vitamina_b12_mcg, 1.18), folato_mcg = 14 where nome = 'Achocolatado em pó diet' and fonte = 'IBGE' and id_avaliador is null; -- TBCA BRC0101N (sem adição de açúcar)
update public.tabela_alimentos set calcio_mg = coalesce(calcio_mg, 14.7), ferro_mg = coalesce(ferro_mg, 0.4), magnesio_mg = 9.67, fosforo_mg = 28.2, potassio_mg = 250, sodio_mg = coalesce(sodio_mg, 11), zinco_mg = coalesce(zinco_mg, 0.14), cobre_mcg = 80, manganes_mg = 0.16, vitamina_a_mcg = coalesce(vitamina_a_mcg, 25.2), vitamina_d_mcg = coalesce(vitamina_d_mcg, 0), vitamina_c_mg = coalesce(vitamina_c_mg, 34.3), niacina_mg = coalesce(niacina_mg, 1.41), vitamina_b12_mcg = coalesce(vitamina_b12_mcg, 0) where nome = 'Doce de frutas em pasta de qualquer sabor' and fonte = 'IBGE' and id_avaliador is null; -- TBCA BRC0097C (goiabada, representante de doce de fruta em pasta)
