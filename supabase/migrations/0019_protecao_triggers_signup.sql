-- Blindagem contra o mesmo tipo de bug do "Database error saving new user":
-- as duas triggers que rodam em cima de auth.users/avaliadores no cadastro
-- agora capturam qualquer erro interno (EXCEPTION WHEN OTHERS), registram
-- um aviso no log do Postgres e deixam a conta ser criada mesmo assim — em
-- vez de derrubar a transação inteira de auth.signUp() por causa de um
-- problema numa lógica secundária (como a checagem de promoção).
--
-- Não muda nenhum comportamento pra quem já cadastra normalmente hoje —
-- só evita que um problema futuro (tabela renomeada, coluna removida,
-- constraint nova) volte a bloquear TODOS os cadastros como aconteceu
-- agora. Se algo falhar, dá pra ver em Logs → Postgres Logs (mensagem
-- "WARNING") — só não trava mais ninguém.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $function$
begin
  insert into public.avaliadores (auth_id, email, nome_completo)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome_completo', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (auth_id) do nothing;

  return new;
exception
  when others then
    raise warning 'handle_new_user() falhou pra auth_id=%, email=%: %', new.id, new.email, sqlerrm;
    return new;
end;
$function$;

create or replace function public.verificar_promocao_novo_avaliador()
returns trigger
language plpgsql
security definer
as $function$
declare
  v_promocao record;
begin
  select * into v_promocao
  from public.promocoes
  where lower(email) = lower(new.email) and utilizado = false;

  if found then
    new.plano_status := 'pro';
    new.data_expiracao_plano := now() + (v_promocao.meses_gratuitos || ' months')::interval;

    update public.promocoes
    set utilizado = true, data_resgate = now()
    where id = v_promocao.id;
  end if;

  return new;
exception
  when others then
    raise warning 'verificar_promocao_novo_avaliador() falhou pra email=%: %', new.email, sqlerrm;
    return new;
end;
$function$;
