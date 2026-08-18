-- Amplia o catálogo de etapas do funil (CRM.jsx) além do funil de vendas
-- puro (Lead → Agendado → Realizado → Ativo → Perdido), incluindo etapas
-- de acompanhamento do paciente já ativo ("Contatar Paciente",
-- "Aguardando Checkin Semanal") — ver ETAPAS em ModalLead.jsx.
--
-- Pra não poluir quem só quer o funil simples, cada nutricionista liga/
-- desliga quais etapas aparecem no board. Guardado em
-- configuracoes_avaliador (mesma tabela de tolerâncias/tema/etc já
-- upsertada por auth_id em Configuracoes.jsx), não em tabela nova.
alter table public.configuracoes_avaliador
  add column if not exists etapas_funil_ativas text[]
    not null default array['lead', 'agendado', 'realizado', 'ativo', 'perdido'];

-- Solta o check antigo de leads_funil.etapa (só tinha as 5 etapas
-- originais) e recria com o catálogo completo.
alter table public.leads_funil drop constraint if exists leads_funil_etapa_check;
alter table public.leads_funil
  add constraint leads_funil_etapa_check
  check (etapa in ('lead', 'contato', 'agendado', 'realizado', 'ativo', 'checkin', 'perdido'));
