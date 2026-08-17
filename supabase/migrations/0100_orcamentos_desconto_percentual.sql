-- Campo de desconto, adicionado depois que a migration 0099 já tinha sido
-- rodada em produção — por isso vem como patch separado em vez de editar
-- 0099 (que já rodou). Desconto podia só ser valor fixo em R$; agora
-- também dá pra escolher % (ex: "10% de desconto" em vez de digitar o
-- valor calculado na mão). `desconto` guarda o número que o
-- nutricionista digitou (10 pra 10%, ou 50 pra R$ 50) — `desconto_tipo`
-- diz como interpretar.
alter table public.orcamentos add column if not exists desconto numeric(10,2) not null default 0;
alter table public.orcamentos add column if not exists desconto_tipo text not null default 'fixo' check (desconto_tipo in ('fixo', 'percentual'));
