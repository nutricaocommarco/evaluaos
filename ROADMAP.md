# Roadmap — EvaluaOS

Registro do que já foi discutido/decidido mas ficou fora do escopo de
cada fase entregue até aqui (branch `Nutricionista`). Não é uma lista
priorizada — é um catálogo do que falta, pra não perder o fio quando
formos decidir a próxima etapa.

## Prescrição & Nutrição (continuação da Fase 3/4)

- **Grupos de Alimentos** — listas reutilizáveis tipo "Carboidratos",
  "Proteínas", "Frutas" (inspirado no Amplinutri) que o nutricionista
  monta uma vez e reaproveita em várias refeições/pacientes, deixando o
  paciente escolher entre as opções do grupo em vez de um alimento
  fixo. Maior escopo que Substitutos (que já existe, por item) — exige
  tabelas novas e um jeito de inserir "um grupo inteiro" numa refeição.
- **Comparação com DRI / micronutrientes** — hoje o plano só compara
  macro (proteína/carbo/lipídio) com a meta. Comparar micronutrientes
  contra as referências DRI é maior e mais delicado (tabela de
  referência por sexo/idade/fase de vida).
- **Plano tipo "Qualitativo"** — modo alternativo de prescrição em
  texto livre, sem cálculo de macros, pra quando o nutricionista não
  quer (ou não precisa) prescrever por quantidade.
- **Enriquecimento com dados da TBCA** (açúcares/amido/fibra
  detalhados) — a TBCA usa código próprio, sem chave de correspondência
  confiável com a TACO (risco de grudar valor no alimento errado se
  casar por nome aproximado). Além disso a licença da TBCA
  (`CC BY-NC-ND`) proíbe uso comercial sem contato prévio com os
  coordenadores da USP/FoRC — isso é decisão de negócio, fora do meu
  escopo técnico.
- **Mais suplementos** — hoje só 17 itens cadastrados (Growth,
  Integralmédica, Dr Peanut, YoPRO, genéricos). Cobertura pode crescer
  bastante.

## Itens "Em Construção" (saíram do menu do paciente na Fase 5, não construídos ainda)

Continuam existindo como conceito, só não têm tela — voltam ao menu
(grupo apropriado) assim que cada um for construído:

- Exames Laboratoriais
- Exames de Bioimpedância
- Acompanhamento Gestacional
- Acompanhamento Infantil
- Fotos Comparativas
- Receitas
- Materiais de Apoio
- Fórmulas Manipuladas
- Diário Alimentício (paciente registra o que comeu de fato, pra
  comparar com o Plano Alimentar prescrito — foi cogitado como
  "próxima etapa" antes de entrarmos na reformulação de menus)
- Pasta do Paciente
- Configurações do Paciente

## Menus & Plano Beta (Fase 5)

- **Fluxo de upgrade/compra pro plano Beta** — hoje `plano_status =
  'beta'` só é setado manualmente via SQL Editor. Não existe checkout
  nem tela de "vire Beta" dentro do app.
- **Guarda de rota pra páginas Beta** — hoje esconder os itens do menu
  não impede alguém de digitar a URL de uma tela Beta direto (ex:
  `/pacientes/17/anamnese`) sem ter o plano. Não é um problema de
  segurança de dados (RLS já isola por avaliador), só uma tela que
  "não deveria" aparecer pra quem não é Beta. Fica pra quando houver
  mais de uma conta real usando o app.

## Observação

Este arquivo é só um catálogo — decisões de prioridade continuam sendo
conversa, não algo pra eu assumir sozinho.
