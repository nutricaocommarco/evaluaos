-- Hoje o app do paciente herda cegamente o dark_mode configurado pelo
-- NUTRICIONISTA (configuracoes_avaliador) — se o nutri muda o tema dele
-- próprio, todo paciente dele muda junto, sem controle individual.
-- tema_dark_mode permite travar um tema por paciente, independente do
-- que o nutricionista tem configurado: null = segue o padrão do
-- nutricionista (comportamento de hoje), true = força escuro, false =
-- força claro, só pra aquele paciente específico.
alter table public.pacientes add column if not exists tema_dark_mode boolean;

comment on column public.pacientes.tema_dark_mode is 'Tema forçado no app desse paciente (true=escuro, false=claro, null=segue o padrão do nutricionista).';
