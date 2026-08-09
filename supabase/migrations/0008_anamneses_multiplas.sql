-- Anamnese deixa de ser um documento único por paciente (migration 0006) e
-- passa a ser um histórico — várias entradas por paciente, cada uma
-- vinculada a uma consulta/prontuário específica. Mesmo padrão de "registro
-- filho" já usado em refeicoes_prescritas/itens_refeicao.

-- Remove a restrição de "só um registro por paciente" — agora o paciente
-- pode ter N anamneses.
drop index if exists idx_anamneses_paciente_unico;

alter table public.anamneses
  add column if not exists id_prontuario bigint references public.prontuarios(id) on delete cascade,
  add column if not exists created_at timestamptz not null default now();

create index if not exists idx_anamneses_prontuario on public.anamneses(id_prontuario);
create index if not exists idx_anamneses_paciente on public.anamneses(id_paciente);
