-- handle_new_user() é quem realmente cria a linha de public.avaliadores no
-- cadastro (trigger em auth.users, anexada direto no Supabase — corpo
-- versionado desde 0019_protecao_triggers_signup.sql). O insert manual em
-- Login.jsx roda DEPOIS e vira no-op (on conflict do nothing), então o
-- código de indicação só pode ser resolvido aqui dentro, não no client.
--
-- O código chega via metadata do auth.signUp() (raw_user_meta_data ->>
-- 'codigo_indicacao_ref', setado em Login.jsx a partir do ?ref= da URL).
-- Só é `create or replace` — a trigger em auth.users já existe e recarrega
-- sozinha a nova versão da função, não precisa reanexar nada.
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
    where codigo_indicacao = (new.raw_user_meta_data->>'codigo_indicacao_ref')::uuid;
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
