-- Parcelamento: divide um valor em N movimentações mensais, cada uma com
-- sua própria data — não é uma "molde" que gera cópias (como a
-- recorrência), as N linhas já nascem todas de uma vez. grupo_parcelamento
-- (uuid comum às N linhas) serve só pra agrupar visualmente/futuras
-- consultas; parcela_numero/parcela_total é o que aparece pro nutri
-- (ex: "Consulta (2/3)").
alter table public.movimentacoes_financeiras
  add column if not exists parcela_numero integer;

alter table public.movimentacoes_financeiras
  add column if not exists parcela_total integer;

alter table public.movimentacoes_financeiras
  add column if not exists grupo_parcelamento uuid;

create index if not exists idx_movimentacoes_grupo_parcelamento
  on public.movimentacoes_financeiras(grupo_parcelamento);
