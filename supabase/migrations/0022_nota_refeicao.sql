-- Nota livre por refeição — o nutricionista escreve uma observação (ex.:
-- "pode trocar o horário se treinar à noite") que aparece pro paciente
-- logo abaixo dos macros daquela refeição, e precisa sobreviver ao salvar
-- a refeição/plano como modelo (favorito) e ao reaplicar um modelo depois.

alter table public.refeicoes_prescritas
  add column if not exists nota text;

alter table public.modelos_refeicoes
  add column if not exists nota text;

alter table public.modelos_planos_refeicoes
  add column if not exists nota text;
