/**
 * MÚDULO DE TABELAS E ESCALAS NORMATIVAS - EVALUAOS
 * Referências: 
 * - ARGOREF: Holway (2025)
 * - apVAT: Samouda et al. (2013); Validações de Brown et al. (2017, 2018) e Ruiz-Castell et al. (2021)
 * - Percentis ISAK: Campa et al. (2025)
 * - Gordura %: Morrow et al. (2003) e Lohman (1992)
 * - Diretrizes Cardiometabólicas: OMS / WHO
 * - Somatotipo: Carter & Heath (1990)
 */

// 1. ESCALA DE ÁREA DE PREVISÃO VISCERAL - apVAT (Samouda et al., 2013; Ruiz-Castell et al., 2021)
export function classificarApVat(apvat, sexo) {
  if (!apvat || apvat <= 0) return { classificacao: '-', cor: 'gray' };

  if (sexo === 'M') {
    if (apvat < 113.8) return { classificacao: 'Baixo Risco (Q1)', cor: 'emerald' };
    if (apvat <= 151.6) return { classificacao: 'Risco Moderado (Q2)', cor: 'amber' };
    if (apvat <= 196.7) return { classificacao: 'Risco Elevado (Q3)', cor: 'orange' };
    return { classificacao: 'Risco Muito Elevado (Q4)', cor: 'red' };
  } else {
    if (apvat < 58.8) return { classificacao: 'Baixo Risco (Q1)', cor: 'emerald' };
    if (apvat <= 89.4) return { classificacao: 'Risco Moderado (Q2)', cor: 'amber' };
    if (apvat <= 127.4) return { classificacao: 'Risco Elevado (Q3)', cor: 'orange' };
    return { classificacao: 'Risco Muito Elevado (Q4)', cor: 'red' };
  }
}

// 2. ESCALA DE IMC (Organização Mundial da Saúde - OMS)
export function classificarImc(imc) {
  if (!imc || imc <= 0) return { classificacao: '-', cor: 'gray' };

  if (imc < 18.5) return { classificacao: 'Abaixo do Peso', cor: 'blue' };
  if (imc < 25.0) return { classificacao: 'Peso Normal (Eutrofia)', cor: 'emerald' };
  if (imc < 30.0) return { classificacao: 'Sobrepeso', cor: 'amber' };
  if (imc < 35.0) return { classificacao: 'Obesidade Grau I', cor: 'orange' };
  if (imc < 40.0) return { classificacao: 'Obesidade Grau II', cor: 'orange' };
  return { classificacao: 'Obesidade Grau III', cor: 'red' };
}

// 3. RELAÇÃO CINTURA-ESTATURA (RCE) - Diretrizes de Saúde Geral
export function classificarRce(rce) {
  if (!rce || rce <= 0) return { classificacao: '-', cor: 'gray' };

  if (rce < 0.40) return { classificacao: 'Risco (Muito Baixo)', cor: 'blue' };
  if (rce <= 0.50) return { classificacao: 'Saudável (Baixo Risco)', cor: 'emerald' };
  if (rce <= 0.60) return { classificacao: 'Risco Aumentado', cor: 'amber' };
  return { classificacao: 'Risco Muito Aumentado', cor: 'red' };
}

// 4. RELAÇÃO CINTURA-QUADRIL (RCQ) - OMS (Risco Cardiometabólico)
export function classificarRcq(rcq, sexo) {
  if (!rcq || rcq <= 0) return { classificacao: '-', cor: 'gray' };

  if (sexo === 'M') {
    if (rcq < 0.90) return { classificacao: 'Baixo Risco', cor: 'emerald' };
    if (rcq <= 0.99) return { classificacao: 'Risco Moderado', cor: 'amber' };
    return { classificacao: 'Risco Alto', cor: 'red' };
  } else {
    if (rcq < 0.80) return { classificacao: 'Baixo Risco', cor: 'emerald' };
    if (rcq <= 0.85) return { classificacao: 'Risco Moderado', cor: 'amber' };
    return { classificacao: 'Risco Alto', cor: 'red' };
  }
}

// 5. PONTOS DE APOIO VERBAIS DO SOMATOTIPO (Carter & Heath, 1990)
export function classificarSomatotipoDetalhado({ endomorfia, mesomorfia, ectomorfia }) {
  const descreverEndo = (val) => {
    if (!val || val <= 0) return '-';
    if (val <= 2.5) return 'Baixo acúmulo de gordura corporal. A pele é fina e os contornos de ossos e músculos são bem visíveis.';
    if (val <= 4.5) return 'Gordura corporal moderada. Uma camada suave cobre os músculos e ossos, dando um aspecto físico macio, mas equilibrado.';
    if (val <= 6.5) return 'Acúmulo elevado de gordura corporal. Tronco e braços/pernas têm aspecto arredondado, com maior concentração de gordura na região abdominal.';
    return 'Gordura corporal bastante elevada. Camada espessa de gordura subcutânea espalhada pelo corpo, principalmente na barriga e na parte alta dos braços e coxas.';
  };

  const descreverMeso = (val) => {
    if (!val || val <= 0) return '-';
    if (val <= 2.5) return 'Desenvolvimento muscular e ósseo discreto. Estrutura física mais fina, com articulações e ossos pequenos.';
    if (val <= 4.5) return 'Desenvolvimento muscular e ósseo moderado. Estrutura física equilibrada, com bom volume muscular e ossos de tamanho médio.';
    if (val <= 6.5) return 'Forte desenvolvimento muscular e ósseo. Músculos bem desenhados e volumosos, ombros largos e articulações firmes e grandes.';
    return 'Desenvolvimento muscular e ósseo máximo. Fisico naturally muito forte, com massa muscular densa, volumosa e ossatura bem larga.';
  };

  const descreverEcto = (val) => {
    if (!val || val <= 0) return '-';
    if (val <= 2.5) return 'Estrutura mais compacta e densa. Menor sensação de comprimento em relação ao volume do corpo.';
    if (val <= 4.5) return 'Estrutura física moderadamente alongada. Proporção equilibrada entre a altura e o volume do corpo.';
    if (val <= 6.5) return 'Corpo magro e alongado. Estrutura fina, com poucos volumes de gordura ou músculo acumulados.';
    return 'Estrutura física bastante alta e esguia. Braços e pernas longos, com perfil muito magro e pouca massa acumulada por altura.';
  };

  return {
    endomorfia: { valor: endomorfia, descricao: descreverEndo(endomorfia) },
    mesomorfia: { valor: mesomorfia, descricao: descreverMeso(mesomorfia) },
    ectomorfia: { valor: ectomorfia, descricao: descreverEcto(ectomorfia) }
  };
}

// 6. ESCALA ARGOREF (Holway, 2025) - Σ 6 Dobras para Adultos (20 a 30 anos)
export function classificarArgoref(soma6, sexo) {
  if (!soma6 || soma6 <= 0) return { classificacao: '-', cor: 'gray' };

  if (sexo === 'M') {
    if (soma6 < 33.6) return { classificacao: 'Muito Baixo', cor: 'blue' };
    if (soma6 <= 47.1) return { classificacao: 'Baixo', cor: 'emerald' };
    if (soma6 <= 84.2) return { classificacao: 'Normal', cor: 'emerald' };
    if (soma6 <= 94.3) return { classificacao: 'Elevado', cor: 'amber' };
    return { classificacao: 'Muito Elevado', cor: 'red' };
  } else {
    if (soma6 < 61.9) return { classificacao: 'Muito Baixo', cor: 'blue' };
    if (soma6 <= 69.5) return { classificacao: 'Baixo', cor: 'emerald' };
    if (soma6 <= 112.4) return { classificacao: 'Normal', cor: 'emerald' };
    if (soma6 <= 121.6) return { classificacao: 'Elevado', cor: 'amber' };
    return { classificacao: 'Muito Elevado', cor: 'red' };
  }
}

// 7. PERCENTIS ITALIANOS / ISAK (Campa et al., 2025) - Σ 6 Dobras por Faixa Etária
export function classificarPercentilItaliano(soma6, sexo, idade) {
  if (!soma6 || soma6 <= 0 || !idade) return '-';

  const tabela = [
    { minIdade: 0, maxIdade: 19, M: [59.8, 68.3, 85.0, 111.0, 137.7, 163.8], H: [33.2, 39.7, 47.6, 67.0, 96.0, 119.7] },
    { minIdade: 20, maxIdade: 24, M: [54.6, 66.7, 80.5, 102.4, 129.8, 151.3], H: [36.0, 44.2, 53.4, 68.3, 92.0, 126.0] },
    { minIdade: 25, maxIdade: 29, M: [61.6, 71.0, 82.0, 99.6, 128.0, 162.4], H: [41.1, 48.3, 61.9, 80.4, 112.8, 130.1] },
    { minIdade: 30, maxIdade: 34, M: [60.1, 70.4, 83.5, 104.1, 127.6, 154.3], H: [40.1, 46.9, 60.5, 81.3, 111.1, 134.1] },
    { minIdade: 35, maxIdade: 39, M: [60.8, 71.7, 88.6, 113.2, 139.3, 171.6], H: [45.0, 55.3, 69.3, 92.5, 116.5, 137.0] },
    { minIdade: 40, maxIdade: 44, M: [69.6, 81.3, 98.7, 128.9, 162.6, 180.4], H: [47.0, 55.0, 67.1, 90.0, 113.3, 128.3] },
    { minIdade: 45, maxIdade: 49, M: [67.6, 83.0, 113.4, 134.2, 151.3, 174.7], H: [50.1, 61.2, 75.9, 99.0, 116.0, 130.7] },
    { minIdade: 50, maxIdade: 54, M: [63.4, 80.9, 102.9, 127.3, 151.8, 175.0], H: [66.7, 77.0, 93.9, 104.9, 122.3, 138.0] },
    { minIdade: 55, maxIdade: 59, M: [55.2, 69.9, 80.6, 101.5, 123.3, 162.7], H: [38.7, 43.6, 52.6, 74.3, 112.6, 145.0] },
    { minIdade: 60, maxIdade: 120, M: [59.8, 69.0, 80.1, 99.3, 114.5, 133.5], H: [78.5, 88.5, 98.9, 117.2, 147.6, 173.9] }
  ];

  const faixa = tabela.find(f => idade >= f.minIdade && idade <= f.maxIdade) || tabela[tabela.length - 1];
  const p = sexo === 'M' ? faixa.H : faixa.M;

  if (soma6 < p[0]) return 'Abaixo do P3';
  if (soma6 < p[1]) return 'P3 - P10';
  if (soma6 < p[2]) return 'P10 - P25';
  if (soma6 < p[3]) return 'P25 - P50 (Média)';
  if (soma6 < p[4]) return 'P50 - P75';
  if (soma6 < p[5]) return 'P75 - P90';
  return 'Acima do P90';
}

// 8. CLASSIFICAÇÃO DE MORROW ET AL. (2003) - % Gordura por Idade
export function classificarMorrow(percentualGordura, sexo, idade) {
  if (!percentualGordura || percentualGordura <= 0 || !idade) return { classificacao: '-', cor: 'gray' };

  const limitesHomens = [
    { maxAge: 25, mb: 7, b: 10, bMedia: 13, m: 16, eMedia: 20, elev: 26 },
    { maxAge: 35, mb: 12, b: 15, bMedia: 18, m: 21, eMedia: 24, elev: 28 },
    { maxAge: 45, mb: 14, b: 18, bMedia: 21, m: 24, eMedia: 26, elev: 29 },
    { maxAge: 55, mb: 16, b: 20, bMedia: 23, m: 25, eMedia: 28, elev: 31 },
    { maxAge: 65, mb: 18, b: 21, bMedia: 24, m: 26, eMedia: 28, elev: 31 },
    { maxAge: 120, mb: 18, b: 21, bMedia: 23, m: 25, eMedia: 27, elev: 30 }
  ];

  const limitesMulheres = [
    { maxAge: 25, mb: 17, b: 20, bMedia: 23, m: 25, eMedia: 28, elev: 31 },
    { maxAge: 35, mb: 18, b: 21, bMedia: 23, m: 26, eMedia: 30, elev: 35 },
    { maxAge: 45, mb: 19, b: 23, bMedia: 26, m: 29, eMedia: 32, elev: 36 },
    { maxAge: 55, mb: 22, b: 25, bMedia: 28, m: 31, eMedia: 34, elev: 38 },
    { maxAge: 65, mb: 23, b: 26, bMedia: 30, m: 33, eMedia: 36, elev: 38 },
    { maxAge: 120, mb: 18, b: 25, bMedia: 29, m: 32, eMedia: 35, elev: 38 }
  ];

  const regras = (sexo === 'M' ? limitesHomens : limitesMulheres).find(r => idade <= r.maxAge) || limitesHomens[limitesHomens.length - 1];

  if (percentualGordura <= regras.mb) return { classificacao: 'Muito Baixo', cor: 'blue' };
  if (percentualGordura <= regras.b) return { classificacao: 'Baixo', cor: 'emerald' };
  if (percentualGordura <= regras.bMedia) return { classificacao: 'Abaixo da Média', cor: 'emerald' };
  if (percentualGordura <= regras.m) return { classificacao: 'Média', cor: 'emerald' };
  if (percentualGordura <= regras.eMedia) return { classificacao: 'Acima da Média', cor: 'amber' };
  if (percentualGordura <= regras.elev) return { classificacao: 'Elevado', cor: 'orange' };
  return { classificacao: 'Muito Elevado', cor: 'red' };
}

// 9.1 ÍNDICE CÓRMICO - Proporção Tronco/Estatura (Biotipo)
export function calcularIndiceCormico(alturaSentadaCm, alturaCm) {
  if (!alturaSentadaCm || !alturaCm) return { valor: 0, classificacao: '-' };

  const valor = alturaSentadaCm / alturaCm;
  let classificacao = 'Mesocórmico (Proporção Média)';
  if (valor < 0.51) classificacao = 'Braquicórmico (Tronco Curto)';
  else if (valor > 0.53) classificacao = 'Macrocórmico (Tronco Longo)';

  return { valor, classificacao };
}

// 9.2 ÍNDICE DE MANOUVRIER - Proporção dos Membros Inferiores (Biotipo)
export function calcularIndiceManouvrier(alturaSentadaCm, alturaCm) {
  if (!alturaSentadaCm || !alturaCm) return { valor: 0, classificacao: '-' };

  const valor = ((alturaCm - alturaSentadaCm) / alturaSentadaCm) * 100;
  let classificacao = 'Normolíneo (Membros Proporcionais)';
  if (valor < 85) classificacao = 'Brevilíneo (Membros Inferiores Curtos)';
  else if (valor > 90) classificacao = 'Longilíneo (Membros Inferiores Longos)';

  return { valor, classificacao };
}

// 9.3 ENVERGADURA RELATIVA - Envergadura de Braços vs Estatura (Biotipo)
export function calcularEnvergaduraRelativa(envergaduraCm, alturaCm) {
  if (!envergaduraCm || !alturaCm) return { valor: 0, classificacao: '-' };

  const valor = envergaduraCm / alturaCm;
  let classificacao = 'Proporcional à Estatura';
  if (valor < 0.98) classificacao = 'Menor que a Estatura';
  else if (valor > 1.02) classificacao = 'Maior que a Estatura';

  return { valor, classificacao };
}

// 9.4 ÍNDICE DE CONICIDADE (Valdez, 1991) - Risco Cardiovascular
export function calcularIndiceConicidade(pesoKg, alturaCm, cinturaCm) {
  if (!pesoKg || !alturaCm || !cinturaCm) return 0;

  const alturaM = alturaCm / 100;
  const cinturaM = cinturaCm / 100;
  return cinturaM / (0.109 * Math.sqrt(pesoKg / alturaM));
}

export function classificarConicidade(indice, sexo) {
  if (!indice || indice <= 0) return { classificacao: '-', cor: 'gray' };

  if (sexo === 'M') {
    if (indice < 1.10) return { classificacao: 'Baixo Risco', cor: 'emerald' };
    if (indice < 1.25) return { classificacao: 'Risco Moderado', cor: 'amber' };
    return { classificacao: 'Risco Alto', cor: 'red' };
  } else {
    if (indice < 1.05) return { classificacao: 'Baixo Risco', cor: 'emerald' };
    if (indice < 1.18) return { classificacao: 'Risco Moderado', cor: 'amber' };
    return { classificacao: 'Risco Alto', cor: 'red' };
  }
}

// 9.5 CLASSIFICAÇÃO DO ÍNDICE MÚSCULO-ÓSSEO (IMO) - Massa Muscular (Martin 1990) /
// Massa Óssea (Martin 1991), tabela normativa Holway (dados não publicados, atletas argentinos)
export function classificarImo(imo, sexo) {
  if (!imo || imo <= 0) return { classificacao: '-', cor: 'gray' };

  if (sexo === 'M') {
    if (imo < 3.7) return { classificacao: 'Muito Baixo', cor: 'blue' };
    if (imo < 4.0) return { classificacao: 'Baixo', cor: 'emerald' };
    if (imo <= 5.0) return { classificacao: 'Normal', cor: 'emerald' };
    if (imo <= 5.6) return { classificacao: 'Elevado', cor: 'amber' };
    return { classificacao: 'Muito Elevado', cor: 'red' };
  } else {
    if (imo < 2.8) return { classificacao: 'Muito Baixo', cor: 'blue' };
    if (imo < 3.2) return { classificacao: 'Baixo', cor: 'emerald' };
    if (imo <= 4.4) return { classificacao: 'Normal', cor: 'emerald' };
    if (imo <= 4.8) return { classificacao: 'Elevado', cor: 'amber' };
    return { classificacao: 'Muito Elevado', cor: 'red' };
  }
}

// 10. CLASSIFICAÇÃO DE LOHMAN (1992) - Risco à Saúde por %Gordura
export function classificarLohman(percentualGordura, sexo) {
  if (!percentualGordura || percentualGordura <= 0) return { classificacao: '-', cor: 'gray' };

  if (sexo === 'M') {
    if (percentualGordura <= 5) return { classificacao: 'Risco (Magreza Extrema)', cor: 'blue' };
    if (percentualGordura <= 14) return { classificacao: 'Abaixo da Média', cor: 'emerald' };
    if (percentualGordura <= 15) return { classificacao: 'Média / Ideal', cor: 'emerald' };
    if (percentualGordura <= 24) return { classificacao: 'Acima da Média', cor: 'amber' };
    return { classificacao: 'Risco (Obesidade)', cor: 'red' };
  } else {
    if (percentualGordura <= 12) return { classificacao: 'Risco (Magreza Extrema)', cor: 'blue' };
    if (percentualGordura <= 22) return { classificacao: 'Abaixo da Média', cor: 'emerald' };
    if (percentualGordura <= 23) return { classificacao: 'Média / Ideal', cor: 'emerald' };
    if (percentualGordura <= 31) return { classificacao: 'Acima da Média', cor: 'amber' };
    return { classificacao: 'Risco (Obesidade)', cor: 'red' };
  }
}

// =====================================================================
// 11. TABELAS DE REFERÊNCIA PRA POPUP — mesmos números das funções
// classificar* acima, só reorganizados em formato de exibição. Ficam
// juntos de propósito: qualquer ajuste de faixa feito numa função
// classificar* precisa ser espelhado aqui também (não há como derivar
// automaticamente um do outro sem reescrever as funções pra tabela-driven).
// =====================================================================

const FAIXAS_ETARIAS_MORROW = ['18-25', '26-35', '36-45', '46-55', '56-65', '≥66']

function linhaMorrow(label, chave, tabela) {
  return { label, valores: tabela.map((r) => `${r[chave][0]} a ${r[chave][1]}`) }
}

// Espelha limitesHomens/limitesMulheres de classificarMorrow, mas com o
// intervalo completo [min,max] de cada faixa (a função classificar só
// guarda o teto de cada uma).
const TABELA_MORROW_HOMENS = [
  { mb: [4, 7], b: [8, 10], bMedia: [11, 13], m: [14, 16], eMedia: [18, 20], elev: [22, 26], muitoElev: [28, 37] },
  { mb: [8, 12], b: [13, 15], bMedia: [16, 18], m: [19, 21], eMedia: [22, 24], elev: [25, 28], muitoElev: [30, 37] },
  { mb: [10, 14], b: [16, 18], bMedia: [19, 21], m: [22, 24], eMedia: [25, 26], elev: [27, 29], muitoElev: [30, 38] },
  { mb: [12, 16], b: [18, 20], bMedia: [21, 23], m: [24, 25], eMedia: [26, 28], elev: [29, 31], muitoElev: [32, 38] },
  { mb: [15, 18], b: [19, 21], bMedia: [22, 24], m: [24, 26], eMedia: [26, 28], elev: [29, 31], muitoElev: [32, 38] },
  { mb: [15, 18], b: [19, 21], bMedia: [22, 23], m: [24, 25], eMedia: [25, 27], elev: [28, 30], muitoElev: [31, 38] },
]
const TABELA_MORROW_MULHERES = [
  { mb: [13, 17], b: [18, 20], bMedia: [21, 23], m: [24, 25], eMedia: [26, 28], elev: [29, 31], muitoElev: [33, 43] },
  { mb: [13, 18], b: [19, 21], bMedia: [22, 23], m: [24, 26], eMedia: [27, 30], elev: [31, 35], muitoElev: [36, 48] },
  { mb: [15, 19], b: [20, 23], bMedia: [24, 26], m: [27, 29], eMedia: [30, 32], elev: [33, 36], muitoElev: [39, 48] },
  { mb: [18, 22], b: [23, 25], bMedia: [26, 28], m: [29, 31], eMedia: [32, 34], elev: [36, 38], muitoElev: [40, 49] },
  { mb: [18, 23], b: [24, 26], bMedia: [28, 30], m: [31, 33], eMedia: [34, 36], elev: [36, 38], muitoElev: [39, 46] },
  { mb: [16, 18], b: [22, 25], bMedia: [27, 29], m: [30, 32], eMedia: [33, 35], elev: [36, 38], muitoElev: [39, 40] },
]

// PERCENTIS ITALIANOS / ISAK (mesma tabela de classificarPercentilItaliano)
const TABELA_PERCENTIL_ITALIANO = [
  { faixa: '<20', M: [59.8, 68.3, 85.0, 111.0, 137.7, 163.8], H: [33.2, 39.7, 47.6, 67.0, 96.0, 119.7] },
  { faixa: '20-24', M: [54.6, 66.7, 80.5, 102.4, 129.8, 151.3], H: [36.0, 44.2, 53.4, 68.3, 92.0, 126.0] },
  { faixa: '25-29', M: [61.6, 71.0, 82.0, 99.6, 128.0, 162.4], H: [41.1, 48.3, 61.9, 80.4, 112.8, 130.1] },
  { faixa: '30-34', M: [60.1, 70.4, 83.5, 104.1, 127.6, 154.3], H: [40.1, 46.9, 60.5, 81.3, 111.1, 134.1] },
  { faixa: '35-39', M: [60.8, 71.7, 88.6, 113.2, 139.3, 171.6], H: [45.0, 55.3, 69.3, 92.5, 116.5, 137.0] },
  { faixa: '40-44', M: [69.6, 81.3, 98.7, 128.9, 162.6, 180.4], H: [47.0, 55.0, 67.1, 90.0, 113.3, 128.3] },
  { faixa: '45-49', M: [67.6, 83.0, 113.4, 134.2, 151.3, 174.7], H: [50.1, 61.2, 75.9, 99.0, 116.0, 130.7] },
  { faixa: '50-54', M: [63.4, 80.9, 102.9, 127.3, 151.8, 175.0], H: [66.7, 77.0, 93.9, 104.9, 122.3, 138.0] },
  { faixa: '55-59', M: [55.2, 69.9, 80.6, 101.5, 123.3, 162.7], H: [38.7, 43.6, 52.6, 74.3, 112.6, 145.0] },
  { faixa: '≥60', M: [59.8, 69.0, 80.1, 99.3, 114.5, 133.5], H: [78.5, 88.5, 98.9, 117.2, 147.6, 173.9] },
]

// Descreve pra qual das 4 faixas de somatotipo (usadas em
// classificarSomatotipoDetalhado) um valor cai — só pra destacar a linha
// certa no popup, mesmos cortes (≤2.5 / ≤4.5 / ≤6.5 / >6.5).
function faixaSomatotipo(valor) {
  if (!valor || valor <= 0) return null
  if (valor <= 2.5) return 0
  if (valor <= 4.5) return 1
  if (valor <= 6.5) return 2
  return 3
}

// Monta o conteúdo do popup de referência pra um indicador — devolve
// null se não houver tabela pronta pra esse tipo (o popup simplesmente
// não aparece nesse caso, sem quebrar nada).
export function obterTabelaReferencia(tipo, { sexo, idade, valorAtual } = {}) {
  switch (tipo) {
    case 'imc':
      return {
        titulo: 'IMC — Classificação (OMS, 1998)',
        fonte: 'Organização Mundial da Saúde, 1998',
        tipo: 'lista',
        linhas: [
          { faixa: '< 18,5', label: 'Abaixo do Peso', cor: 'blue' },
          { faixa: '18,5 – 24,9', label: 'Peso Normal (Eutrofia)', cor: 'emerald' },
          { faixa: '25,0 – 29,9', label: 'Sobrepeso', cor: 'amber' },
          { faixa: '30,0 – 34,9', label: 'Obesidade Grau I', cor: 'orange' },
          { faixa: '35,0 – 39,9', label: 'Obesidade Grau II', cor: 'orange' },
          { faixa: '≥ 40,0', label: 'Obesidade Grau III', cor: 'red' },
        ],
      }
    case 'rce':
      return {
        titulo: 'Relação Cintura-Estatura (RCE)',
        fonte: 'Diretrizes gerais de risco cardiometabólico',
        tipo: 'lista',
        linhas: [
          { faixa: '< 0,40', label: 'Risco (Muito Baixo)', cor: 'blue' },
          { faixa: '0,40 – 0,50', label: 'Saudável (Baixo Risco)', cor: 'emerald' },
          { faixa: '0,50 – 0,60', label: 'Risco Aumentado', cor: 'amber' },
          { faixa: '> 0,60', label: 'Risco Muito Aumentado', cor: 'red' },
        ],
      }
    case 'rcq':
      return {
        titulo: 'Relação Cintura-Quadril (RCQ)',
        fonte: 'Organização Mundial da Saúde',
        tipo: 'lista',
        linhas: sexo === 'M'
          ? [
              { faixa: '< 0,90', label: 'Baixo Risco', cor: 'emerald' },
              { faixa: '0,90 – 0,99', label: 'Risco Moderado', cor: 'amber' },
              { faixa: '≥ 1,00', label: 'Risco Alto', cor: 'red' },
            ]
          : [
              { faixa: '< 0,80', label: 'Baixo Risco', cor: 'emerald' },
              { faixa: '0,80 – 0,85', label: 'Risco Moderado', cor: 'amber' },
              { faixa: '> 0,85', label: 'Risco Alto', cor: 'red' },
            ],
      }
    case 'conicidade':
      return {
        titulo: 'Índice de Conicidade',
        fonte: 'Valdez, 1991',
        tipo: 'lista',
        linhas: sexo === 'M'
          ? [
              { faixa: '< 1,10', label: 'Baixo Risco', cor: 'emerald' },
              { faixa: '1,10 – 1,25', label: 'Risco Moderado', cor: 'amber' },
              { faixa: '≥ 1,25', label: 'Risco Alto', cor: 'red' },
            ]
          : [
              { faixa: '< 1,05', label: 'Baixo Risco', cor: 'emerald' },
              { faixa: '1,05 – 1,18', label: 'Risco Moderado', cor: 'amber' },
              { faixa: '≥ 1,18', label: 'Risco Alto', cor: 'red' },
            ],
      }
    case 'apvat':
      return {
        titulo: 'apVAT — Área de Previsão Visceral',
        fonte: 'Samouda et al., 2013; Ruiz-Castell et al., 2021',
        tipo: 'lista',
        linhas: sexo === 'M'
          ? [
              { faixa: '< 113,8', label: 'Baixo Risco (Q1)', cor: 'emerald' },
              { faixa: '113,8 – 151,6', label: 'Risco Moderado (Q2)', cor: 'amber' },
              { faixa: '151,6 – 196,7', label: 'Risco Elevado (Q3)', cor: 'orange' },
              { faixa: '> 196,7', label: 'Risco Muito Elevado (Q4)', cor: 'red' },
            ]
          : [
              { faixa: '< 58,8', label: 'Baixo Risco (Q1)', cor: 'emerald' },
              { faixa: '58,8 – 89,4', label: 'Risco Moderado (Q2)', cor: 'amber' },
              { faixa: '89,4 – 127,4', label: 'Risco Elevado (Q3)', cor: 'orange' },
              { faixa: '> 127,4', label: 'Risco Muito Elevado (Q4)', cor: 'red' },
            ],
      }
    case 'argoref':
      return {
        titulo: 'Σ 6 Dobras — ARGOREF (adultos 20-30 anos)',
        fonte: 'Holway, F. E. — Tablas Argoref',
        tipo: 'lista',
        linhas: sexo === 'M'
          ? [
              { faixa: '< 33,6 mm', label: 'Muito Baixo', cor: 'blue' },
              { faixa: '33,6 – 47,1 mm', label: 'Baixo', cor: 'emerald' },
              { faixa: '47,1 – 84,2 mm', label: 'Normal', cor: 'emerald' },
              { faixa: '84,2 – 94,3 mm', label: 'Elevado', cor: 'amber' },
              { faixa: '> 94,3 mm', label: 'Muito Elevado', cor: 'red' },
            ]
          : [
              { faixa: '< 61,9 mm', label: 'Muito Baixo', cor: 'blue' },
              { faixa: '61,9 – 69,5 mm', label: 'Baixo', cor: 'emerald' },
              { faixa: '69,5 – 112,4 mm', label: 'Normal', cor: 'emerald' },
              { faixa: '112,4 – 121,6 mm', label: 'Elevado', cor: 'amber' },
              { faixa: '> 121,6 mm', label: 'Muito Elevado', cor: 'red' },
            ],
      }
    case 'imo':
      return {
        titulo: 'Índice Músculo-Ósseo (IMO)',
        fonte: 'Martin et al. (1990/1991); Holway (dados não publicados, atletas argentinos)',
        tipo: 'lista',
        linhas: sexo === 'M'
          ? [
              { faixa: '< 3,7', label: 'Muito Baixo', cor: 'blue' },
              { faixa: '3,7 – 4,0', label: 'Baixo', cor: 'emerald' },
              { faixa: '4,0 – 5,0', label: 'Normal (média 4,5)', cor: 'emerald' },
              { faixa: '5,0 – 5,6', label: 'Elevado', cor: 'amber' },
              { faixa: '> 5,6', label: 'Muito Elevado', cor: 'red' },
            ]
          : [
              { faixa: '< 2,8', label: 'Muito Baixo', cor: 'blue' },
              { faixa: '2,8 – 3,2', label: 'Baixo', cor: 'emerald' },
              { faixa: '3,2 – 4,4', label: 'Normal', cor: 'emerald' },
              { faixa: '4,4 – 4,8', label: 'Elevado', cor: 'amber' },
              { faixa: '> 4,8', label: 'Muito Elevado', cor: 'red' },
            ],
      }
    case 'lohman':
      return {
        titulo: '% Gordura — Risco à Saúde (Lohman, 1992)',
        fonte: 'Lohman, 1992',
        tipo: 'lista',
        linhas: sexo === 'M'
          ? [
              { faixa: '≤ 5%', label: 'Risco (Magreza Extrema)', cor: 'blue' },
              { faixa: '6 – 14%', label: 'Abaixo da Média', cor: 'emerald' },
              { faixa: '15%', label: 'Média / Ideal', cor: 'emerald' },
              { faixa: '16 – 24%', label: 'Acima da Média', cor: 'amber' },
              { faixa: '> 24%', label: 'Risco (Obesidade)', cor: 'red' },
            ]
          : [
              { faixa: '≤ 12%', label: 'Risco (Magreza Extrema)', cor: 'blue' },
              { faixa: '13 – 22%', label: 'Abaixo da Média', cor: 'emerald' },
              { faixa: '23%', label: 'Média / Ideal', cor: 'emerald' },
              { faixa: '24 – 31%', label: 'Acima da Média', cor: 'amber' },
              { faixa: '> 31%', label: 'Risco (Obesidade)', cor: 'red' },
            ],
      }
    case 'morrow': {
      const tabela = sexo === 'M' ? TABELA_MORROW_HOMENS : TABELA_MORROW_MULHERES
      return {
        titulo: `% Gordura por Idade — Morrow et al. (2003)${sexo === 'M' ? ' — Homens' : ' — Mulheres'}`,
        fonte: 'Morrow et al., 2003',
        tipo: 'matriz',
        colunas: FAIXAS_ETARIAS_MORROW,
        linhas: [
          linhaMorrow('Muito baixo', 'mb', tabela),
          linhaMorrow('Baixo', 'b', tabela),
          linhaMorrow('Abaixo da média', 'bMedia', tabela),
          linhaMorrow('Média', 'm', tabela),
          linhaMorrow('Acima da média', 'eMedia', tabela),
          linhaMorrow('Elevado', 'elev', tabela),
          linhaMorrow('Muito elevado', 'muitoElev', tabela),
        ],
      }
    }
    case 'percentil-isak': {
      const idx = sexo === 'M' ? 'H' : 'M'
      return {
        titulo: `Σ 6 Dobras — Percentis ISAK por Idade${sexo === 'M' ? ' — Homens' : ' — Mulheres'}`,
        fonte: 'Campa et al., 2025',
        tipo: 'matriz',
        colunas: ['Idade', 'P3', 'P10', 'P25', 'P50', 'P75', 'P90'],
        linhas: TABELA_PERCENTIL_ITALIANO.map((f) => ({ label: f.faixa, valores: f[idx].map((v) => v.toFixed(1)) })),
      }
    }
    case 'somatotipo': {
      const descricoes = {
        endomorfia: [
          'Baixo acúmulo de gordura corporal. A pele é fina e os contornos de ossos e músculos são bem visíveis.',
          'Gordura corporal moderada. Uma camada suave cobre os músculos e ossos, dando um aspecto físico macio, mas equilibrado.',
          'Acúmulo elevado de gordura corporal. Tronco e braços/pernas têm aspecto arredondado, com maior concentração de gordura na região abdominal.',
          'Gordura corporal bastante elevada. Camada espessa de gordura subcutânea espalhada pelo corpo, principalmente na barriga e na parte alta dos braços e coxas.',
        ],
        mesomorfia: [
          'Desenvolvimento muscular e ósseo discreto. Estrutura física mais fina, com articulações e ossos pequenos.',
          'Desenvolvimento muscular e ósseo moderado. Estrutura física equilibrada, com bom volume muscular e ossos de tamanho médio.',
          'Forte desenvolvimento muscular e ósseo. Músculos bem desenhados e volumosos, ombros largos e articulações firmes e grandes.',
          'Desenvolvimento muscular e ósseo máximo. Físico naturalmente muito forte, com massa muscular densa, volumosa e ossatura bem larga.',
        ],
        ectomorfia: [
          'Estrutura mais compacta e densa. Menor sensação de comprimento em relação ao volume do corpo.',
          'Estrutura física moderadamente alongada. Proporção equilibrada entre a altura e o volume do corpo.',
          'Corpo magro e alongado. Estrutura fina, com poucos volumes de gordura ou músculo acumulados.',
          'Estrutura física bastante alta e esguia. Braços e pernas longos, com perfil muito magro e pouca massa acumulada por altura.',
        ],
      }
      const nomes = ['≤ 2,5 (baixo)', '2,6 – 4,5 (moderado)', '4,6 – 6,5 (alto)', '> 6,5 (muito alto)']
      const componente = sexo // reaproveita o parâmetro sexo pra passar qual componente (endomorfia/mesomorfia/ectomorfia)
      return {
        titulo: `Somatotipo — ${componente.charAt(0).toUpperCase()}${componente.slice(1)} (Carter & Heath, 1990)`,
        fonte: 'Carter & Heath, 1990',
        tipo: 'lista',
        linhas: nomes.map((faixa, i) => ({ faixa, label: descricoes[componente][i], cor: 'gray' })),
      }
    }
    default:
      return null
  }
}

// Índice (0-3) da faixa de somatotipo em que um valor cai — usado só pra
// destacar a linha certa no popup.
export function indiceFaixaSomatotipo(valor) {
  return faixaSomatotipo(valor)
}