-- CRN/CREF/NUMEP do nutricionista — já era coletado na tela de cadastro
-- (Login.jsx) mas nunca foi salvo (o insert em avaliadores não incluía o
-- campo). Corrigido junto com esta migration: agora persiste no signup e
-- fica editável no Painel do Nutricionista. Usado no PDF de solicitação
-- de exames — quando o valor for literalmente 'Estudante', o PDF mostra
-- "Pedido sem Validade - Estudante" no lugar do número.

alter table public.avaliadores
  add column if not exists crn_numep text;
