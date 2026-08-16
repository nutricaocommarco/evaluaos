-- Data de vencimento, pra alimentar a aba de Pendências (lista tudo que
-- ainda não foi pago, ordenado por vencimento, com destaque pro atrasado).
alter table public.movimentacoes_financeiras
  add column if not exists data_vencimento date;

create index if not exists idx_movimentacoes_pendentes
  on public.movimentacoes_financeiras(data_vencimento)
  where pago = false;
