-- A política de 0045 só liberava leitura anônima de questionario_respostas
-- pras perguntas marcadas com campo_especial (peso/altura) — mas agora
-- qualquer check-in pode gerar relatório pro paciente, contanto que use
-- perguntas de Número ou Escala Linear (0047), com ou sem campo_especial
-- marcado. Amplia a regra pro tipo da pergunta em vez de só campo_especial
-- — o relatório do paciente (RelatorioCheckinPaciente.jsx) só busca e
-- exibe esses dois tipos mesmo, então a política acompanha exatamente o
-- que o app realmente usa. Texto livre, múltipla escolha e caixas de
-- seleção continuam ilegíveis por anon, como já era.
drop policy if exists "questionario_respostas_leitura_publica_campos_especiais" on public.questionario_respostas;
drop policy if exists "questionario_respostas_leitura_publica_relatorio" on public.questionario_respostas;
create policy "questionario_respostas_leitura_publica_relatorio" on public.questionario_respostas
  for select to anon using (
    exists (
      select 1 from public.questionario_perguntas p
      where p.id = questionario_respostas.id_pergunta
        and p.tipo in ('numero', 'escala_linear')
    )
  );
