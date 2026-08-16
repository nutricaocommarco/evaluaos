-- Cria automaticamente um questionário "Check-in Semanal" pronto (Peso +
-- Refeições livres) pra cada avaliador — existentes (backfill abaixo) e
-- futuros (trigger em avaliadores). O nutricionista não precisa montar
-- nada do zero; só liga o Check-in Semanal em cada paciente que quiser
-- (Ficha do Paciente > Questionários) e pode editar/adicionar perguntas
-- nesse questionário normalmente depois, como qualquer outro.

create or replace function public.criar_checkin_semanal_padrao(p_id_avaliador uuid)
returns void as $$
declare
  v_questionario_id bigint;
  v_etapa_id bigint;
begin
  if exists (
    select 1 from public.questionarios
    where id_avaliador = p_id_avaliador and recorrente_semanal = true
  ) then
    return;
  end if;

  insert into public.questionarios (id_avaliador, titulo, recorrente_semanal)
  values (p_id_avaliador, 'Check-in Semanal', true)
  returning id into v_questionario_id;

  insert into public.questionario_etapas (id_questionario, titulo, ordem)
  values (v_questionario_id, 'Check-in', 0)
  returning id into v_etapa_id;

  insert into public.questionario_perguntas (id_etapa, tipo, texto, campo_especial, obrigatoria, ordem)
  values
    (v_etapa_id, 'numero', 'Qual foi seu peso hoje? (medido em jejum, pela manhã)', 'peso', true, 0),
    (v_etapa_id, 'numero', 'Qual sua altura? (em cm)', 'altura', false, 1),
    (v_etapa_id, 'numero', 'Quantas refeições livres você fez na última semana?', null, false, 2);
end;
$$ language plpgsql security definer;

-- Trigger: todo avaliador novo já nasce com o Check-in Semanal pronto.
create or replace function public.trigger_criar_checkin_semanal_padrao()
returns trigger as $$
begin
  perform public.criar_checkin_semanal_padrao(new.auth_id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_criar_checkin_semanal_padrao on public.avaliadores;
create trigger trg_criar_checkin_semanal_padrao
  after insert on public.avaliadores
  for each row execute function public.trigger_criar_checkin_semanal_padrao();

-- Backfill: avaliadores que já existem.
do $$
declare
  aval record;
begin
  for aval in select auth_id from public.avaliadores loop
    perform public.criar_checkin_semanal_padrao(aval.auth_id);
  end loop;
end $$;
