-- Liga/Desliga da comparação de micronutrientes pro paciente, mesmo
-- padrão de mostrar_macros (migration correspondente do Plano
-- Alimentar). Começa desligado por padrão — diferente de mostrar_macros
-- (que é opt-out) — porque é uma seção nova e mais densa de informação;
-- o nutricionista decide ativar por plano.
alter table public.planos_alimentares
  add column if not exists mostrar_micronutrientes boolean not null default false;
