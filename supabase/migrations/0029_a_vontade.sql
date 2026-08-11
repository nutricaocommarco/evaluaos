-- "À Vontade" — alimentos que não fazem sentido pesar (folhas, alguns
-- legumes, coisas que não têm risco real de descontrole calórico em
-- porção normal). Até aqui todo item/substituto exigia uma quantidade em
-- gramas; agora quantidade_g pode ficar em branco quando o item é
-- marcado como "à vontade" — sem peso definido, sem entrar no cálculo de
-- macros do item (0 kcal/0g), só o nome do alimento aparece pro paciente
-- com a etiqueta "à vontade" em vez de um peso.

alter table public.itens_refeicao
  alter column quantidade_g drop not null;

alter table public.substitutos_item
  alter column quantidade_g drop not null;

alter table public.modelos_refeicoes_itens
  alter column quantidade_g drop not null;

alter table public.modelos_planos_itens
  alter column quantidade_g drop not null;

alter table public.modelos_refeicoes_itens_substitutos
  alter column quantidade_g drop not null;

alter table public.modelos_planos_itens_substitutos
  alter column quantidade_g drop not null;
