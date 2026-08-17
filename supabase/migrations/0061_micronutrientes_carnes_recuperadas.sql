-- Recuperação de 42 dos 44 itens de "Carnes e derivados" que ficaram de
-- fora da 0058 (sem bom equivalente na USDA). Mesma metodologia da 0060:
-- pesquisa direta na TACO 4ª edição via sites-espelho, preenchendo só
-- magnesio_mg, fosforo_mg, potassio_mg, manganes_mg e cobre_mcg.
-- Confiança mais baixa que USDA/fdc_id, aceita conscientemente a pedido
-- do usuário pra fechar itens de uso diário na prescrição: charque/carne
-- seca, linguiça (frango/porco, crua/frita/grelhada), quibe, coxinha,
-- croquete, empada, frango caipira/inteiro, cupim, costela, contra-filé
-- de costela, capa de contra-filé, almôndegas, apresuntado, caldo em
-- tablete, peru assado, porco orelha/rabo salgados.
--
-- Ficaram de fora (não pesquisados — são pratos empanados/fritos com
-- mistura de ingredientes, não só a carne, e a diferença de composição
-- seria grande demais pra usar o dado da carne pura): "Carne, bovina,
-- contra-filé, à milanesa" e "Frango, filé, à milanesa".

update public.tabela_alimentos set magnesio_mg = 22, fosforo_mg = 281, potassio_mg = 409, manganes_mg = 0.04, cobre_mcg = 150 where nome = 'Apresuntado' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 22.06, fosforo_mg = 123.04, potassio_mg = 218.15, manganes_mg = 0.02 where nome = 'Caldo de carne, tablete' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 12.79, fosforo_mg = 48.06, potassio_mg = 68.03, manganes_mg = 0.13 where nome = 'Caldo de galinha, tablete' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 16.78, fosforo_mg = 92.54, potassio_mg = 166.21, manganes_mg = 0.28, cobre_mcg = 90 where nome = 'Coxinha de frango, frita' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 23.64, fosforo_mg = 144.18, potassio_mg = 221.4, manganes_mg = 0.34, cobre_mcg = 100 where nome = 'Croquete, de carne, cru' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 29.52, fosforo_mg = 176.26, potassio_mg = 313.02, manganes_mg = 0.39, cobre_mcg = 90 where nome = 'Croquete, de carne, frito' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 18.3, fosforo_mg = 77.62, potassio_mg = 137.66, manganes_mg = 0.32, cobre_mcg = 70 where nome = 'Empada de frango, pré-cozida, assada' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 17.33, fosforo_mg = 77.94, potassio_mg = 156.36, manganes_mg = 0.25, cobre_mcg = 90 where nome = 'Empada, de frango, pré-cozida' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 36.08, fosforo_mg = 174.37, potassio_mg = 287.78, manganes_mg = 0.76, cobre_mcg = 510 where nome = 'Quibe, assado' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 25.69, fosforo_mg = 125.79, potassio_mg = 241.74, manganes_mg = 0.39, cobre_mcg = 130 where nome = 'Quibe, cru' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 38.77, fosforo_mg = 165.83, potassio_mg = 322.47, manganes_mg = 0.72, cobre_mcg = 160 where nome = 'Quibe, frito' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 12.81, fosforo_mg = 100.9, potassio_mg = 89.57, manganes_mg = 0.02, cobre_mcg = 70 where nome = 'Carne, bovina, charque, cozido' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 13.36, fosforo_mg = 122.29, potassio_mg = 236.26, cobre_mcg = 30 where nome = 'Carne, bovina, charque, cru' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 11.9, fosforo_mg = 82.38, potassio_mg = 86.03, manganes_mg = 0.02, cobre_mcg = 30 where nome = 'Carne, bovina, seca, cozida' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 12.22, fosforo_mg = 100, potassio_mg = 190.15, manganes_mg = 0.01 where nome = 'Carne, bovina, seca, crua' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 23.75, fosforo_mg = 144.93, potassio_mg = 328.24, manganes_mg = 0.17, cobre_mcg = 150 where nome = 'Carne, bovina, almôndegas, cruas' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 48.12, fosforo_mg = 244.3, potassio_mg = 536.1, manganes_mg = 0.41, cobre_mcg = 190 where nome = 'Carne, bovina, almôndegas, fritas' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 17.45, fosforo_mg = 144.19, potassio_mg = 266.89, manganes_mg = 0.01, cobre_mcg = 60 where nome = 'Carne, bovina, capa de contra-filé, com gordura, crua' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 18.38, fosforo_mg = 213.63, potassio_mg = 323.45, cobre_mcg = 130 where nome = 'Carne, bovina, capa de contra-filé, com gordura, grelhada' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 19.59, fosforo_mg = 178.23, potassio_mg = 325.43, cobre_mcg = 60 where nome = 'Carne, bovina, capa de contra-filé, sem gordura, crua' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 25.61, fosforo_mg = 287.38, potassio_mg = 384.84, manganes_mg = 0.01, cobre_mcg = 120 where nome = 'Carne, bovina, capa de contra-filé, sem gordura, grelhada' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 14, fosforo_mg = 163.85, potassio_mg = 245.07, cobre_mcg = 40 where nome = 'Carne, bovina, contra-filé de costela, cru' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 23.57, fosforo_mg = 251.89, potassio_mg = 382.74, manganes_mg = 0.01, cobre_mcg = 80 where nome = 'Carne, bovina, contra-filé de costela, grelhado' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 19.55, fosforo_mg = 179.05, potassio_mg = 270.01, cobre_mcg = 80 where nome = 'Carne, bovina, costela, assada' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 11.68, fosforo_mg = 129.97, potassio_mg = 151.16 where nome = 'Carne, bovina, costela, crua' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 18.21, fosforo_mg = 212.27, potassio_mg = 321.07, cobre_mcg = 80 where nome = 'Carne, bovina, cupim, assado' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 12.76, fosforo_mg = 220.13, potassio_mg = 150.58, cobre_mcg = 30 where nome = 'Carne, bovina, cupim, cru' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 18.35, fosforo_mg = 161.94, potassio_mg = 210.01, manganes_mg = 0.01, cobre_mcg = 80 where nome = 'Frango, caipira, inteiro, com pele, cozido' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 23.17, fosforo_mg = 209.6, potassio_mg = 223.59, manganes_mg = 0.02, cobre_mcg = 150 where nome = 'Frango, caipira, inteiro, sem pele, cozido' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 24.3, fosforo_mg = 173.55, potassio_mg = 217.24, manganes_mg = 0.01, cobre_mcg = 40 where nome = 'Frango, inteiro, com pele, cru' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 13.88, fosforo_mg = 232.94, potassio_mg = 283.27, cobre_mcg = 30 where nome = 'Frango, inteiro, sem pele, assado' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 12.35, fosforo_mg = 193.67, potassio_mg = 216.53, cobre_mcg = 40 where nome = 'Frango, inteiro, sem pele, cozido' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 27.04, fosforo_mg = 190.48, potassio_mg = 237.68, manganes_mg = 0.01, cobre_mcg = 30 where nome = 'Frango, inteiro, sem pele, cru' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 18.97, fosforo_mg = 181.51, potassio_mg = 279.73, manganes_mg = 0.05, cobre_mcg = 50 where nome = 'Lingüiça, frango, crua' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 29.19, fosforo_mg = 262.07, potassio_mg = 363.79, manganes_mg = 0.1, cobre_mcg = 40 where nome = 'Lingüiça, frango, frita' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 21.1, fosforo_mg = 228.02, potassio_mg = 356, manganes_mg = 0.1, cobre_mcg = 90 where nome = 'Lingüiça, frango, grelhada' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 14.05, fosforo_mg = 157.48, potassio_mg = 316.33, manganes_mg = 0.01, cobre_mcg = 40 where nome = 'Lingüiça, porco, crua' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 18.22, fosforo_mg = 210.78, potassio_mg = 408.94, manganes_mg = 0.01, cobre_mcg = 60 where nome = 'Lingüiça, porco, frita' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 18.79, fosforo_mg = 209.81, potassio_mg = 426.6, manganes_mg = 0.01, cobre_mcg = 70 where nome = 'Lingüiça, porco, grelhada' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 11.54, fosforo_mg = 197.36, potassio_mg = 175.12, manganes_mg = 0.02, cobre_mcg = 30 where nome = 'Peru, congelado, assado' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 2.07, fosforo_mg = 30.79, potassio_mg = 228.46, manganes_mg = 0.01, cobre_mcg = 230 where nome = 'Porco, orelha, salgada, crua' and fonte = 'TACO' and id_avaliador is null;
update public.tabela_alimentos set magnesio_mg = 3.6, fosforo_mg = 42.39, potassio_mg = 23.76, manganes_mg = 0.01, cobre_mcg = 50 where nome = 'Porco, rabo, salgado, cru' and fonte = 'TACO' and id_avaliador is null;
