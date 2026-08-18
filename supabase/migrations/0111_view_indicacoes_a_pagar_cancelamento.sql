-- Atualiza a view da migration 0105: exclui indicações canceladas (saíram
-- do Pro antes de pagar, ver 0110) e acrescenta mes_pagamento -- 1º dia do
-- mês seguinte ao mês em que os 7 dias de carência terminaram (liberado_em),
-- que é quando o pagamento de verdade é feito (1ª semana daquele mês).
create or replace view public.indicacoes_a_pagar as
select
  indicado.id as id_indicado,
  indicado.nome_completo as indicado_nome,
  indicado.email as indicado_email,
  indicado.periodicidade_plano,
  indicador.id as id_indicador,
  indicador.nome_completo as indicador_nome,
  indicador.email as indicador_email,
  indicador.chave_pix as indicador_pix,
  case indicado.periodicidade_plano
    when 'mensal' then 5.00
    when 'anual' then 50.00
  end as valor_a_pagar,
  indicado.indicacao_virou_pro_em,
  indicado.indicacao_virou_pro_em + interval '7 days' as liberado_em,
  date_trunc('month', indicado.indicacao_virou_pro_em + interval '7 days') + interval '1 month' as mes_pagamento
from public.avaliadores indicado
join public.avaliadores indicador on indicador.id = indicado.indicado_por
where indicado.indicacao_virou_pro_em is not null
  and indicado.indicacao_cancelada_em is null
  and indicado.indicacao_paga_em is null
  and indicado.indicacao_virou_pro_em + interval '7 days' <= now()
order by indicado.indicacao_virou_pro_em;
