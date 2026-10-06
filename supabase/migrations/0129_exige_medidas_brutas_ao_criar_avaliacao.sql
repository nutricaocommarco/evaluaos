-- Trava de segurança: não deixa CRIAR uma avaliação sem as leituras brutas
-- (1ª/2ª/3ª medida) em medidas_brutas.
--
-- Motivo: uma versão antiga do app (aba/PWA que não recarregou depois do
-- deploy do commit "Guarda as 3 medidas brutas") salvava a avaliação só com
-- o valor final — a triplicata se perdia sem nenhum aviso (ex.: avaliações 44
-- e 45 de 06/10/2026). Com esta trava, um app desatualizado recebe um erro
-- claro na hora de salvar, o rascunho local continua intacto (ele só é
-- apagado após salvar com sucesso) e basta recarregar a página.
--
-- Só vale pra INSERT: atualizações (ex.: ligar/desligar visibilidade pro
-- paciente) e avaliações antigas, que têm medidas_brutas nulo, não são
-- afetadas.

create or replace function public.exigir_medidas_brutas_na_avaliacao()
returns trigger
language plpgsql
as $$
begin
  if new.medidas_brutas is null then
    raise exception 'Seu EvaluaOS está desatualizado e não consegue guardar as 3 medidas. Recarregue a página (Ctrl+F5, ou feche e abra o app instalado) e salve de novo — o que você digitou fica guardado.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_exigir_medidas_brutas_na_avaliacao on public.avaliacoes;

create trigger trg_exigir_medidas_brutas_na_avaliacao
  before insert on public.avaliacoes
  for each row
  execute function public.exigir_medidas_brutas_na_avaliacao();
