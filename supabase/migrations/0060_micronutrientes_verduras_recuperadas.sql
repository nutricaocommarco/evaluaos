-- Recuperação dos 19 itens de "Verduras, hortaliças e derivados" que
-- ficaram de fora da 0059 (sem bom equivalente na USDA). A pedido do
-- usuário, pesquisei diretamente a TACO 4ª edição via sites-espelho
-- (tabelanutricional.com.br, tabelatacoonline.com.br), preenchendo só
-- magnesio_mg, fosforo_mg, potassio_mg, manganes_mg e cobre_mcg (as
-- colunas mais comumente reportadas nessas fontes agregadas). Confiança
-- mais baixa que USDA/fdc_id — aceita conscientemente pra fechar itens
-- que já são consumidos no dia a dia da prescrição (batata-baroa, pão
-- de queijo, mandioca cozida/frita, nhoque) e algumas hortaliças
-- nativas/PANC que felizmente a própria TACO já tinha medido (taioba,
-- caruru, maxixe, serralha, jurubeba, alfavaca), mas que o algoritmo de
-- match não usou por não terem virado colunas na tabela_alimentos_taco
-- original.

update public.tabela_alimentos set magnesio_mg = 11.99, fosforo_mg = 45.2, potassio_mg = 505.18, manganes_mg = 0.07, cobre_mcg = 50 where nome = 'Batata, baroa, crua' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 7.58, fosforo_mg = 29.48, potassio_mg = 258.33, manganes_mg = 0.22, cobre_mcg = 150 where nome = 'Batata, baroa, cozida' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 6.83, fosforo_mg = 78.84, potassio_mg = 58.08 where nome = 'Pão, de queijo, cru' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 8.24, fosforo_mg = 93.74, potassio_mg = 93.09, manganes_mg = 0.03, cobre_mcg = 10 where nome = 'Pão, de queijo, assado' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 27.49, fosforo_mg = 32.64, potassio_mg = 337.76, manganes_mg = 0.16, cobre_mcg = 70 where nome = 'Farinha, de puba' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 5.85, fosforo_mg = 23.32, potassio_mg = 53.58, manganes_mg = 0.08, cobre_mcg = 40 where nome = 'Biscoito, polvilho doce' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 25.13, fosforo_mg = 74.75, potassio_mg = 189.22, manganes_mg = 0.19, cobre_mcg = 170 where nome = 'Feijão, broto, cru' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 16.35, fosforo_mg = 35.36, potassio_mg = 452.28, manganes_mg = 0.64, cobre_mcg = 180 where nome = 'Catalonha, refogada' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 26.82, fosforo_mg = 22.41, potassio_mg = 100.36, manganes_mg = 0.06, cobre_mcg = 10 where nome = 'Mandioca, cozida' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 94.87, fosforo_mg = 56.54, potassio_mg = 176.06, manganes_mg = 0.18, cobre_mcg = 120 where nome = 'Mandioca, frita' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 17.9, fosforo_mg = 68.37, potassio_mg = 163.7, manganes_mg = 0.3, cobre_mcg = 100 where nome = 'Nhoque, batata, cozido' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 34.34, fosforo_mg = 44.52, potassio_mg = 201.38, manganes_mg = 0.29 where nome = 'Mandioca, farofa, temperada' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 84.2, fosforo_mg = 49.7, potassio_mg = 260.7, manganes_mg = 0.2, cobre_mcg = 200 where nome = 'Alfavaca, crua' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 197.44, fosforo_mg = 77.26, potassio_mg = 278.98, manganes_mg = 0.89, cobre_mcg = 370 where nome = 'Caruru, cru' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 65, fosforo_mg = 155, potassio_mg = 619, manganes_mg = 0.52, cobre_mcg = 1160 where nome = 'Jurubeba, crua' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 10, fosforo_mg = 25, potassio_mg = 328, manganes_mg = 0.07, cobre_mcg = 20 where nome = 'Maxixe, cru' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 29.55, fosforo_mg = 48.26, potassio_mg = 265.27, manganes_mg = 0.23, cobre_mcg = 200 where nome = 'Serralha, crua' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 37.92, fosforo_mg = 52.76, potassio_mg = 290.32, manganes_mg = 0.66, cobre_mcg = 160 where nome = 'Taioba, crua' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 15.61, fosforo_mg = 49.03, potassio_mg = 122.21, manganes_mg = 0.13, cobre_mcg = 80 where nome = 'Seleta de legumes, enlatada' and fonte = 'TACO' and id_avaliador is null;
