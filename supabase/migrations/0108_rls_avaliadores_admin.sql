-- Libera leitura de TODAS as linhas de avaliadores só pra
-- manjunior007@gmail.com (login principal do Marco/dono do EvaluaOS) —
-- usado em Configuracoes.jsx pra montar a lista "Indique & Ganhe"
-- com as indicações de todo mundo, não só as próprias.
--
-- Importante (lição da 0106): usa auth.jwt() ->> 'email', que só lê um
-- claim do token — não faz select em public.avaliadores dentro da
-- própria policy, então não corre risco de recursão.
drop policy if exists "avaliadores_admin_le_tudo" on public.avaliadores;
create policy "avaliadores_admin_le_tudo" on public.avaliadores
  for select
  using (auth.jwt() ->> 'email' = 'manjunior007@gmail.com');
