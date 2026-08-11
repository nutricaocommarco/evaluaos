-- Corrige um problema real de arquitetura: até aqui, o peso por unidade
-- de um alimento (medida_caseira_g) só era usado quando o nutricionista
-- selecionava especificamente "Unidade(s)" no seletor de medida. Pra
-- arroz/feijão/macarrão (cadastrados como "1 colher de sopa cheia"/"1
-- concha média"), isso significava que escolher a opção certa e óbvia —
-- "Colher de sopa" — continuava usando o fator GENÉRICO (~15g, igual
-- pra qualquer alimento) em vez do peso real daquele alimento (25g de
-- arroz, 90g de feijão). O nutricionista só teria o valor certo se
-- soubesse escolher "Unidade(s)" em vez de "Colher de sopa" — nada
-- óbvio.
--
-- Fix: `medida_caseira_g`/`medida_caseira_desc` passam a valer
-- especificamente pra UMA unidade do seletor (guardada em
-- `medida_caseira_unidade`) — pode ser "unidade" (bananas, ovos, fatias)
-- OU "colher_sopa"/"concha"/etc (arroz, feijão). Quando o nutricionista
-- escolhe a mesma unidade cadastrada pro alimento, o peso específico
-- entra no lugar do genérico; escolhendo qualquer outra unidade, o
-- fator genérico dela continua valendo normalmente.

alter table public.tabela_alimentos
  add column if not exists medida_caseira_unidade text;

alter table public.alimentos_medida_caseira_pessoal
  add column if not exists medida_caseira_unidade text;

-- Backfill: tudo que já foi cadastrado nas migrations 0026/0027/0028
-- tinha a unidade certa embutida só no texto da descrição — recupera
-- isso pra coluna nova, por padrão de texto.
update public.tabela_alimentos
set medida_caseira_unidade = case
  when medida_caseira_desc ilike '%colher de sopa%' then 'colher_sopa'
  when medida_caseira_desc ilike '%colher de chá%' then 'colher_cha'
  when medida_caseira_desc ilike '%colher de café%' then 'colher_cafe'
  when medida_caseira_desc ilike '%concha%' then 'concha'
  when medida_caseira_desc ilike '%copo americano%' then 'copo_americano'
  when medida_caseira_desc ilike '%xícara%' then 'xicara_cha'
  else 'unidade'
end
where medida_caseira_g is not null
  and medida_caseira_unidade is null;
