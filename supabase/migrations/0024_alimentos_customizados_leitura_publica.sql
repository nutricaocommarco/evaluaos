-- Bug: alimentos customizados (criados pelo próprio nutricionista, não da
-- base TACO/IBGE) não apareciam certo pro paciente. A policy original
-- (0001, "alimentos_leitura_oficial_ou_proprio") só libera leitura pra
-- quem é dono (auth.uid() = id_avaliador) ou pra alimentos oficiais
-- (id_avaliador is null) — o paciente, sem login (role anon), não se
-- encaixa em nenhum dos dois casos quando o alimento é customizado.
-- Resultado: `tabela_alimentos` vinha null pro item/substituto na Área do
-- Paciente, caindo no fallback genérico "Alimento" e zerando os macros
-- dele no total (o nome_customizado do item, quando existia, mascarava o
-- problema mostrando o nome certo mesmo com os macros errados).
--
-- Fix: libera leitura anônima de um alimento customizado especificamente
-- quando ele está referenciado por algum item (ou substituto de item) de
-- alguma refeição prescrita — mesmo padrão de "confiança encadeada" já
-- usado em toda a Área do Paciente (0018/0020).

drop policy if exists "alimentos_leitura_publica_via_item_paciente" on public.tabela_alimentos;
create policy "alimentos_leitura_publica_via_item_paciente" on public.tabela_alimentos
  for select to anon using (
    exists (
      select 1 from public.itens_refeicao i
      where i.id_alimento = tabela_alimentos.id
    )
    or exists (
      select 1 from public.substitutos_item s
      where s.id_alimento = tabela_alimentos.id
    )
  );
