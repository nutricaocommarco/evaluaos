-- Os mesmos 5 grupos de exames usados no catálogo (catalogoExames.js —
-- usado em Resultados pra pré-preencher um grupo com um clique) também
-- entram como modelos do sistema pra Solicitações, pro nutricionista
-- pedir exatamente o painel de exames de um grupo sem digitar a lista na
-- mão. Mesmo padrão da migration 0033 (id_avaliador null = modelo do
-- sistema, visível pra todo nutricionista).

insert into public.modelos_exames_solicitacoes (id_avaliador, titulo, conteudo)
select null, 'Biomarcadores de desnutrição', '<p>Solicito os seguintes exames laboratoriais (SANGUE):</p><p><br></p><p>Albumina</p><p>Pré-albumina</p><p>Transferrina</p><p>Proteínas totais</p><p>Hemograma completo</p>'
where not exists (select 1 from public.modelos_exames_solicitacoes where id_avaliador is null and titulo = 'Biomarcadores de desnutrição');

insert into public.modelos_exames_solicitacoes (id_avaliador, titulo, conteudo)
select null, 'Exame de carências nutricionais', '<p>Solicito os seguintes exames laboratoriais (SANGUE):</p><p><br></p><p>Vitamina D</p><p>Vitamina B12</p><p>Ácido fólico</p><p>Vitamina A</p><p>Ferro e ferritina</p><p>Zinco</p><p>Cálcio total</p><p>Cálcio iônico</p><p>Magnésio</p>'
where not exists (select 1 from public.modelos_exames_solicitacoes where id_avaliador is null and titulo = 'Exame de carências nutricionais');

insert into public.modelos_exames_solicitacoes (id_avaliador, titulo, conteudo)
select null, 'Glicemia e marcadores de diabetes', '<p>Solicito os seguintes exames laboratoriais (SANGUE):</p><p><br></p><p>Glicemia de jejum</p><p>Hemoglobina glicada (HbA1c)</p><p>Teste oral de tolerância à glicose (TOTG)</p>'
where not exists (select 1 from public.modelos_exames_solicitacoes where id_avaliador is null and titulo = 'Glicemia e marcadores de diabetes');

insert into public.modelos_exames_solicitacoes (id_avaliador, titulo, conteudo)
select null, 'Hemograma completo', '<p>Solicito os seguintes exames laboratoriais (SANGUE):</p><p><br></p><p>Hemácias</p><p>Hemoglobina</p><p>Hematócrito</p><p>Volume corpuscular médio (VCM)</p><p>Hemoglobina corpuscular média (HCM)</p><p>Concentração de hemoglobina corpuscular média (CHCM)</p><p>Distribuição do tamanho das hemácias (RDW)</p><p>Contagem global de leucócitos</p><p>Contagem diferencial de leucócitos</p><p>Contagem de plaquetas</p>'
where not exists (select 1 from public.modelos_exames_solicitacoes where id_avaliador is null and titulo = 'Hemograma completo');

insert into public.modelos_exames_solicitacoes (id_avaliador, titulo, conteudo)
select null, 'Lipidograma (perfil lipídico)', '<p>Solicito os seguintes exames laboratoriais (SANGUE):</p><p><br></p><p>Colesterol total</p><p>Lipoproteína de alta densidade (HDL)</p><p>Lipoproteína de baixa densidade (LDL)</p><p>Lipoproteína de muito baixa densidade (VLDL)</p><p>Triglicerídeos</p>'
where not exists (select 1 from public.modelos_exames_solicitacoes where id_avaliador is null and titulo = 'Lipidograma (perfil lipídico)');
