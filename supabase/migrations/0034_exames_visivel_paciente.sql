-- Liga/Desliga (visivel_paciente) pra Exames Laboratoriais aparecerem na
-- Área do Paciente — mesmo conceito já usado em avaliacoes/planos/
-- orientacoes/listas (migration 0020), com uma diferença de propósito:
-- aqui o default é FALSE (escondido), não TRUE. Resultado de exame é
-- dado sensível — não deve aparecer pro paciente só por ter sido
-- registrado, o nutricionista precisa ligar explicitamente pra cada um.
--
-- exames_solicitacoes já tem uma policy pública de leitura por token
-- (0033, "for select to anon using (true)") — ela continua existindo tal
-- qual, porque o QR Code de um pedido já impresso/entregue precisa
-- continuar validando independente desse Liga/Desliga (são preocupações
-- diferentes: "esse documento específico é autêntico" vs "isso aparece
-- listado na área do paciente"). O filtro de visivel_paciente pra
-- listagem no portal é feito na query do app (.eq('visivel_paciente',
-- true)), não na RLS dessa tabela.
--
-- exames_registros nunca teve nenhuma exposição pública — aqui ganha,
-- pela primeira vez, policies de leitura anônima encadeadas
-- (registro -> grupos -> itens), sempre condicionadas a
-- visivel_paciente = true no registro.

alter table public.exames_solicitacoes
  add column if not exists visivel_paciente boolean not null default false;

alter table public.exames_registros
  add column if not exists visivel_paciente boolean not null default false;

drop policy if exists "exames_registros_leitura_publica_via_paciente" on public.exames_registros;
create policy "exames_registros_leitura_publica_via_paciente" on public.exames_registros
  for select to anon using (
    visivel_paciente = true
    and exists (select 1 from public.pacientes p where p.id = exames_registros.id_paciente)
  );

drop policy if exists "exames_registros_grupos_leitura_publica" on public.exames_registros_grupos;
create policy "exames_registros_grupos_leitura_publica" on public.exames_registros_grupos
  for select to anon using (
    exists (
      select 1 from public.exames_registros r
      where r.id = exames_registros_grupos.id_registro
        and r.visivel_paciente = true
    )
  );

drop policy if exists "exames_registros_itens_leitura_publica" on public.exames_registros_itens;
create policy "exames_registros_itens_leitura_publica" on public.exames_registros_itens
  for select to anon using (
    exists (
      select 1 from public.exames_registros r
      where r.id = exames_registros_itens.id_registro
        and r.visivel_paciente = true
    )
  );
