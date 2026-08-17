-- Painel de controle do Marco pras indicações prontas pra pagar: já virou
-- Pro, já passou os 7 dias de carência, e ainda não foi paga. Consulta
-- direto no Supabase (mesmo lugar onde ele já libera Pro manualmente hoje).
--
-- Pra marcar como pago depois de mandar o Pix:
--   update public.avaliadores set indicacao_paga_em = now() where id = <id_indicado>;
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
  indicado.indicacao_virou_pro_em + interval '7 days' as liberado_em
from public.avaliadores indicado
join public.avaliadores indicador on indicador.id = indicado.indicado_por
where indicado.indicacao_virou_pro_em is not null
  and indicado.indicacao_paga_em is null
  and indicado.indicacao_virou_pro_em + interval '7 days' <= now()
order by indicado.indicacao_virou_pro_em;
