-- Registra o momento em que um avaliador indicado vira Pro, pra contar os
-- 7 dias de carência (janela de arrependimento do CDC) antes do Marco
-- poder pagar a recompensa da indicação. Só marca uma vez (se
-- indicacao_virou_pro_em já tiver valor, não sobrescreve — evita resetar
-- o prazo se o plano for trocado/renovado depois).
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
  return new;
end;
$function$;

drop trigger if exists trg_marcar_indicacao_pro on public.avaliadores;
create trigger trg_marcar_indicacao_pro
  before update on public.avaliadores
  for each row execute function public.marcar_indicacao_pro();
