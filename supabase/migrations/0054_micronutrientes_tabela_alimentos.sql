-- Colunas de micronutrientes que faltavam em tabela_alimentos — a TACO já
-- populava cálcio/ferro/sódio/zinco/vitaminas A/C/D/B1/B2/B3/B6/B12 desde a
-- 0001, mas faltavam as que aparecem nas tabelas de DRI (Dietary Reference
-- Intakes) que vamos comparar o plano contra (ver 0055). Nenhum valor é
-- preenchido aqui — isso é só a coluna; popular vem depois (USDA
-- FoodData Central, domínio público, complementando a TACO que não mede
-- vários desses).
alter table public.tabela_alimentos
  add column if not exists magnesio_mg numeric(10,3),
  add column if not exists fosforo_mg numeric(10,3),
  add column if not exists potassio_mg numeric(10,3),
  add column if not exists cobre_mcg numeric(10,3),
  add column if not exists selenio_mcg numeric(10,3),
  add column if not exists iodo_mcg numeric(10,3),
  add column if not exists manganes_mg numeric(10,3),
  add column if not exists folato_mcg numeric(10,3),
  add column if not exists vitamina_e_mg numeric(10,3),
  add column if not exists vitamina_k_mcg numeric(10,3),
  add column if not exists cromo_mcg numeric(10,3),
  add column if not exists molibdenio_mcg numeric(10,3),
  add column if not exists colina_mg numeric(10,3),
  add column if not exists acido_pantotenico_mg numeric(10,3),
  add column if not exists biotina_mcg numeric(10,3);
