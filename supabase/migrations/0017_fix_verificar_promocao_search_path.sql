-- Corrige verificar_promocao_novo_avaliador(): ela referenciava a tabela
-- como "promocoes", sem prefixo de schema. Dentro da conexão que o Supabase
-- Auth usa pra rodar a trigger on_auth_user_created, o search_path não
-- necessariamente inclui "public" — então mesmo com public.promocoes já
-- criada (migration 0016), a função continuava dando "relation promocoes
-- does not exist" e todo cadastro novo continuava quebrado.
--
-- Mesma lógica de antes, só com as duas referências à tabela qualificadas
-- como public.promocoes (mesmo padrão que handle_new_user() já usava pra
-- public.avaliadores, por isso aquela nunca teve esse problema).

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
end;
$function$;
