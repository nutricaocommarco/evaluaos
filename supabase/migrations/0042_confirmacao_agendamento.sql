-- Confirmação de presença via link (substitui a ideia de "responda SIM"
-- no WhatsApp — como o app não processa respostas recebidas, um link
-- clicável é muito mais confiável que tentar interpretar texto livre).
--
-- token_confirmacao é próprio de cada agendamento (não reaproveita o
-- token do paciente nem token de outras tabelas) — o link do lembrete
-- do WhatsApp aponta pra ele, e a confirmação em si é feita por uma
-- função serverless com service role (api/agendamentos/confirmar.js),
-- não por escrita direta do anon key — mesmo padrão de segurança já
-- usado pra conexão do Google.
alter table public.agendamentos
  add column if not exists token_confirmacao uuid not null default gen_random_uuid() unique;

alter table public.agendamentos
  add column if not exists confirmado_pelo_paciente boolean not null default false;

alter table public.agendamentos
  add column if not exists confirmado_em timestamptz;
