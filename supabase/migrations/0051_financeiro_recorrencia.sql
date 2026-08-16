-- Recorrência mensal: uma movimentação marcada como recorrente = true vira
-- o "molde" pra gerar automaticamente uma cópia todo mês (via cron, ver
-- api/cron/lembretes-agendamento.js). id_origem aponta a cópia gerada de
-- volta pro molde, tanto pra badge visual quanto pra o cron saber se já
-- gerou a cópia daquele mês antes de gerar de novo.
alter table public.movimentacoes_financeiras
  add column if not exists recorrente boolean not null default false;

alter table public.movimentacoes_financeiras
  add column if not exists id_origem bigint references public.movimentacoes_financeiras(id) on delete set null;

create index if not exists idx_movimentacoes_origem on public.movimentacoes_financeiras(id_origem);
