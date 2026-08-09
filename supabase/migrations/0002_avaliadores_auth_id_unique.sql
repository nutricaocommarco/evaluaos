-- Corrige a causa raiz da duplicação de linhas em public.avaliadores.
--
-- Login.jsx fazia um "SELECT ... maybeSingle() -> se não achou, INSERT"
-- a cada login, sem constraint nenhuma garantindo unicidade de auth_id.
-- Em condições de corrida (ex.: a checagem SELECT falha por qualquer
-- instabilidade momentânea logo após o signInWithPassword), isso cria
-- uma linha nova com plano_status='gratis'. Com múltiplas linhas para o
-- mesmo auth_id, qualquer .maybeSingle() por auth_id/email no app passa
-- a dar erro (PGRST116 - mais de uma linha) e o app cai no fallback
-- 'gratis', mesmo com uma das linhas duplicadas tendo plano_status='pro'.
--
-- Pré-requisito: rodar a limpeza de duplicatas ANTES desta migration
-- (este ALTER falha se ainda houver auth_id repetido). O código em
-- Login.jsx foi trocado para um upsert(..., { onConflict: 'auth_id',
-- ignoreDuplicates: true }), que só funciona corretamente com esta
-- constraint no ar.

alter table public.avaliadores
  add constraint avaliadores_auth_id_key unique (auth_id);
