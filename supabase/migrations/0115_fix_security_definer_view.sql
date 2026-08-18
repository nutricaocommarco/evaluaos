-- Fix do alerta "Security Definer View" do Supabase Security Advisor em
-- public.indicacoes_a_pagar (migration 0105/0111).
--
-- Views no Postgres, por padrão, avaliam RLS das tabelas usadas com o
-- papel de quem CRIOU a view (normalmente postgres/superuser, que ignora
-- RLS) e não de quem está consultando — na prática o mesmo problema de
-- uma função security definer. Como o Supabase expõe toda view do schema
-- public via API REST, isso significa que qualquer usuário autenticado
-- que desse um GET direto em /rest/v1/indicacoes_a_pagar (fora do app,
-- sem passar pela UI) veria os dados de TODOS os nutricionistas — nome,
-- e-mail, chave Pix, valor a pagar — não só os próprios.
--
-- security_invoker = true (Postgres 15+) faz a view avaliar RLS com o
-- papel de quem consulta, igual uma tabela normal.
alter view public.indicacoes_a_pagar set (security_invoker = true);

-- Reforço: essa view só é usada por Marco direto no SQL Editor (como
-- postgres, que ignora esses grants) e pelo cron diário (service role,
-- que ignora RLS/grants também) — nenhum código do app consulta ela pela
-- API. Tira o acesso via REST de anon/authenticated, já que ninguém
-- deveria estar batendo nela por ali.
revoke all on public.indicacoes_a_pagar from anon, authenticated;
grant select on public.indicacoes_a_pagar to service_role;
