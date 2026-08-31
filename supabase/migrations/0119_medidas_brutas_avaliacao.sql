-- Guarda as leituras brutas (1ª/2ª/3ª medida) de cada dobra cutânea,
-- perímetro, diâmetro ósseo e medida básica, além do valor final (média ou
-- mediana) que já era gravado nas colunas normais. Sem isso, depois que uma
-- avaliação é salva não tinha como saber quais foram as medidas originais
-- que geraram o resultado final.
--
-- Formato: { "<coluna>": { "m1": "12.5", "m2": "13.0", "m3": "" }, ... }
-- As chaves são os mesmos nomes de coluna de public.avaliacoes (ex:
-- dobra_cutanea_triceps, perimetro_cintura). m3 fica vazio quando não foi
-- necessária (1ª e 2ª medida dentro da tolerância).

alter table public.avaliacoes
  add column if not exists medidas_brutas jsonb;

comment on column public.avaliacoes.medidas_brutas is
  'Leituras brutas (1ª/2ª/3ª medida) por campo — ver AvaliacaoForm.jsx. Colunas normais continuam com o valor final (média ou mediana) já resolvido.';
