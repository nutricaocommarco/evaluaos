-- Libera UPDATE em avaliadores só pra manjunior007@gmail.com (mesma
-- checagem segura da 0108, sem select em avaliadores dentro da policy —
-- não recursa). Usado pelo botão "Marcar como PAGO" em Configuracoes.jsx,
-- que grava indicacao_paga_em direto na linha do indicado — antes só dava
-- pra fazer isso via SQL direto no Supabase.
drop policy if exists "avaliadores_admin_marca_pago" on public.avaliadores;
create policy "avaliadores_admin_marca_pago" on public.avaliadores
  for update
  using (auth.jwt() ->> 'email' = 'manjunior007@gmail.com')
  with check (auth.jwt() ->> 'email' = 'manjunior007@gmail.com');
