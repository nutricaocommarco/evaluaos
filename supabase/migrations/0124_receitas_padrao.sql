-- As 9 receitas padrão mandadas pelo usuário, no mesmo espírito dos grupos
-- de alimentos padrão (migration 0122): id_avaliador null = visível pra
-- todo nutricionista. Cada uma entra com habilitado_planos = true e já
-- ganha o alimento sincronizado em tabela_alimentos (nutrientes por 100g
-- derivados do total/peso_final_g, mesma fórmula que a tela de Receitas
-- usa ao habilitar uma receita pela UI) — assim já aparecem na busca de
-- alimento de qualquer Plano Alimentar assim que essa migration roda.

do $$
declare
  v_id_receita bigint;
  v_id_alimento bigint;
begin

  -- 1) Pizza Proteica de Rap10
  insert into public.receitas (
    id_avaliador, nome, descricao, peso_final_g, rendimento_porcoes, tempo_preparo_min, tags, modo_preparo,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g,
    gorduras_saturadas_g, gorduras_trans_g, colesterol_mg, calcio_mg, ferro_mg, magnesio_mg, fosforo_mg,
    potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg, selenio_mcg, vitamina_a_mcg, tiamina_mg,
    riboflavina_mg, niacina_mg, vitamina_b6_mg, folato_mcg, vitamina_b12_mcg, vitamina_c_mg, vitamina_d_mcg, vitamina_e_mg
  ) values (
    null, 'Pizza Proteica de Rap10',
    'Uma estratégia gastronômica altamente eficiente para incluir no planejamento alimentar de pacientes que possuem forte apego afetivo por pizzas e massas em geral. Essa preparação substitui a massa tradicional de fermentação longa por uma base de tortilha integral fina (tipo Rap10), reduzindo drasticamente o aporte de carboidratos refinados e gorduras saturadas deletérias encontradas em pizzas comerciais.',
    220, 1, 8, array['Comfort Food','Jantar Leve','Praticidade'],
    $html$<p><strong>Ingredientes</strong></p><ul><li>Massa: 1 unidade de Rap10 Integral (para maior aporte de fibras para o intestino).</li><li>Base proteica: 100g de peito de frango desfiado e temperado (ou patinho moído cozido).</li><li>Queijo (Lipídios controlados): 30g de queijo muçarela ralado ou picado.</li><li>Molho: 2 colheres de sopa de molho de tomate caseiro ou extrato de tomate (evita excesso de conservantes por conta do refluxo).</li><li>Toque final: Orégano a gosto e rodelas finas de tomate.</li></ul><p><strong>Modo de Preparo</strong></p><ol><li>Pré-aquecimento da massa: Em uma frigideira antiaderente seca, coloque o Rap10 em fogo baixo por cerca de 1 a 2 minutos de um lado, apenas para começar a dourar e ficar crocante.</li><li>Montagem: Vire a massa na frigideira (ou coloque-a em uma assadeira se preferir fazer no forno/Airfryer). Espalhe o molho de tomate por toda a superfície.</li><li>Recheio proteico: Distribua o frango desfiado uniformemente para garantir a densidade de proteínas da refeição.</li><li>Cobertura: Cubra com a muçarela, as rodelas de tomate e salpique o orégano.</li><li>Derretimento: Tampe a frigideira e mantenha em fogo bem baixo até o queijo derreter completamente e a massa ficar bem crocante. Se usar a Airfryer, coloque a 180°C por cerca de 4 a 5 minutos.</li></ol>$html$,
    364.1, 42.381, 12.67, 18.74, 3.555,
    6.345, 0.246, 111.86, 243.596, 1.09, 33.94, 449.714,
    606.65, 501.39, 1.958, 0.086, 0.055, 5.506, 58.938, 0.131,
    0.065, 24.83, 0.033, 5.726, 0.735, 4.645, 0.129, 0.169
  ) returning id into v_id_receita;

  insert into public.tabela_alimentos (
    id_avaliador, nome, categoria, fonte, id_receita, medida_caseira_unidade, medida_caseira_desc, medida_caseira_g,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g,
    gorduras_saturadas_g, gorduras_trans_g, colesterol_mg, calcio_mg, ferro_mg, magnesio_mg, fosforo_mg,
    potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg, selenio_mcg, vitamina_a_mcg, tiamina_mg,
    riboflavina_mg, niacina_mg, vitamina_b6_mg, folato_mcg, vitamina_b12_mcg, vitamina_c_mg, vitamina_d_mcg, vitamina_e_mg
  )
  select null, r.nome, 'Receita', 'Customizado', r.id, 'unidade', '1 porção', r.peso_final_g / nullif(r.rendimento_porcoes, 0),
    r.energia_kcal*100/r.peso_final_g, r.proteina_g*100/r.peso_final_g, r.lipidios_g*100/r.peso_final_g, r.carboidrato_g*100/r.peso_final_g, r.fibra_g*100/r.peso_final_g,
    r.gorduras_saturadas_g*100/r.peso_final_g, r.gorduras_trans_g*100/r.peso_final_g, r.colesterol_mg*100/r.peso_final_g, r.calcio_mg*100/r.peso_final_g, r.ferro_mg*100/r.peso_final_g, r.magnesio_mg*100/r.peso_final_g, r.fosforo_mg*100/r.peso_final_g,
    r.potassio_mg*100/r.peso_final_g, r.sodio_mg*100/r.peso_final_g, r.zinco_mg*100/r.peso_final_g, r.cobre_mcg*100/r.peso_final_g, r.manganes_mg*100/r.peso_final_g, r.selenio_mcg*100/r.peso_final_g, r.vitamina_a_mcg*100/r.peso_final_g, r.tiamina_mg*100/r.peso_final_g,
    r.riboflavina_mg*100/r.peso_final_g, r.niacina_mg*100/r.peso_final_g, r.vitamina_b6_mg*100/r.peso_final_g, r.folato_mcg*100/r.peso_final_g, r.vitamina_b12_mcg*100/r.peso_final_g, r.vitamina_c_mg*100/r.peso_final_g, r.vitamina_d_mcg*100/r.peso_final_g, r.vitamina_e_mg*100/r.peso_final_g
  from public.receitas r where r.id = v_id_receita
  returning id into v_id_alimento;

  update public.receitas set id_alimento_sincronizado = v_id_alimento, habilitado_planos = true where id = v_id_receita;


  -- 2) Guacamole
  insert into public.receitas (
    id_avaliador, nome, descricao, peso_final_g, rendimento_porcoes, tempo_preparo_min, tags, modo_preparo,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g,
    gorduras_saturadas_g, gorduras_trans_g, calcio_mg, ferro_mg, magnesio_mg, fosforo_mg,
    potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg, vitamina_a_mcg, tiamina_mg,
    riboflavina_mg, vitamina_b6_mg, vitamina_c_mg
  ) values (
    null, 'Guacamole',
    'O guacamole é uma excelente fonte de gorduras monoinsaturadas, que ajudam na saciedade e no controle glicêmico. Combine com ovos, frango desfiado, saladas ou como acompanhamento de legumes crus.',
    200, 2, 5, array['Anti-Inflamatório','Praticidade','Saúde Cardiovascular'],
    $html$<p><strong>Ingredientes</strong></p><ul><li>1/2 abacate maduro</li><li>1/2 cebola picada</li><li>1 dente de alho amassado</li><li>1 tomate pequeno picado (sem sementes)</li><li>Suco de 1 limão</li><li>Salsa e cebolinha a gosto</li><li>Sal a gosto</li></ul><p><strong>Modo de preparo:</strong></p><ul><li>Amasse o abacate com um garfo até obter uma textura cremosa.</li><li>Acrescente a cebola, o alho, o tomate, o suco de limão, a salsa, a cebolinha e o sal. Misture bem até ficar homogêneo.</li><li>Leve à geladeira por 15 a 20 minutos antes de servir para realçar o sabor.</li></ul>$html$,
    242.5, 4.315, 18.28, 22.225, 15.635,
    4.945, 3.01, 45.2, 0.72, 48.2, 84,
    715.8, 1.45, 0.645, 0.391, 0.488, 20.25, 0.209,
    0.1, 0.064, 49.62
  ) returning id into v_id_receita;

  insert into public.tabela_alimentos (
    id_avaliador, nome, categoria, fonte, id_receita, medida_caseira_unidade, medida_caseira_desc, medida_caseira_g,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g,
    gorduras_saturadas_g, gorduras_trans_g, calcio_mg, ferro_mg, magnesio_mg, fosforo_mg,
    potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg, vitamina_a_mcg, tiamina_mg,
    riboflavina_mg, vitamina_b6_mg, vitamina_c_mg
  )
  select null, r.nome, 'Receita', 'Customizado', r.id, 'unidade', '1 porção', r.peso_final_g / nullif(r.rendimento_porcoes, 0),
    r.energia_kcal*100/r.peso_final_g, r.proteina_g*100/r.peso_final_g, r.lipidios_g*100/r.peso_final_g, r.carboidrato_g*100/r.peso_final_g, r.fibra_g*100/r.peso_final_g,
    r.gorduras_saturadas_g*100/r.peso_final_g, r.gorduras_trans_g*100/r.peso_final_g, r.calcio_mg*100/r.peso_final_g, r.ferro_mg*100/r.peso_final_g, r.magnesio_mg*100/r.peso_final_g, r.fosforo_mg*100/r.peso_final_g,
    r.potassio_mg*100/r.peso_final_g, r.sodio_mg*100/r.peso_final_g, r.zinco_mg*100/r.peso_final_g, r.cobre_mcg*100/r.peso_final_g, r.manganes_mg*100/r.peso_final_g, r.vitamina_a_mcg*100/r.peso_final_g, r.tiamina_mg*100/r.peso_final_g,
    r.riboflavina_mg*100/r.peso_final_g, r.vitamina_b6_mg*100/r.peso_final_g, r.vitamina_c_mg*100/r.peso_final_g
  from public.receitas r where r.id = v_id_receita
  returning id into v_id_alimento;

  update public.receitas set id_alimento_sincronizado = v_id_alimento, habilitado_planos = true where id = v_id_receita;


  -- 3) Bolo de Banana Proteico e Funcional
  insert into public.receitas (
    id_avaliador, nome, peso_final_g, rendimento_porcoes, tempo_preparo_min, tags, modo_preparo,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g,
    gorduras_saturadas_g, gorduras_trans_g, colesterol_mg, calcio_mg, ferro_mg, magnesio_mg, fosforo_mg,
    potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg, selenio_mcg, vitamina_a_mcg, tiamina_mg,
    riboflavina_mg, niacina_mg, vitamina_b6_mg, folato_mcg, vitamina_b12_mcg, vitamina_c_mg, vitamina_d_mcg, vitamina_e_mg
  ) values (
    null, 'Bolo de Banana Proteico e Funcional',
    195, 1, 5, array['Airfryer','Praticidade','Saúde Intestinal','Sobremesa'],
    $html$<p><strong>Ingredientes:</strong></p><ul><li>1 banana madura amassada</li><li>1 ovo inteiro</li><li>2 colheres de sopa de farelo de aveia (opte pelo farelo para maior teor de fibras)</li><li>1 colher de chá de fermento químico</li><li>Canela em pó a gosto</li><li>(Opcional) 1 colher de chá de cacau em pó 100%</li><li>(Opcional) 1 colher de sobremesa de doce de leite para o recheio</li><li>15g de Whey Concentrado</li></ul><p><strong>Modo de preparo:</strong></p><ul><li>Em uma caneca ou pote pequeno que possa ir ao micro-ondas, amasse a banana e misture bem com o ovo.</li><li>Adicione a aveia, a canela e o cacau (se for usar), mexendo até obter uma massa homogênea.</li><li>Acrescente o fermento e misture delicadamente.</li><li>Para o recheio, coloque a colher de doce de leite no centro da massa, deixando que ela afunde levemente.</li><li>Leve ao micro-ondas por aproximadamente 2 minutos (esse tempo pode variar conforme a potência do seu aparelho).</li><li>Aguarde esfriar um pouco antes de consumir para que a textura se estabilize.</li><li>Misture o Whey com doce de Leite ou com um pouco de água para formar uma calda</li></ul>$html$,
    258.33, 17.147, 4.598, 38.63, 5.008,
    0.927, 0.354, 3.135, 35.827, 0.536, 31.405, 50.11,
    301.38, 346.48, 0.313, 0.111, 0.351, 0.764, 16.26, 0.009,
    0.057, 0.044, 0.067, 16.88, 0.048, 14.04, 0.026, 0.086
  ) returning id into v_id_receita;

  insert into public.tabela_alimentos (
    id_avaliador, nome, categoria, fonte, id_receita, medida_caseira_unidade, medida_caseira_desc, medida_caseira_g,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g,
    gorduras_saturadas_g, gorduras_trans_g, colesterol_mg, calcio_mg, ferro_mg, magnesio_mg, fosforo_mg,
    potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg, selenio_mcg, vitamina_a_mcg, tiamina_mg,
    riboflavina_mg, niacina_mg, vitamina_b6_mg, folato_mcg, vitamina_b12_mcg, vitamina_c_mg, vitamina_d_mcg, vitamina_e_mg
  )
  select null, r.nome, 'Receita', 'Customizado', r.id, 'unidade', '1 porção', r.peso_final_g / nullif(r.rendimento_porcoes, 0),
    r.energia_kcal*100/r.peso_final_g, r.proteina_g*100/r.peso_final_g, r.lipidios_g*100/r.peso_final_g, r.carboidrato_g*100/r.peso_final_g, r.fibra_g*100/r.peso_final_g,
    r.gorduras_saturadas_g*100/r.peso_final_g, r.gorduras_trans_g*100/r.peso_final_g, r.colesterol_mg*100/r.peso_final_g, r.calcio_mg*100/r.peso_final_g, r.ferro_mg*100/r.peso_final_g, r.magnesio_mg*100/r.peso_final_g, r.fosforo_mg*100/r.peso_final_g,
    r.potassio_mg*100/r.peso_final_g, r.sodio_mg*100/r.peso_final_g, r.zinco_mg*100/r.peso_final_g, r.cobre_mcg*100/r.peso_final_g, r.manganes_mg*100/r.peso_final_g, r.selenio_mcg*100/r.peso_final_g, r.vitamina_a_mcg*100/r.peso_final_g, r.tiamina_mg*100/r.peso_final_g,
    r.riboflavina_mg*100/r.peso_final_g, r.niacina_mg*100/r.peso_final_g, r.vitamina_b6_mg*100/r.peso_final_g, r.folato_mcg*100/r.peso_final_g, r.vitamina_b12_mcg*100/r.peso_final_g, r.vitamina_c_mg*100/r.peso_final_g, r.vitamina_d_mcg*100/r.peso_final_g, r.vitamina_e_mg*100/r.peso_final_g
  from public.receitas r where r.id = v_id_receita
  returning id into v_id_alimento;

  update public.receitas set id_alimento_sincronizado = v_id_alimento, habilitado_planos = true where id = v_id_receita;


  -- 4) Macarrão Funcional ao Sugo e Cúrcuma
  insert into public.receitas (
    id_avaliador, nome, peso_final_g, rendimento_porcoes, tempo_preparo_min, tags, modo_preparo,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g,
    gorduras_saturadas_g, gorduras_trans_g, colesterol_mg, calcio_mg, ferro_mg, magnesio_mg, fosforo_mg,
    potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg, selenio_mcg, vitamina_a_mcg, tiamina_mg,
    riboflavina_mg, niacina_mg, vitamina_b6_mg, folato_mcg, vitamina_c_mg, vitamina_e_mg
  ) values (
    null, 'Macarrão Funcional ao Sugo e Cúrcuma',
    760, 2, 30, array['Anti-Inflamatório','Hashimoto Friendly','Praticidade','Sem Glutem'],
    $html$<p><strong>Ingredientes:</strong></p><ul><li>160g de macarrão sem glúten (peso cru)</li><li>250g de patinho moído ou 2 latas de atum em pedaços (em água)</li><li>4 tomates maduros (para o molho caseiro)</li><li>1 cebola pequena picada</li><li>2 dentes de alho amassados</li><li>1 colher de chá de cúrcuma em pó</li><li>1 colher de sopa de azeite de oliva extra virgem</li><li>Sal, pimenta-preta e manjericão fresco a gosto</li></ul><p><strong>Modo de preparo:</strong></p><ul><li>Em uma panela, aqueça o azeite e refogue o alho e a cebola até dourarem levemente.</li><li>Adicione os tomates picados e a cúrcuma, deixando cozinhar em fogo baixo até que os tomates desmanchem e formem um molho espesso.</li><li>Acrescente a carne moída (já refogada) ou o atum drenado ao molho, misturando bem para incorporar os sabores.</li><li>Em paralelo, cozinhe o macarrão sem glúten em água fervente com sal seguindo o tempo da embalagem.</li><li>Escorra o macarrão e misture-o imediatamente ao molho quente.</li><li>Finalize com as folhas de manjericão fresco para preservar os compostos aromáticos e antioxidantes.</li></ul>$html$,
    1257.22, 104.51, 28.33, 143.28, 6.4,
    9.022, 1.79, 315, 40.26, 8.7, 107.5, 809.7,
    1816.5, 162.52, 20.85, 0.58, 0.29, 0.8, 202.4, 0.46,
    0.155, 7.525, 0.16, 60.4, 62, 1.84
  ) returning id into v_id_receita;

  insert into public.tabela_alimentos (
    id_avaliador, nome, categoria, fonte, id_receita, medida_caseira_unidade, medida_caseira_desc, medida_caseira_g,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g,
    gorduras_saturadas_g, gorduras_trans_g, colesterol_mg, calcio_mg, ferro_mg, magnesio_mg, fosforo_mg,
    potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg, selenio_mcg, vitamina_a_mcg, tiamina_mg,
    riboflavina_mg, niacina_mg, vitamina_b6_mg, folato_mcg, vitamina_c_mg, vitamina_e_mg
  )
  select null, r.nome, 'Receita', 'Customizado', r.id, 'unidade', '1 porção', r.peso_final_g / nullif(r.rendimento_porcoes, 0),
    r.energia_kcal*100/r.peso_final_g, r.proteina_g*100/r.peso_final_g, r.lipidios_g*100/r.peso_final_g, r.carboidrato_g*100/r.peso_final_g, r.fibra_g*100/r.peso_final_g,
    r.gorduras_saturadas_g*100/r.peso_final_g, r.gorduras_trans_g*100/r.peso_final_g, r.colesterol_mg*100/r.peso_final_g, r.calcio_mg*100/r.peso_final_g, r.ferro_mg*100/r.peso_final_g, r.magnesio_mg*100/r.peso_final_g, r.fosforo_mg*100/r.peso_final_g,
    r.potassio_mg*100/r.peso_final_g, r.sodio_mg*100/r.peso_final_g, r.zinco_mg*100/r.peso_final_g, r.cobre_mcg*100/r.peso_final_g, r.manganes_mg*100/r.peso_final_g, r.selenio_mcg*100/r.peso_final_g, r.vitamina_a_mcg*100/r.peso_final_g, r.tiamina_mg*100/r.peso_final_g,
    r.riboflavina_mg*100/r.peso_final_g, r.niacina_mg*100/r.peso_final_g, r.vitamina_b6_mg*100/r.peso_final_g, r.folato_mcg*100/r.peso_final_g, r.vitamina_c_mg*100/r.peso_final_g, r.vitamina_e_mg*100/r.peso_final_g
  from public.receitas r where r.id = v_id_receita
  returning id into v_id_alimento;

  update public.receitas set id_alimento_sincronizado = v_id_alimento, habilitado_planos = true where id = v_id_receita;


  -- 5) Geleia Funcional de Frutas Vermelhas e Laranja
  insert into public.receitas (
    id_avaliador, nome, descricao, peso_final_g, rendimento_porcoes, tempo_preparo_min, modo_preparo,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g,
    gorduras_saturadas_g, gorduras_trans_g, calcio_mg, ferro_mg, magnesio_mg, fosforo_mg,
    potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg, selenio_mcg, vitamina_a_mcg, tiamina_mg,
    riboflavina_mg, niacina_mg, vitamina_b6_mg, folato_mcg, vitamina_c_mg, vitamina_e_mg
  ) values (
    null, 'Geleia Funcional de Frutas Vermelhas e Laranja',
    'Esta preparação é rica em antocianinas e fibras solúveis, sendo desenhada para auxiliar na redução da inflamação sistêmica e no controle da saciedade. O uso da chia potencializa o aporte de fibras, auxiliando no funcionamento intestinal e na modulação da carga glicêmica.',
    420, 16, 25,
    $html$<p><strong>Ingredientes:</strong></p><ul><li>300g de frutas vermelhas (podem ser frescas ou congeladas: morango, amora, framboesa ou mirtilo).</li><li>200ml de suco de laranja natural.</li><li>2 a 3 colheres de sopa de adoçante culinário (Xilitol ou Eritritol, que são resistentes ao calor).</li><li>1 colher de sopa de sementes de chia (para dar consistência e aumentar o aporte de fibras para saciedade).</li></ul><p><strong>Modo de Preparo:</strong></p><ol><li>Em uma panela, misture as frutas vermelhas, o suco de laranja e o adoçante.</li><li>Cozinhe em fogo baixo, mexendo ocasionalmente, por cerca de 15 a 20 minutos ou até que as frutas desmanchem e o líquido reduza, formando uma calda espessa.</li><li>Desligue o fogo e adicione as sementes de chia, misturando bem.</li><li>Deixe esfriar completamente antes de levar à geladeira; a chia continuará hidratando e deixará a geleia com a textura ideal.</li></ol>$html$,
    230.45, 6.315, 6.025, 42.875, 10.51,
    0.56, 4.455, 155.91, 2.038, 101.19, 250.2,
    663.05, 35.4, 0.957, 0.328, 1.018, 9.96, 15.1, 0.173,
    0.136, 1.324, 0.13, 114.6, 349.04, 1.285
  ) returning id into v_id_receita;

  insert into public.tabela_alimentos (
    id_avaliador, nome, categoria, fonte, id_receita, medida_caseira_unidade, medida_caseira_desc, medida_caseira_g,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g,
    gorduras_saturadas_g, gorduras_trans_g, calcio_mg, ferro_mg, magnesio_mg, fosforo_mg,
    potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg, selenio_mcg, vitamina_a_mcg, tiamina_mg,
    riboflavina_mg, niacina_mg, vitamina_b6_mg, folato_mcg, vitamina_c_mg, vitamina_e_mg
  )
  select null, r.nome, 'Receita', 'Customizado', r.id, 'unidade', '1 porção', r.peso_final_g / nullif(r.rendimento_porcoes, 0),
    r.energia_kcal*100/r.peso_final_g, r.proteina_g*100/r.peso_final_g, r.lipidios_g*100/r.peso_final_g, r.carboidrato_g*100/r.peso_final_g, r.fibra_g*100/r.peso_final_g,
    r.gorduras_saturadas_g*100/r.peso_final_g, r.gorduras_trans_g*100/r.peso_final_g, r.calcio_mg*100/r.peso_final_g, r.ferro_mg*100/r.peso_final_g, r.magnesio_mg*100/r.peso_final_g, r.fosforo_mg*100/r.peso_final_g,
    r.potassio_mg*100/r.peso_final_g, r.sodio_mg*100/r.peso_final_g, r.zinco_mg*100/r.peso_final_g, r.cobre_mcg*100/r.peso_final_g, r.manganes_mg*100/r.peso_final_g, r.selenio_mcg*100/r.peso_final_g, r.vitamina_a_mcg*100/r.peso_final_g, r.tiamina_mg*100/r.peso_final_g,
    r.riboflavina_mg*100/r.peso_final_g, r.niacina_mg*100/r.peso_final_g, r.vitamina_b6_mg*100/r.peso_final_g, r.folato_mcg*100/r.peso_final_g, r.vitamina_c_mg*100/r.peso_final_g, r.vitamina_e_mg*100/r.peso_final_g
  from public.receitas r where r.id = v_id_receita
  returning id into v_id_alimento;

  update public.receitas set id_alimento_sincronizado = v_id_alimento, habilitado_planos = true where id = v_id_receita;


  -- 6) Geleia da Saciedade
  insert into public.receitas (
    id_avaliador, nome, descricao, peso_final_g, rendimento_porcoes, tempo_preparo_min, modo_preparo,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g,
    gorduras_saturadas_g, gorduras_trans_g, calcio_mg, ferro_mg, magnesio_mg, fosforo_mg,
    potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg, selenio_mcg, tiamina_mg,
    riboflavina_mg, niacina_mg, vitamina_b6_mg, vitamina_c_mg, vitamina_e_mg
  ) values (
    null, 'Geleia da Saciedade',
    'Essa receita é rica em fibras solúveis, que ajudam a promover saciedade, melhorar o trânsito intestinal e regular a glicemia.',
    195, 4, 5,
    $html$<p><strong>Ingredientes</strong></p><ul><li>2 colheres de sopa de chia</li><li>1 colher de sopa de psyllium</li><li>1 colher de sopa de linhaça dourada</li><li>150g de suco de uva integral (sem açúcar)</li><li>Frutas vermelhas (opcional)</li><li>Adoçante a gosto (opcional)</li></ul><p><strong>Modo de preparo:</strong></p><ul><li>Misture bem todos os ingredientes em um pote de vidro com tampa.</li><li>Leve à geladeira por no mínimo 5 horas, até formar uma consistência de geleia.</li><li>Sirva gelada com frutas, pães saudáveis, iogurtes ou como topping para mingaus.</li></ul>$html$,
    177.45, 3.03, 4.8, 40.515, 17.46,
    0.545, 3.585, 111.15, 1.533, 65.25, 150,
    217.05, 9.9, 0.792, 0.168, 0.408, 8.28, 0.123,
    0.056, 1.519, 0.045, 37.74, 0.075
  ) returning id into v_id_receita;

  insert into public.tabela_alimentos (
    id_avaliador, nome, categoria, fonte, id_receita, medida_caseira_unidade, medida_caseira_desc, medida_caseira_g,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g,
    gorduras_saturadas_g, gorduras_trans_g, calcio_mg, ferro_mg, magnesio_mg, fosforo_mg,
    potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg, selenio_mcg, tiamina_mg,
    riboflavina_mg, niacina_mg, vitamina_b6_mg, vitamina_c_mg, vitamina_e_mg
  )
  select null, r.nome, 'Receita', 'Customizado', r.id, 'unidade', '1 porção', r.peso_final_g / nullif(r.rendimento_porcoes, 0),
    r.energia_kcal*100/r.peso_final_g, r.proteina_g*100/r.peso_final_g, r.lipidios_g*100/r.peso_final_g, r.carboidrato_g*100/r.peso_final_g, r.fibra_g*100/r.peso_final_g,
    r.gorduras_saturadas_g*100/r.peso_final_g, r.gorduras_trans_g*100/r.peso_final_g, r.calcio_mg*100/r.peso_final_g, r.ferro_mg*100/r.peso_final_g, r.magnesio_mg*100/r.peso_final_g, r.fosforo_mg*100/r.peso_final_g,
    r.potassio_mg*100/r.peso_final_g, r.sodio_mg*100/r.peso_final_g, r.zinco_mg*100/r.peso_final_g, r.cobre_mcg*100/r.peso_final_g, r.manganes_mg*100/r.peso_final_g, r.selenio_mcg*100/r.peso_final_g, r.tiamina_mg*100/r.peso_final_g,
    r.riboflavina_mg*100/r.peso_final_g, r.niacina_mg*100/r.peso_final_g, r.vitamina_b6_mg*100/r.peso_final_g, r.vitamina_c_mg*100/r.peso_final_g, r.vitamina_e_mg*100/r.peso_final_g
  from public.receitas r where r.id = v_id_receita
  returning id into v_id_alimento;

  update public.receitas set id_alimento_sincronizado = v_id_alimento, habilitado_planos = true where id = v_id_receita;


  -- 7) Muffins Proteicos de Frango com Legumes e Aveia
  insert into public.receitas (
    id_avaliador, nome, descricao, peso_final_g, rendimento_porcoes, tempo_preparo_min, modo_preparo,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g,
    gorduras_saturadas_g, gorduras_trans_g, colesterol_mg, calcio_mg, ferro_mg, magnesio_mg, fosforo_mg,
    potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg, selenio_mcg, vitamina_a_mcg, tiamina_mg,
    riboflavina_mg, niacina_mg, vitamina_b6_mg, folato_mcg, vitamina_b12_mcg, vitamina_c_mg, vitamina_d_mcg, vitamina_e_mg
  ) values (
    null, 'Muffins Proteicos de Frango com Legumes e Aveia',
    'Uma opção prática de "batch cooking" desenvolvida para a rotina de trabalho. Estes muffins são densos em nutrientes, fáceis de comer em qualquer lugar e mantêm a saciedade por muito mais tempo. A aveia e os legumes garantem fibras que auxiliam na saúde intestinal e no controle do colesterol.',
    310, 6, 30,
    $html$<p><strong>Ingredientes:</strong></p><ul><li>150g de peito de frango cozido e desfiado.</li><li>2 ovos inteiros.</li><li>40g de farelo de aveia.</li><li>50g de legumes ralados (cenoura ou abobrinha).</li><li>1 colher de chá de fermento em pó.</li><li>Cúrcuma, orégano, sal e pimenta-do-reino a gosto.</li></ul><p><strong>Modo de Preparo:</strong></p><ol><li>Bata os ovos e misture com o frango, os legumes e a aveia.</li><li>Tempere a gosto e adicione o fermento por último.</li><li>Distribua em forminhas de silicone e asse a 180°C por 20-25 minutos até dourar. ou na Airfryer a 160ºC por 12 - 15 min.</li><li>Pode ser consumido frio ou aquecido.</li></ol><p><strong>Dica:</strong> Pode preparar em quantidade e deixar guardado na geladeira para a semana (Duram de 5 até 7 dias na geladeira)</p><p><strong>Dica para Reaquecer:</strong> Para que eles fiquem macios como se tivessem acabado de sair do forno, aqueça no micro-ondas por 30 a 40 segundos com um copo pequeno de água ao lado ou cobertos com um papel toalha úmido. Isso evita que a massa resseque!</p>$html$,
    781.7, 75.285, 20.038, 84.422, 31.33,
    4.545, 2.97, 494.5, 231.3, 6.235, 128.6, 721.65,
    2852.5, 609.91, 5.23, 0.685, 0.51, 20.1, 3303, 0.22,
    0.58, 12.12, 0.425, 181.15, 0.87, 43.52, 1.9, 5.93
  ) returning id into v_id_receita;

  insert into public.tabela_alimentos (
    id_avaliador, nome, categoria, fonte, id_receita, medida_caseira_unidade, medida_caseira_desc, medida_caseira_g,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g,
    gorduras_saturadas_g, gorduras_trans_g, colesterol_mg, calcio_mg, ferro_mg, magnesio_mg, fosforo_mg,
    potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg, selenio_mcg, vitamina_a_mcg, tiamina_mg,
    riboflavina_mg, niacina_mg, vitamina_b6_mg, folato_mcg, vitamina_b12_mcg, vitamina_c_mg, vitamina_d_mcg, vitamina_e_mg
  )
  select null, r.nome, 'Receita', 'Customizado', r.id, 'unidade', '1 porção', r.peso_final_g / nullif(r.rendimento_porcoes, 0),
    r.energia_kcal*100/r.peso_final_g, r.proteina_g*100/r.peso_final_g, r.lipidios_g*100/r.peso_final_g, r.carboidrato_g*100/r.peso_final_g, r.fibra_g*100/r.peso_final_g,
    r.gorduras_saturadas_g*100/r.peso_final_g, r.gorduras_trans_g*100/r.peso_final_g, r.colesterol_mg*100/r.peso_final_g, r.calcio_mg*100/r.peso_final_g, r.ferro_mg*100/r.peso_final_g, r.magnesio_mg*100/r.peso_final_g, r.fosforo_mg*100/r.peso_final_g,
    r.potassio_mg*100/r.peso_final_g, r.sodio_mg*100/r.peso_final_g, r.zinco_mg*100/r.peso_final_g, r.cobre_mcg*100/r.peso_final_g, r.manganes_mg*100/r.peso_final_g, r.selenio_mcg*100/r.peso_final_g, r.vitamina_a_mcg*100/r.peso_final_g, r.tiamina_mg*100/r.peso_final_g,
    r.riboflavina_mg*100/r.peso_final_g, r.niacina_mg*100/r.peso_final_g, r.vitamina_b6_mg*100/r.peso_final_g, r.folato_mcg*100/r.peso_final_g, r.vitamina_b12_mcg*100/r.peso_final_g, r.vitamina_c_mg*100/r.peso_final_g, r.vitamina_d_mcg*100/r.peso_final_g, r.vitamina_e_mg*100/r.peso_final_g
  from public.receitas r where r.id = v_id_receita
  returning id into v_id_alimento;

  update public.receitas set id_alimento_sincronizado = v_id_alimento, habilitado_planos = true where id = v_id_receita;


  -- 8) Brigadeiro de Tâmara Proteico
  insert into public.receitas (
    id_avaliador, nome, descricao, peso_final_g, rendimento_porcoes, tempo_preparo_min, modo_preparo,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g, gorduras_saturadas_g,
    calcio_mg, ferro_mg, magnesio_mg, fosforo_mg, potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg,
    riboflavina_mg, niacina_mg, vitamina_c_mg
  ) values (
    null, 'Brigadeiro de Tâmara Proteico',
    'Um snack doce de alta densidade nutricional que utiliza a doçura natural das tâmaras jumbo aliada ao aporte proteico do whey. É uma preparação rica em fibras e antioxidantes, com baixo índice glicêmico e foco em saciedade.',
    230, 10, 15,
    $html$<p><strong>Ingredientes</strong></p><ul><li>200g Tâmaras jumbo com caroço</li><li>1 scoop de whey (sabor a gosto)</li><li>Cacau 100% em pó (para finalizar)</li></ul><p><strong>Modo de preparo:</strong></p><ol><li>Retire os caroços das tâmaras.</li><li>Misture bem as tâmaras com o whey, até formar uma massa homogênea e moldável.</li><li>Com as mãos, modele pequenas bolinhas (com 23g cada), no formato de brigadeiro.</li><li>Passe cada bolinha no cacau 100% em pó para criar uma camada superficial intensa e funcional.</li><li>Leve à geladeira por alguns minutos.</li></ol><p><strong>Dica:</strong> As tâmaras são naturalmente doces, ricas em fibras, magnésio, triptofano e antioxidantes que ajudam a modular o humor, combater o inchaço e reduzir a compulsão por doces — especialmente na TPM. Combinadas ao whey, criam um doce proteico que ajuda a regular os níveis de serotonina, oferecendo saciedade, energia e bem-estar.</p>$html$,
    685.5, 15.5, 1.4, 162.3, 19.4, 0.5,
    94, 5.2, 100, 116, 1460, 54.5, 1.2, 0.38, 0.94,
    0.2, 2.8, 10
  ) returning id into v_id_receita;

  insert into public.tabela_alimentos (
    id_avaliador, nome, categoria, fonte, id_receita, medida_caseira_unidade, medida_caseira_desc, medida_caseira_g,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g, gorduras_saturadas_g,
    calcio_mg, ferro_mg, magnesio_mg, fosforo_mg, potassio_mg, sodio_mg, zinco_mg, cobre_mcg, manganes_mg,
    riboflavina_mg, niacina_mg, vitamina_c_mg
  )
  select null, r.nome, 'Receita', 'Customizado', r.id, 'unidade', '1 porção', r.peso_final_g / nullif(r.rendimento_porcoes, 0),
    r.energia_kcal*100/r.peso_final_g, r.proteina_g*100/r.peso_final_g, r.lipidios_g*100/r.peso_final_g, r.carboidrato_g*100/r.peso_final_g, r.fibra_g*100/r.peso_final_g, r.gorduras_saturadas_g*100/r.peso_final_g,
    r.calcio_mg*100/r.peso_final_g, r.ferro_mg*100/r.peso_final_g, r.magnesio_mg*100/r.peso_final_g, r.fosforo_mg*100/r.peso_final_g, r.potassio_mg*100/r.peso_final_g, r.sodio_mg*100/r.peso_final_g, r.zinco_mg*100/r.peso_final_g, r.cobre_mcg*100/r.peso_final_g, r.manganes_mg*100/r.peso_final_g,
    r.riboflavina_mg*100/r.peso_final_g, r.niacina_mg*100/r.peso_final_g, r.vitamina_c_mg*100/r.peso_final_g
  from public.receitas r where r.id = v_id_receita
  returning id into v_id_alimento;

  update public.receitas set id_alimento_sincronizado = v_id_alimento, habilitado_planos = true where id = v_id_receita;


  -- 9) Pão de Queijo Fit Express — sem painel de nutrientes na mensagem
  -- original; calculado aqui a partir dos ingredientes (3 fatias de
  -- muçarela ~45g + 50g de goma de tapioca, sal a gosto sem contribuição
  -- calórica) usando os mesmos alimentos já cadastrados na base (ids 2030
  -- e 772) — é exatamente o que o botão "Calcular a partir de alimentos"
  -- da tela de Receitas faz, só que direto em SQL. Fica registrado também
  -- em receitas_ingredientes pra já vir com a lista pronta na tela.
  insert into public.receitas (
    id_avaliador, nome, descricao, peso_final_g, rendimento_porcoes, tempo_preparo_min, modo_preparo,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g, acucares_g,
    gorduras_saturadas_g, gorduras_trans_g, colesterol_mg, calcio_mg, ferro_mg, sodio_mg, zinco_mg,
    vitamina_a_mcg, vitamina_d_mcg, tiamina_mg, riboflavina_mg, niacina_mg, vitamina_b6_mg, vitamina_b12_mcg,
    magnesio_mg, fosforo_mg, potassio_mg, cobre_mcg, manganes_mg, selenio_mcg, vitamina_e_mg,
    acido_pantotenico_mg, folato_mcg, colina_mg, vitamina_k_mcg
  ) values (
    null, 'Pão de Queijo Fit Express',
    'Snack prático, crocante por fora e com a textura "puxadinha" característica do pão de queijo. É a opção ideal para um café da manhã ágil, lanche da tarde sem glúten ou um pré-treino rápido que não pesa no estômago.',
    95, 1, 10,
    $html$<p><strong>Ingredientes</strong></p><ul><li>3 fatias de muçarela (aprox. 45g)</li><li>50g de goma de tapioca</li><li>Sal a gosto</li></ul><p><strong>Modo de preparo:</strong></p><ol><li>Pique ou rale as fatias de muçarela para facilitar a liga.</li><li>Em um recipiente, misture a muçarela, a tapioca e o sal até obter uma massa moldável.</li><li>Modele pequenas bolinhas com as mãos.</li><li>Leve à Airfryer a 180°C por cerca de 8 minutos (ou até dourarem).</li></ol><p><strong>Dica de Ouro:</strong> Pode fazer em quantidade maior e congelar as bolinhas já prontas, depois é só levar do congelador para a Airfryer!</p>$html$,
    311.1, 10.72, 11.088, 42.1115, 0, 1.1115,
    7.002, 0.2655, 40.05, 260.75, 0.17, 187.5, 1.107,
    88.7625, 0.072, 0.009, 0.1215, 0.0405, 0.027, 0.3285,
    9, 159.3, 34.2, 4.95, 0.0135, 7.65, 0.0855,
    0.06345, 3.15, 6.93, 1.035
  ) returning id into v_id_receita;

  insert into public.receitas_ingredientes (id_receita, id_alimento, quantidade_g, ordem) values
    (v_id_receita, 2030, 45, 0),
    (v_id_receita, 772, 50, 1);

  insert into public.tabela_alimentos (
    id_avaliador, nome, categoria, fonte, id_receita, medida_caseira_unidade, medida_caseira_desc, medida_caseira_g,
    energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g, acucares_g,
    gorduras_saturadas_g, gorduras_trans_g, colesterol_mg, calcio_mg, ferro_mg, sodio_mg, zinco_mg,
    vitamina_a_mcg, vitamina_d_mcg, tiamina_mg, riboflavina_mg, niacina_mg, vitamina_b6_mg, vitamina_b12_mcg,
    magnesio_mg, fosforo_mg, potassio_mg, cobre_mcg, manganes_mg, selenio_mcg, vitamina_e_mg,
    acido_pantotenico_mg, folato_mcg, colina_mg, vitamina_k_mcg
  )
  select null, r.nome, 'Receita', 'Customizado', r.id, 'unidade', '1 porção', r.peso_final_g / nullif(r.rendimento_porcoes, 0),
    r.energia_kcal*100/r.peso_final_g, r.proteina_g*100/r.peso_final_g, r.lipidios_g*100/r.peso_final_g, r.carboidrato_g*100/r.peso_final_g, r.fibra_g*100/r.peso_final_g, r.acucares_g*100/r.peso_final_g,
    r.gorduras_saturadas_g*100/r.peso_final_g, r.gorduras_trans_g*100/r.peso_final_g, r.colesterol_mg*100/r.peso_final_g, r.calcio_mg*100/r.peso_final_g, r.ferro_mg*100/r.peso_final_g, r.sodio_mg*100/r.peso_final_g, r.zinco_mg*100/r.peso_final_g,
    r.vitamina_a_mcg*100/r.peso_final_g, r.vitamina_d_mcg*100/r.peso_final_g, r.tiamina_mg*100/r.peso_final_g, r.riboflavina_mg*100/r.peso_final_g, r.niacina_mg*100/r.peso_final_g, r.vitamina_b6_mg*100/r.peso_final_g, r.vitamina_b12_mcg*100/r.peso_final_g,
    r.magnesio_mg*100/r.peso_final_g, r.fosforo_mg*100/r.peso_final_g, r.potassio_mg*100/r.peso_final_g, r.cobre_mcg*100/r.peso_final_g, r.manganes_mg*100/r.peso_final_g, r.selenio_mcg*100/r.peso_final_g, r.vitamina_e_mg*100/r.peso_final_g,
    r.acido_pantotenico_mg*100/r.peso_final_g, r.folato_mcg*100/r.peso_final_g, r.colina_mg*100/r.peso_final_g, r.vitamina_k_mcg*100/r.peso_final_g
  from public.receitas r where r.id = v_id_receita
  returning id into v_id_alimento;

  update public.receitas set id_alimento_sincronizado = v_id_alimento, habilitado_planos = true where id = v_id_receita;

end $$;
