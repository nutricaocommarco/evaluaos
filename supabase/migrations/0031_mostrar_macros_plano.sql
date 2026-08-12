-- Liga/desliga por plano: permite ao nutricionista esconder calorias e
-- macronutrientes (do plano todo e de cada refeição) na área do
-- paciente, deixando só a lista das refeições/itens prescritos. Útil
-- pra pacientes que não devem focar em números (TCA, ansiedade com
-- comida, etc). Default true pra não mudar o comportamento atual de
-- nenhum plano já existente.

alter table public.planos_alimentares
  add column if not exists mostrar_macros boolean not null default true;
