-- Gráfico de peso/IMC pro paciente, alimentado pelas próprias respostas do
-- Check-in Semanal (0044) — sem criar nenhuma escrita pública nova: a
-- altura manual (quando o paciente não tem avaliação antropométrica ainda)
-- entra como só mais uma pergunta do questionário, pelo mesmo caminho já
-- seguro de sempre (questionario_respostas, insert público restrito a
-- envios "aguardando"). `campo_especial` marca qual pergunta representa
-- peso/altura pra montar o gráfico sem depender de casar texto.

alter table public.questionario_perguntas
  add column if not exists campo_especial text check (campo_especial in ('peso', 'altura'));

-- Liga/Desliga separado do Check-in Semanal em si: o nutricionista pode
-- coletar peso semanalmente sem necessariamente expor esse gráfico ao
-- paciente (evita fixação em peso/balança pra quem tem histórico sensível
-- com isso) — padrão desligado.
alter table public.pacientes
  add column if not exists mostrar_grafico_peso_paciente boolean not null default false;

-- questionario_respostas (0015) foi deliberadamente fechado pra leitura
-- anônima ("o paciente não precisa reler o que já mandou") — mantemos essa
-- decisão pro conteúdo geral, mas o gráfico de peso/IMC do paciente
-- precisa reler o histórico de peso/altura que ele mesmo respondeu. Abre
-- só pras respostas ligadas a uma pergunta com campo_especial preenchido
-- (peso/altura) — todo o resto (texto livre, múltipla escolha, escala
-- etc.) continua ilegível por anon.
drop policy if exists "questionario_respostas_leitura_publica_campos_especiais" on public.questionario_respostas;
create policy "questionario_respostas_leitura_publica_campos_especiais" on public.questionario_respostas
  for select to anon using (
    exists (
      select 1 from public.questionario_perguntas p
      where p.id = questionario_respostas.id_pergunta
        and p.campo_especial is not null
    )
  );
