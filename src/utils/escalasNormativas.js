/**
 * MÚDULO DE TABELAS E ESCALAS NORMATIVAS - EVALUAOS
 * Referências: ARGOREF (Holway), Campa et al. (2025), Morrow et al. (2003), Lohman (1992)
 */

// 1. ESCALA ARGOREF (Holway, 2025) - Σ 6 Dobras para Adultos (20 a 30 anos)
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

// 2. PERCENTIS ITALIANOS / ISAK (Campa et al., 2025) - Σ 6 Dobras por Faixa Etária
export function classificarPercentilItaliano(soma6, sexo, idade) {
  if (!soma6 || soma6 <= 0 || !idade) return '-';

  // Tabela de percentis
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

// 3. CLASSIFICAÇÃO DE MORROW ET AL. (2003) - % Gordura por Idade
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

// 4. CLASSIFICAÇÃO DE LOHMAN (1992) - Risco à Saúde por %Gordura
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