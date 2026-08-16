-- Plano tipo "Qualitativo": modo alternativo de prescrição em texto livre,
-- pra quando o nutricionista não precisa calcular macros/quantidades.
-- Reaproveita a tabela planos_alimentares (mesmo histórico, troca entre
-- planos e liga/desliga de visibilidade que já existem) em vez de criar uma
-- tabela paralela — só adiciona o modo e o texto livre. Pra um plano
-- qualitativo, refeicoes_prescritas/itens_refeicao simplesmente ficam
-- vazios; o front-end pula direto pro editor de texto quando modo =
-- 'qualitativo'. Nenhuma mudança de RLS é necessária — as policies já
-- cobrem a linha inteira.
alter table public.planos_alimentares
  add column if not exists modo text not null default 'quantitativo'
    check (modo in ('quantitativo', 'qualitativo'));

alter table public.planos_alimentares
  add column if not exists conteudo text;
