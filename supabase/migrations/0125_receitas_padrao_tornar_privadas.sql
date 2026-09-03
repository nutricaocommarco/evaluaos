-- Correção: as 9 receitas cadastradas em 0124 tinham ido como públicas
-- (id_avaliador null), mas o usuário pediu que fiquem só na conta dele —
-- muda a ligação pra privada, tanto nas receitas quanto no alimento
-- sincronizado de cada uma (senão o alimento continuaria público mesmo
-- com a receita privada).

update public.receitas
set id_avaliador = 'e195f1d4-c7d2-41a0-bcdf-5c3b1b1f6a38'
where id_avaliador is null
  and nome in (
    'Pizza Proteica de Rap10',
    'Guacamole',
    'Bolo de Banana Proteico e Funcional',
    'Macarrão Funcional ao Sugo e Cúrcuma',
    'Geleia Funcional de Frutas Vermelhas e Laranja',
    'Geleia da Saciedade',
    'Muffins Proteicos de Frango com Legumes e Aveia',
    'Brigadeiro de Tâmara Proteico',
    'Pão de Queijo Fit Express'
  );

update public.tabela_alimentos
set id_avaliador = 'e195f1d4-c7d2-41a0-bcdf-5c3b1b1f6a38'
where id_avaliador is null
  and id_receita in (
    select id from public.receitas
    where id_avaliador = 'e195f1d4-c7d2-41a0-bcdf-5c3b1b1f6a38'
      and nome in (
        'Pizza Proteica de Rap10',
        'Guacamole',
        'Bolo de Banana Proteico e Funcional',
        'Macarrão Funcional ao Sugo e Cúrcuma',
        'Geleia Funcional de Frutas Vermelhas e Laranja',
        'Geleia da Saciedade',
        'Muffins Proteicos de Frango com Legumes e Aveia',
        'Brigadeiro de Tâmara Proteico',
        'Pão de Queijo Fit Express'
      )
  );
