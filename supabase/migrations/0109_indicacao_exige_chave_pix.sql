-- Além de esconder o link na tela (Configuracoes.jsx) enquanto o
-- nutricionista não cadastra a chave Pix, reforça isso aqui: se alguém
-- usar um link de indicação de um avaliador que não tem chave_pix
-- cadastrada, o cadastro segue normal, só que sem vincular a indicação
-- (v_indicador_id fica null) — evita gerar uma recompensa que não tem
-- pra onde ser paga.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $function$
declare
  v_indicador_id bigint;
begin
  if new.raw_user_meta_data ? 'codigo_indicacao_ref' then
    select id into v_indicador_id
    from public.avaliadores
    where codigo_indicacao = (new.raw_user_meta_data->>'codigo_indicacao_ref')::uuid
      and chave_pix is not null
      and chave_pix <> '';
  end if;

  insert into public.avaliadores (auth_id, email, nome_completo, indicado_por)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome_completo', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    v_indicador_id
  )
  on conflict (auth_id) do nothing;

  return new;
exception
  when others then
    raise warning 'handle_new_user() falhou pra auth_id=%, email=%: %', new.id, new.email, sqlerrm;
    return new;
end;
$function$;
