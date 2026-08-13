// Catálogo de exames laboratoriais — só um PREFILL genérico pro "+
// Adicionar exame" (autocomplete local, sem tabela no banco). Os valores
// de referência variam bastante entre laboratórios (TSH, por exemplo,
// aparece como 0,40-4,30 numa fonte e 0,45-5,0 noutra) — os campos de
// Valor obtido/Unidade/Intervalo continuam sempre editáveis na tela de
// Registro, exatamente como já funciona a medida caseira em
// tabela_alimentos (medida_caseira_g/medida_caseira_unidade): o app
// sugere, o nutri confirma olhando o laudo real em mãos.
//
// Fontes usadas pra montar os valores default: laudos reais de Riolabor,
// Dasa, Bronstein Medicina Diagnóstica e Clínica Felippe Mattoso.
//
// min/max null = sem teto/piso definido pela fonte (ex: "superior a
// 20 ng/mL" vira { min: 20, max: null }). Exames sem nenhuma referência
// confiável nas fontes disponíveis entram com min/max null nos dois —
// o nutri preenche na hora.

export const CATALOGO_EXAMES = [
  // --- Biomarcadores de desnutrição ---
  { grupo: 'Biomarcadores de desnutrição', nome: 'Albumina', unidade: 'g/dL', min: null, max: null },
  { grupo: 'Biomarcadores de desnutrição', nome: 'Pré-albumina', unidade: 'mg/dL', min: null, max: null },
  { grupo: 'Biomarcadores de desnutrição', nome: 'Transferrina', unidade: 'mg/dL', min: 250, max: 380 },
  { grupo: 'Biomarcadores de desnutrição', nome: 'Proteínas totais', unidade: 'g/dL', min: 6.4, max: 8.3 },

  // --- Exame de carências nutricionais ---
  { grupo: 'Exame de carências nutricionais', nome: 'Vitamina D (25-OH-Vitamina D)', unidade: 'ng/mL', min: 30, max: 100 },
  { grupo: 'Exame de carências nutricionais', nome: 'Vitamina B12', unidade: 'pg/mL', min: 211, max: 946 },
  { grupo: 'Exame de carências nutricionais', nome: 'Ácido fólico', unidade: 'ng/mL', min: 3.9, max: null },
  { grupo: 'Exame de carências nutricionais', nome: 'Vitamina A', unidade: 'mg/L', min: 0.3, max: 0.7 },
  { grupo: 'Exame de carências nutricionais', nome: 'Ferro sérico', unidade: 'µg/dL', min: 50, max: 175 },
  { grupo: 'Exame de carências nutricionais', nome: 'Ferritina', unidade: 'ng/mL', min: 13, max: 150 },
  { grupo: 'Exame de carências nutricionais', nome: 'Zinco', unidade: 'µg/dL', min: 70, max: 120 },
  { grupo: 'Exame de carências nutricionais', nome: 'Cálcio total', unidade: 'mg/dL', min: 8.5, max: 10.5 },
  { grupo: 'Exame de carências nutricionais', nome: 'Cálcio iônico', unidade: 'mmol/L', min: null, max: null },
  { grupo: 'Exame de carências nutricionais', nome: 'Magnésio', unidade: 'mg/dL', min: 1.6, max: 2.4 },

  // --- Glicemia e marcadores de diabetes ---
  { grupo: 'Glicemia e marcadores de diabetes', nome: 'Glicemia de jejum', unidade: 'mg/dL', min: 70, max: 99 },
  { grupo: 'Glicemia e marcadores de diabetes', nome: 'Hemoglobina glicada (HbA1c)', unidade: '%', min: null, max: 5.7 },
  { grupo: 'Glicemia e marcadores de diabetes', nome: 'Teste oral de tolerância à glicose (TOTG)', unidade: 'mg/dL', min: null, max: null },
  { grupo: 'Glicemia e marcadores de diabetes', nome: 'Insulina', unidade: 'µUI/mL', min: 2, max: 13 },
  { grupo: 'Glicemia e marcadores de diabetes', nome: 'HOMA-IR', unidade: '', min: null, max: 2.7 },

  // --- Hemograma completo ---
  { grupo: 'Hemograma completo', nome: 'Hemácias', unidade: 'milhões/mm³', min: 3.9, max: 5.0 },
  { grupo: 'Hemograma completo', nome: 'Hemoglobina', unidade: 'g/dL', min: 12.0, max: 15.5 },
  { grupo: 'Hemograma completo', nome: 'Hematócrito', unidade: '%', min: 35.0, max: 45.0 },
  { grupo: 'Hemograma completo', nome: 'Volume corpuscular médio (VCM)', unidade: 'fL', min: 82.0, max: 98.0 },
  { grupo: 'Hemograma completo', nome: 'Hemoglobina corpuscular média (HCM)', unidade: 'pg', min: 26.0, max: 34.0 },
  { grupo: 'Hemograma completo', nome: 'Concentração de hemoglobina corpuscular média (CHCM)', unidade: 'g/dL', min: 31.0, max: 36.0 },
  { grupo: 'Hemograma completo', nome: 'Distribuição do tamanho das hemácias (RDW)', unidade: '%', min: 11.9, max: 15.5 },
  { grupo: 'Hemograma completo', nome: 'Contagem global de leucócitos', unidade: '/mm³', min: 3500, max: 10500 },
  { grupo: 'Hemograma completo', nome: 'Neutrófilos', unidade: '%', min: 40.0, max: 80.0 },
  { grupo: 'Hemograma completo', nome: 'Eosinófilos', unidade: '%', min: 1.0, max: 6.0 },
  { grupo: 'Hemograma completo', nome: 'Basófilos', unidade: '%', min: 0.0, max: 2.0 },
  { grupo: 'Hemograma completo', nome: 'Linfócitos', unidade: '%', min: 20.0, max: 40.0 },
  { grupo: 'Hemograma completo', nome: 'Monócitos', unidade: '%', min: 2.0, max: 10.0 },
  { grupo: 'Hemograma completo', nome: 'Contagem de plaquetas', unidade: '/mm³', min: 150000, max: 450000 },

  // --- Lipidograma (perfil lipídico) ---
  { grupo: 'Lipidograma (perfil lipídico)', nome: 'Colesterol total', unidade: 'mg/dL', min: null, max: 190 },
  { grupo: 'Lipidograma (perfil lipídico)', nome: 'Lipoproteína de alta densidade (HDL)', unidade: 'mg/dL', min: 40, max: null },
  { grupo: 'Lipidograma (perfil lipídico)', nome: 'Lipoproteína de baixa densidade (LDL)', unidade: 'mg/dL', min: null, max: 130 },
  { grupo: 'Lipidograma (perfil lipídico)', nome: 'Lipoproteína de muito baixa densidade (VLDL)', unidade: 'mg/dL', min: null, max: 30 },
  { grupo: 'Lipidograma (perfil lipídico)', nome: 'Triglicerídeos', unidade: 'mg/dL', min: null, max: 150 },

  // --- Outros exames comuns (usados nos perfis básico/completo) ---
  { grupo: 'Outros exames comuns', nome: 'TGO / AST', unidade: 'U/L', min: null, max: 35 },
  { grupo: 'Outros exames comuns', nome: 'TGP / ALT', unidade: 'U/L', min: null, max: 35 },
  { grupo: 'Outros exames comuns', nome: 'Gama GT (GGT)', unidade: 'U/L', min: null, max: 40 },
  { grupo: 'Outros exames comuns', nome: 'Fosfatase alcalina', unidade: 'U/L', min: 35, max: 104 },
  { grupo: 'Outros exames comuns', nome: 'Bilirrubina total', unidade: 'mg/dL', min: null, max: 1.2 },
  { grupo: 'Outros exames comuns', nome: 'Ureia', unidade: 'mg/dL', min: 10, max: 50 },
  { grupo: 'Outros exames comuns', nome: 'Creatinina', unidade: 'mg/dL', min: 0.5, max: 1.1 },
  { grupo: 'Outros exames comuns', nome: 'Ácido úrico', unidade: 'mg/dL', min: 2.4, max: 5.7 },
  { grupo: 'Outros exames comuns', nome: 'Cistatina C', unidade: 'mg/L', min: 0.56, max: 0.99 },
  { grupo: 'Outros exames comuns', nome: 'Microalbuminúria', unidade: 'mg/L', min: null, max: null },
  { grupo: 'Outros exames comuns', nome: 'Capacidade total de ligação do ferro', unidade: 'µg/dL', min: null, max: null },
  { grupo: 'Outros exames comuns', nome: 'Índice de saturação da transferrina', unidade: '%', min: 15, max: 50 },
  { grupo: 'Outros exames comuns', nome: 'Proteína C-reativa ultrassensível (PCR-US)', unidade: 'mg/L', min: null, max: 5.0 },
  { grupo: 'Outros exames comuns', nome: 'TSH', unidade: 'µUI/mL', min: 0.40, max: 4.50 },
  { grupo: 'Outros exames comuns', nome: 'T4 Livre', unidade: 'ng/dL', min: 0.8, max: 1.9 },
  { grupo: 'Outros exames comuns', nome: 'PTH', unidade: 'pg/mL', min: null, max: null },
  { grupo: 'Outros exames comuns', nome: 'Lp(a)', unidade: 'mg/dL', min: null, max: null },

  // --- Eletrólitos (comum em painéis metabólicos) ---
  { grupo: 'Eletrólitos', nome: 'Sódio', unidade: 'mEq/L', min: 136, max: 145 },
  { grupo: 'Eletrólitos', nome: 'Potássio', unidade: 'mEq/L', min: 3.5, max: 5.1 },
]

export const GRUPOS_CATALOGO = [...new Set(CATALOGO_EXAMES.map((e) => e.grupo))]
