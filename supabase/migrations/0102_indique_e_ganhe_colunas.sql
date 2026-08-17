-- Indique & Ganhe com recompensa em Pix (R$5 mensal / R$50 anual, liberado
-- 7 dias após o indicado virar Pro — janela de arrependimento do CDC).
--
-- codigo_indicacao: token do link de indicação de cada avaliador, mesmo
-- padrão de token_publico já usado em pacientes/orcamentos/exames_solicitacoes.
--
-- indicado_por: quem trouxe esse avaliador. Setado só na criação da conta
-- (via handle_new_user(), migration seguinte) — não editável depois.
--
-- periodicidade_plano: hoje não existe NENHUM lugar que registre se o Pro
-- de alguém é mensal ou anual (só existe plano_status). Fica manual, junto
-- com a liberação do Pro que o Marco já faz direto no Supabase — só passa
-- a setar esse campo também na mesma hora.
--
-- indicacao_virou_pro_em: preenchido sozinho pela trigger
-- marcar_indicacao_pro() (migration seguinte) na primeira vez que
-- plano_status vira 'pro'/'ativo'.
--
-- indicacao_paga_em: só o Marco seta, manualmente, quando paga o Pix.
alter table public.avaliadores add column if not exists codigo_indicacao uuid not null default gen_random_uuid() unique;
alter table public.avaliadores add column if not exists indicado_por bigint references public.avaliadores(id) on delete set null;
alter table public.avaliadores add column if not exists periodicidade_plano text check (periodicidade_plano in ('mensal', 'anual'));
alter table public.avaliadores add column if not exists indicacao_virou_pro_em timestamptz;
alter table public.avaliadores add column if not exists indicacao_paga_em timestamptz;

create index if not exists idx_avaliadores_indicado_por on public.avaliadores(indicado_por);
