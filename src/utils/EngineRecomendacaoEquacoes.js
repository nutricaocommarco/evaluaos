/**
 * EVALUAOS - Engine de Recomendação Automática de Equações Antropométricas (V2.0)
 * Integrado com Simulação Paralela, Fracionamento 5C e Score de Aderência
 */

import { 
  classificarArgoref, 
  classificarPercentilItaliano, 
  classificarImc 
} from './escalasNormativas'

// Importe as listas de equações exportadas do seu arquivo de equações
import { listaFeminina, listaMasculina } from '../utils/listaEquacoes' 

export function recomendarEquacoesIdeais(medidas = {}, paciente = {}) {
  if (!medidas || !paciente) {
    return {
      recomendacaoPrimaria: null,
      recomendacoesSecundarias: [],
      travaKerr: { massaAdiposaKg: 0, pctAdiposo: 0 },
      indicadoresCruzados: {}
    }
  }

  const sexo = paciente.sexo || 'M'
  
  // 1. DADOS DEMOGRÁFICOS E IDADE
  let idade = Number(paciente.idade || paciente.idade_anos) || 0
  if (!idade && (paciente.data_nascimento || paciente.data_nasc)) {
    const dataNascStr = paciente.data_nascimento || paciente.data_nasc
    const birthDate = new Date(dataNascStr + 'T12:00:00')
    const evalDate = new Date()
    idade = evalDate.getFullYear() - birthDate.getFullYear()
    const m = evalDate.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && evalDate.getDate() < birthDate.getDate())) idade--
  }
  if (!idade || idade <= 0) idade = 25;

  const esporte = paciente.pratica_esporte === true || paciente.pratica_esporte === 'true'
  const modalidade = (paciente.modalidade_esportiva || '').toLowerCase()

  // 2. EXTRAÇÃO DAS MEDIDAS
  const tr = Number(medidas.dobra_cutanea_triceps || medidas.dobra_triceps) || 0
  const sub = Number(medidas.dobra_cutanea_subescapular || medidas.dobra_subescapular) || 0
  const bi = Number(medidas.dobra_cutanea_biceps || medidas.dobra_biceps) || 0
  const si = Number(medidas.dobra_cutanea_crista_iliaca || medidas.dobra_crista_iliaca) || 0
  const se = Number(medidas.dobra_cutanea_supraespinhal || medidas.dobra_supraespinhal) || 0
  const ab = Number(medidas.dobra_cutanea_abdominal || medidas.dobra_abdominal) || 0
  const cx = Number(medidas.dobra_cutanea_coxa_media || medidas.dobra_coxa) || 0
  const pa = Number(medidas.dobra_cutanea_panturrilha || medidas.dobra_panturrilha_medial) || 0

  const peso = Number(medidas.peso_paciente || medidas.massa_kg) || 0
  const alturaCm = Number(medidas.altura_paciente || medidas.estatura_cm) || 0
  const alturaM = alturaCm / 100

  const dUmero = Number(medidas.diametro_umero) || 0
  const dFemur = Number(medidas.diametro_femur) || 0
  const dRadio = Number(medidas.diametro_punho) || 0
  const dMaleolar = Number(medidas.diametro_maleolar) || 0

  const pBraco = Number(medidas.perimetro_braco_contraido || medidas.perimetro_braco_relaxado) || 0
  const cCoxa = Number(medidas.perimetro_coxa_media) || 0
  const cAntebraco = Number(medidas.perimetro_antibraco) || 0
  const cPant = Number(medidas.perimetro_panturrilha) || 0

  const perCintura = Number(medidas.perimetro_cintura) || 0;

  // 3. ADIPOSIDADE SUBCUTÂNEA BRUTA (S6D) E S8D
  const soma6 = tr + sub + si + se + ab + cx
  const soma8 = soma6 + bi + pa

  let statusDobrasBrutas = '-'
  let referenciaDobrasUsada = '-'

  if (soma6 > 0) {
    if (idade >= 20 && idade <= 30) {
      statusDobrasBrutas = classificarArgoref(soma6, sexo).classificacao
      referenciaDobrasUsada = 'ARGOREF (Holway, 2025)'
    } else {
      statusDobrasBrutas = classificarPercentilItaliano(soma6, sexo, idade)
      referenciaDobrasUsada = `Percentil ISAK (Campa et al., 2025 - ${idade} anos)`
    }
  }

  // 4. FRACIONAMENTO TECIDUAL BASE E ÍNDICES (KERR, LEE, ROCHA)
  // Massa Muscular (Lee 2000)
  const bracoCorr = pBraco - (tr * 0.3141)
  const coxaCorr = cCoxa - (cx * 0.3141)
  const pantCorr = cPant - (pa * 0.3141)
  let massaMuscularLee = 0
  if (alturaM > 0 && pBraco > 0 && cCoxa > 0 && cPant > 0) {
    const sexoNum = sexo === 'M' ? 1 : 0
    let racaNum = 0
    if (paciente.etnia === 'Afrodescendente') racaNum = 1.1
    if (paciente.etnia === 'Asiatico') racaNum = -2
    massaMuscularLee = (alturaM * ((0.00744 * Math.pow(bracoCorr, 2)) + (0.00088 * Math.pow(coxaCorr, 2)) + (0.00441 * Math.pow(pantCorr, 2)))) + (2.4 * sexoNum) - (0.048 * idade) + racaNum + 7.8
  }

  // Massa Óssea (Rocha 1975)
  let massaOsseaRocha = 0
  if (alturaM > 0 && dUmero > 0 && dFemur > 0) {
    massaOsseaRocha = 3.02 * Math.pow(Math.pow(alturaM, 2) * (dUmero / 100) * (dFemur / 100) * 400, 0.712)
  }

  // Índices de Muscularidade
  const imoLeeRocha = (massaMuscularLee > 0 && massaOsseaRocha > 0) ? (massaMuscularLee / massaOsseaRocha) : 0
  const pctMuscularLee = peso > 0 ? (massaMuscularLee / peso) * 100 : 0

  // Detecção Clínica de Muscularidade
  const ehHipertrofiado = (sexo === 'M' && (imoLeeRocha >= 3.0 || pctMuscularLee >= 46.8)) || (sexo === 'F' && (imoLeeRocha >= 2.6 || pctMuscularLee >= 40.8))
  const ehBaixaMuscularidade = (sexo === 'M' && pctMuscularLee < 32.0) || (sexo === 'F' && pctMuscularLee < 28.0)

  // IMC
  const imcVal = alturaM > 0 ? peso / (alturaM * alturaM) : 0

  // 5. MASSA ADIPOSA DE KERR (A TRAVA BIOLÓGICA)
  let massaAdiposaKerr = 0
  if (soma6 > 0 && alturaCm > 0) {
    const zAdiposo = ((soma6 * (170.18 / alturaCm)) - 116.41) / 34.79
    massaAdiposaKerr = Math.max(0, ((zAdiposo * 5.85) + 25.6) * Math.pow(alturaCm / 170.18, 3))
  }
  const pctAdiposoKerr = peso > 0 ? (massaAdiposaKerr / peso) * 100 : 0

  // 6. MOTOR DE SIMULAÇÃO PARALELA E SCORE
  const equacoesAplicaveis = sexo === 'F' ? listaFeminina : listaMasculina;
  let recomendacoes = [];

  equacoesAplicaveis.forEach(eq => {
    try {
      const resultado = eq.func(medidas, paciente);
      const pctGorduraCalc = typeof resultado === 'object' ? resultado.valor : resultado;
      const info = typeof resultado === 'object' ? resultado.info : null;

      if (pctGorduraCalc > 0 && pctGorduraCalc < 60) {
        let score = 0;
        let motivosSelecao = [];
        let massaGordaEstimada = (pctGorduraCalc / 100) * peso;

        // TRAVA DE KERR: A massa gorda estimada não deve ultrapassar a massa adiposa física
        if (massaGordaEstimada > massaAdiposaKerr) {
            score -= 50; // Penalidade grave por inviabilidade biológica
            motivosSelecao.push(`Atenção: A gordura estimada (${massaGordaEstimada.toFixed(1)}kg) excede a Massa Adiposa física de Kerr (${massaAdiposaKerr.toFixed(1)}kg). Risco de viés matemático.`);
        } else {
            score += 15;
            motivosSelecao.push(`Resultado seguro: A massa de gordura calculada (${massaGordaEstimada.toFixed(1)}kg) respeita o teto biológico da Massa Adiposa anatômica de Kerr (${massaAdiposaKerr.toFixed(1)}kg).`);
        }

        // CRUZAMENTO 1: Idade
        if (info && idade >= parseInt(info.idadeMin || 0) && idade <= parseInt(info.idadeMax || 99)) {
          score += 20;
          motivosSelecao.push(`Enquadramento perfeito na faixa etária do protocolo original (${info.faixaEtaria}).`);
        }

        // CRUZAMENTO 2: Perfil Hipertrofiado x Protocolo Atleta/Dobras
        if (ehHipertrofiado) {
          if (info && info.populacao.toLowerCase().includes('atleta')) {
            score += 30;
            motivosSelecao.push(`Alta Muscularidade (IMO: ${imoLeeRocha.toFixed(1)}). A equação compensa a alta densidade musculoesquelética para evitar superestimativa de gordura.`);
          } else if (info && info.tipo === 'imc') {
            score -= 40; // Penalidade para IMC em hipertrofiados
            motivosSelecao.push(`Penalidade: Protocolos baseados em IMC subestimam massa magra em pacientes com elevada muscularidade.`);
          }
        }

        // CRUZAMENTO 3: Sarcopenia / Baixa Muscularidade
        if (ehBaixaMuscularidade && info && info.populacao.toLowerCase().includes('geral')) {
          score += 15;
          motivosSelecao.push(`Compatível com o perfil de Baixa Muscularidade (${pctMuscularLee.toFixed(1)}% de massa muscular calculada por Lee).`);
        }

        // CRUZAMENTO 4: Compressibilidade do Tecido Adiposo (Dobras Altas)
        if (soma6 > 130) {
          if (info && info.tipo === 'perimetros') {
            score += 40;
            motivosSelecao.push(`Dobras extremas (Σ6D = ${soma6} mm). Recomendação por perímetros evita o erro de compressibilidade do adipômetro comum em espessuras maiores.`);
          } else if (info && info.protocolo.includes('4 Dobras') || info.protocolo.includes('7 Dobras')) {
            score -= 20;
          }
        } else if (soma6 <= 130 && info && info.tipo === 'dobras') {
            score += 20;
            motivosSelecao.push(`Adiposidade subcutânea permite precisão ótima pela aferição mecânica das dobras cutâneas.`);
        }

        // CRUZAMENTO 5: Modalidade Esportiva
        if (esporte && info) {
            if ((modalidade.includes('futebol') || modalidade.includes('soccer')) && info.populacao.toLowerCase().includes('futebol')) score += 50;
            if ((modalidade.includes('nadador') || modalidade.includes('natação')) && info.populacao.toLowerCase().includes('nadador')) score += 50;
        }

        // Adiciona à lista final se o score não for impeditivo
        if (score > 0) {
            recomendacoes.push({
                nome: eq.nome,
                resultado: pctGorduraCalc,
                score: score,
                motivoFormatado: motivosSelecao.join(' '),
                info: info
            });
        }
      }
    } catch (e) {
      console.error(`Erro ao simular equação ${eq.nome}`, e);
    }
  });

  // 7. ORDENAÇÃO E PREPARAÇÃO DOS DADOS FINAIS
  recomendacoes.sort((a, b) => b.score - a.score);

  return {
    recomendacaoPrimaria: recomendacoes.length > 0 ? recomendacoes[0] : null,
    recomendacoesSecundarias: recomendacoes.length > 1 ? recomendacoes.slice(1, 4) : [],
    travaKerr: {
      massaAdiposaKg: Number(massaAdiposaKerr.toFixed(2)),
      pctAdiposo: Number(pctAdiposoKerr.toFixed(2))
    },
    indicadoresCruzados: {
      soma6,
      soma8,
      referenciaUsada: referenciaDobrasUsada,
      statusDobras: statusDobrasBrutas,
      imoLeeRocha: imoLeeRocha > 0 ? Number(imoLeeRocha.toFixed(2)) : '-',
      pctMuscularLee: pctMuscularLee > 0 ? Number(pctMuscularLee.toFixed(1)) : '-',
      ehHipertrofiado,
      ehBaixaMuscularidade,
      imc: Number(imcVal.toFixed(1)),
      classificacaoImc: classImc
    }
  }
}