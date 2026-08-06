export function calcularFFMI(peso, percentualGordura, alturaCm) {
  const alturaM = alturaCm / 100;
  const massaGorda = peso * (percentualGordura / 100);
  const mlg = peso - massaGorda;
  
  const ffmi = mlg / (alturaM * alturaM);
  const ffmiNormalizado = ffmi + 6.1 * (1.80 - alturaM);

  return {
    mlg: Number(mlg.toFixed(1)),
    ffmi: Number(ffmi.toFixed(1)),
    ffmiNormalizado: Number(ffmiNormalizado.toFixed(1))
  };
}

export function projetarGanhosHipertrofia(sexo, nivelTreino, peso, mlgAtual) {
  const isMasculino = sexo === 'M';
  
  const projecaoLyle = {
    iniciante: { 
      homem: { ano: [9.0, 11.3], mes: [0.75, 0.94] }, 
      mulher: { ano: [4.5, 5.4], mes: [0.38, 0.45] } 
    },
    intermediario: { 
      homem: { ano: [4.5, 5.5], mes: [0.38, 0.46] }, 
      mulher: { ano: [2.25, 2.7], mes: [0.19, 0.23] } 
    },
    avancado: { 
      homem: { ano: [2.25, 2.75], mes: [0.19, 0.23] }, 
      mulher: { ano: [1.1, 1.4], mes: [0.09, 0.12] } 
    },
    veterano: { 
      homem: { ano: [0.5, 1.4], mes: [0.04, 0.12] }, 
      mulher: { ano: [0.25, 0.7], mes: [0.02, 0.06] } 
    }
  };

  const projecaoAragon = {
    iniciante: [1.0, 1.5],
    intermediario: [0.5, 1.0],
    avancado: [0.25, 0.5],
    veterano: [0.1, 0.25]
  };

  const taxasLyle = projecaoLyle[nivelTreino][isMasculino ? 'homem' : 'mulher'];
  const taxasAragonPct = projecaoAragon[nivelTreino];
  
  const aragonMesKg = [
    (taxasAragonPct[0] / 100) * peso,
    (taxasAragonPct[1] / 100) * peso
  ];

  return {
    lyleAno: taxasLyle.ano,
    lyleMes: taxasLyle.mes,
    aragonMesPct: taxasAragonPct,
    aragonMesKg: [Number(aragonMesKg[0].toFixed(2)), Number(aragonMesKg[1].toFixed(2))],
    mlgProjetadaAnoLyle: [
      Number((mlgAtual + taxasLyle.ano[0]).toFixed(1)),
      Number((mlgAtual + taxasLyle.ano[1]).toFixed(1))
    ]
  };
}

export function gerarRecomendacaoNutricional(nivelTreino) {
  const macros = {
    iniciante: { superavit: "+10% a +20%", superavitNum: [0.10, 0.20], alvoPesoSemanal: "0.25% a 0.50% do peso", proteina: "1.6 a 2.2 g/kg", particionamento: "Favorável (Maioria MLG)" },
    intermediario: { superavit: "+10% a +15%", superavitNum: [0.10, 0.15], alvoPesoSemanal: "0.25% a 0.40% do peso", proteina: "1.6 a 2.2 g/kg", particionamento: "Equilibrado (1:1)" },
    avancado: { superavit: "+5% a +10%", superavitNum: [0.05, 0.10], alvoPesoSemanal: "Aprox. 0.25% do peso", proteina: "1.6 a 2.2 g/kg", particionamento: "Risco Lipídico Elevado" },
    veterano: { superavit: "+5%", superavitNum: [0.05, 0.05], alvoPesoSemanal: "< 0.15% do peso", proteina: "1.8 a 2.4 g/kg", particionamento: "Risco Lipídico Muito Elevado" }
  };
  return macros[nivelTreino];
}
