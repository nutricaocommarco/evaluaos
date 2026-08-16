-- Check-in Semanal: reaproveita o motor de Questionários já existente.
-- Um questionário marcado como `recorrente_semanal` pode ser ativado por
-- paciente (Liga/Desliga individual, padrão desligado) — quando ativo, o
-- cron diário (só às segundas, ver api/cron/lembretes-agendamento.js) cria
-- um novo envio automaticamente toda semana.

alter table public.questionarios add column if not exists recorrente_semanal boolean not null default false;

alter table public.pacientes add column if not exists id_questionario_semanal bigint references public.questionarios(id) on delete set null;

create index if not exists idx_pacientes_questionario_semanal on public.pacientes(id_questionario_semanal);
