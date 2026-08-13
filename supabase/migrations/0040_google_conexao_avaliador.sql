-- Conexão OAuth do Google Calendar, por nutricionista (não é a conta do
-- dono da plataforma — cada nutricionista autoriza a própria conta
-- Google na tela de Integrações do Painel do Nutricionista).
--
-- avaliadores_google_conexao é a PRIMEIRA tabela do app com RLS
-- habilitado e ZERO policies — de propósito. access_token/refresh_token
-- são segredo puro (dão acesso à agenda real do Google da pessoa), não
-- dado de app comum como o resto da base (que sempre segue o padrão
-- client + anon key + RLS por auth.uid()). Sem nenhuma policy, nem anon
-- nem authenticated conseguem ler/escrever aqui de jeito nenhum — só um
-- client construído com SUPABASE_SERVICE_ROLE_KEY (que ignora RLS)
-- consegue, e essa chave só existe como env var nas funções serverless
-- (api/google/*.js), nunca no client. Ver plano do módulo de Agenda.
create table if not exists public.avaliadores_google_conexao (
  id_avaliador   uuid primary key references auth.users(id) on delete cascade,
  google_email   text,
  access_token   text,
  refresh_token  text,
  token_expiry   timestamptz,
  escopo         text,
  conectado_em   timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.avaliadores_google_conexao enable row level security;
-- Nenhuma policy criada aqui de propósito — ver comentário acima.

-- Colunas de status em avaliadores (não-secretas, mesmo acesso normal
-- de qualquer outra coluna dessa tabela) — só pra frontend mostrar
-- "conectado como fulano@gmail.com" sem precisar ler a tabela de token.
alter table public.avaliadores
  add column if not exists google_calendar_conectado boolean not null default false;

alter table public.avaliadores
  add column if not exists google_calendar_email text;
