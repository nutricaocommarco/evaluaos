-- Corrige o grupo padrão "Frutas" (grupos_alimentos_modelo, id=6, oficial):
-- "Abacate, cru" estava em ordem=0. inserirGrupoAlimentos() (PlanoAlimentar.jsx)
-- sempre usa o item de MENOR ordem como o alimento PRINCIPAL do item
-- inserido (o que entra de verdade no cálculo de kcal/macro) — as
-- outras 14 frutas do grupo viravam só "substitutos" de exibição, que
-- NÃO contam pro total. Resultado: toda vez que um nutricionista usava
-- "+ Adicionar grupo" > Frutas, o item saía com os macros do abacate
-- (rico em gordura, ~96kcal/8g de gordura por 100g) em vez de uma fruta
-- comum — sumia quase todo o carboidrato esperado e aparecia gordura
-- que nenhuma fruta da lista de troca realmente tem.
--
-- Troca de posição com "Maçã, Fuji, com casca, crua" (fruta comum,
-- praticamente zero gordura) — abacate continua na lista de opções,
-- só deixa de ser o padrão usado no cálculo.
--
-- OBS: planos já criados ANTES desta correção (ex.: o item "Frutas" já
-- cadastrado pro paciente) não são corrigidos por este UPDATE — o dado já
-- foi copiado pra itens_refeicao no momento em que o grupo foi
-- adicionado. Precisa corrigir item por item já existente separadamente.

update public.grupos_alimentos_modelo_itens set ordem = 5 where id_grupo = 6 and id_alimento = 163; -- Abacate, cru
update public.grupos_alimentos_modelo_itens set ordem = 0 where id_grupo = 6 and id_alimento = 222; -- Maçã, Fuji, com casca, crua
