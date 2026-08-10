-- Adiciona suporte a metas de macro definidas por percentual do VET,
-- alem do g/kg de peso corporal ja existente.
--
-- Guardamos os percentuais originais (proteina/carbo/lipidio_target_pct)
-- SEPARADAMENTE de proteina/carbo/lipidio_target_g_kg — o app sempre
-- deriva e persiste os g/kg (pra "Meta vs. Calculado" continuar
-- funcionando sem mudanca), mas se as colunas de percentual estiverem
-- preenchidas, o modal de edicao reabre no modo "Percentual do VET" com
-- os valores originais em vez dos gramas derivados.
--
-- Quando o plano usa modo g/kg (padrao), essas colunas ficam null.

alter table public.planos_alimentares
  add column if not exists proteina_target_pct numeric(5,2),
  add column if not exists carbo_target_pct     numeric(5,2),
  add column if not exists lipidio_target_pct   numeric(5,2);
