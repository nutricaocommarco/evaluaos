-- Remove a "Faixa de referência (g/kg)" de planos_alimentares (migration
-- 0005) — feature descartada: o card de metas já mostra consumido/meta em
-- gramas totais E em g/kg lado a lado, o que cobre a mesma necessidade sem
-- precisar de um segundo intervalo min/max pra manter.

alter table public.planos_alimentares
  drop column if exists proteina_target_g_kg_min,
  drop column if exists proteina_target_g_kg_max,
  drop column if exists carbo_target_g_kg_min,
  drop column if exists carbo_target_g_kg_max,
  drop column if exists lipidio_target_g_kg_min,
  drop column if exists lipidio_target_g_kg_max;
