-- Adiciona 'Fabricante' como fonte válida em tabela_alimentos — produto
-- comercial (Whey, barras, YoPRO etc.) com dado de rótulo, público
-- (id_avaliador null, visível a todos os avaliadores), mas diferente de
-- 'Customizado' (que no app significa "alimento próprio de um avaliador
-- só"). Não mudamos a visibilidade (isso já é controlado por id_avaliador
-- via RLS) — só o rótulo/badge exibido na Tabela de Alimentos.

alter table public.tabela_alimentos drop constraint if exists tabela_alimentos_fonte_check;

alter table public.tabela_alimentos
  add constraint tabela_alimentos_fonte_check
  check (fonte in ('TACO', 'IBGE', 'USDA', 'Fabricante', 'Customizado'));
