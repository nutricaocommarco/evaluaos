-- Se o indicado cancela a assinatura e sai do Pro antes de ser pago, a
-- indicação correspondente precisa ser cancelada (não pode virar
-- "provisionado" nem ser paga depois). Guarda o momento do cancelamento
-- pra manter o histórico visível (Configuracoes.jsx / aba Afiliados do
-- Financeiro), em vez de apagar os campos antigos.
alter table public.avaliadores add column if not exists indicacao_cancelada_em timestamptz;

-- Reaproveita a mesma trigger da migration 0104 (before update on
-- avaliadores) e acrescenta o caso inverso: sair de pro/ativo depois de já
-- ter virado Pro, sem nunca ter sido paga -> marca cancelada. Se já foi
-- paga antes de cancelar, não mexe (sem estorno retroativo, fora de escopo).
create or replace function public.marcar_indicacao_pro()
returns trigger
language plpgsql
as $function$
begin
  if new.indicado_por is not null
     and new.indicacao_virou_pro_em is null
     and new.plano_status in ('pro', 'ativo')
     and (old.plano_status is distinct from new.plano_status) then
    new.indicacao_virou_pro_em := now();
  end if;

  if new.indicado_por is not null
     and new.indicacao_virou_pro_em is not null
     and new.indicacao_paga_em is null
     and new.indicacao_cancelada_em is null
     and old.plano_status in ('pro', 'ativo')
     and new.plano_status not in ('pro', 'ativo') then
    new.indicacao_cancelada_em := now();
  end if;

  return new;
end;
$function$;
