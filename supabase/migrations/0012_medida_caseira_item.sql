-- Medida caseira por item da refeição (colher de sopa, copo americano,
-- concha, ml...) — puramente informativo/de exibição. quantidade_g continua
-- sendo a única fonte usada nos cálculos de macro; estas duas colunas só
-- guardam "como foi digitado" pra mostrar de volta na tela (ex: "2 colheres
-- de sopa (~30g)" em vez de só "30g"). Nulo = item antigo ou digitado
-- direto em gramas, comportamento igual ao de antes desta migration.

alter table public.itens_refeicao
  add column if not exists unidade_medida     text,
  add column if not exists quantidade_medida  numeric(8,2);
