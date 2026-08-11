-- Medida caseira nos substitutos — hoje só o item principal da refeição tem
-- unidade_medida/quantidade_medida (migration 0012). Substitutos só guardam
-- gramas, então o nutricionista não consegue descrever um substituto como
-- "0,5 filé médio" — só "55g". Mesmas 2 colunas, mesmo espírito (puramente
-- informativo/de exibição — quantidade_g continua sendo o valor usado nos
-- cálculos de macro).

alter table public.substitutos_item
  add column if not exists unidade_medida     text,
  add column if not exists quantidade_medida  numeric(8,2);

alter table public.modelos_refeicoes_itens_substitutos
  add column if not exists unidade_medida     text,
  add column if not exists quantidade_medida  numeric(8,2);

alter table public.modelos_planos_itens_substitutos
  add column if not exists unidade_medida     text,
  add column if not exists quantidade_medida  numeric(8,2);
