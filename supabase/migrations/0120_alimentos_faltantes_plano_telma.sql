-- 4 alimentos que faltavam no banco pra reproduzir o 1º Plano Alimentar da
-- Telma Cecília: são produtos de marca (não TACO/IBGE), então precisam
-- entrar com id_avaliador = NULL pra ficarem disponíveis pra qualquer
-- nutricionista buscar — a política de RLS normal do app só deixa cada
-- avaliador inserir alimento pra si mesmo (id_avaliador = auth.uid()),
-- então isso só roda com privilégio de dono do projeto, direto no SQL
-- Editor do Supabase (por isso não dá pra fazer isso pela tela).
--
-- Valores nutricionais (por 100g/100ml) buscados nas próprias páginas dos
-- produtos/fabricantes na web em 2026-09; ver fontes abaixo. Confira antes
-- de usar em produção — não são da base oficial TACO/IBGE.

insert into public.tabela_alimentos
  (id_avaliador, nome, categoria, fonte, energia_kcal, proteina_g, lipidios_g, carboidrato_g, fibra_g)
values
  -- Fonte: openfoodfacts.org/produto/7898902481224 (sabor azeitona preta —
  -- o plano não especifica o sabor; se for outro, os valores mudam pouco).
  (null, 'Pasta de soja, Puro Sabor (sabor azeitona preta)', 'Pastas e patês', 'Customizado', 190, 2, 17.5, 15, 0.5),

  -- Fonte: yopro.com.br — página oficial da versão de 15g de proteína
  -- (a de 25g já existe na base com outro nome, não mexe nela).
  (null, 'YoPRO Bebida Láctea UHT 15g Proteína, Chocolate, 250ml', 'Bebidas lácteas', 'Customizado', 69, 6, 1.1, 8.4, 0.6),

  -- Fonte: fatsecret.com.br, marca Bom Princípio. Fibra não informada pelo
  -- fabricante (fica null). Se a paciente usa outra marca, os valores mudam.
  (null, 'Doce de leite zero lactose (ex: Bom Princípio)', 'Doces e sobremesas', 'Customizado', 310, 5.7, 5.2, 60, null),

  -- ESTIMATIVA — "Geleia da Saciedade" é uma receita própria do
  -- consultório (fruta + fibra solúvel tipo chia/psyllium, sem açúcar),
  -- não um produto de prateleira com rótulo. Os valores abaixo são uma
  -- estimativa razoável baseada em receitas de geleia de fruta sem açúcar
  -- (bem baixa caloria, alta fibra) — ajuste se você tiver a receita exata.
  (null, 'Geleia da Saciedade (receita própria — estimativa)', 'Doces e sobremesas', 'Customizado', 25, 0.5, 0.2, 5, 3);
