/**
 * EVALUAOS - Engine de Recomendação Automática de Equações Antropométricas
 * Baseado no TCC (Marco Aurélio Neves Junior, 2026) & Módulo de Muscularidade (ARGOREF / Baglietto 2024 / Lee 2000 / Kerr 1991)
 */

import { 
  classificarArgoref, 
  classificarPercentilItaliano, 
  classificarImc 
} from './escalasNormativas'

export function recomendarEquacaoIdeal(medidas = {}, paciente = {}) {
  if (!medidas || !paciente) {
    return {
      nomeEquacaoRecomendada: '',
      motivo: '',
      travaKerr: { massaAdiposaKg: 0, pctAdiposo: 0 },
      indicadoresCruzados: {}
    }
  }

  const sexo = paciente.sexo || 'M'
  
  // 1. DADOS DEMOGRÁFICOS & IDADE
  let idade = Number(paciente.idade || paciente.idade_anos) || 0
  if (!idade && (paciente.data_nascimento || paciente.data_nasc)) {
    const dataNascStr = paciente.data_nascimento || paciente.data_nasc
    const birthDate = new Date(dataNascStr + 'T12:00:00')
    const evalDate = new Date()
    idade = evalDate.getFullYear() - birthDate.getFullYear()
    const m = evalDate.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && evalDate.getDate() < birthDate.getDate())) idade--
  }
  if (!idade || idade <= 0) idade = 25; // Fallback

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

  // 3. ADIPOSIDADE SUBCUTÂNEA BRUTA (S6D)
  const soma6 = tr + sub + si + se + ab + cx

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

  // 4. CÁLCULO PRECISO DOS ÍNDICES DE MUSCULARIDADE
  // A) IMO Kerr & Ross
  const parte1 = 0.6 * alturaCm * Math.pow(dUmero + dFemur + dRadio + dMaleolar, 2) * 0.0001
  const tCoxa = cCoxa - (cx * 0.3141)
  const tPant = cPant - (pa * 0.3141)
  const parte2 = (alturaCm * (0.0553 * Math.pow(tCoxa, 2) + 0.0987 * Math.pow(cAntebraco, 2) + 0.0331 * Math.pow(tPant, 2)) - 2445) * 0.001
  
  const imoKerr = (parte1 > 0 && parte2 > 0) ? (parte2 / parte1) : 0

  // B) Massa Muscular de Lee (2000) e IMO de Lee/Rocha
  const bracoCorr = pBraco - (tr * 0.3141)
  const coxaCorr = cCoxa - (cx * 0.3141)
  const pantCorr = cPant - (pa * 0.3141)
  
  const termoBraco = Math.pow(bracoCorr, 2)
  const termoCoxa = Math.pow(coxaCorr, 2)
  const termoPant = Math.pow(pantCorr, 2)

  let massaMuscularLee = 0
  if (alturaM > 0 && pBraco > 0 && cCoxa > 0 && cPant > 0) {
    const sexoNum = sexo === 'M' ? 1 : 0
    let racaNum = 0
    if (paciente.etnia === 'Afrodescendente') racaNum = 1.1
    if (paciente.etnia === 'Asiatico') racaNum = -2
    massaMuscularLee = (alturaM * ((0.00744 * termoBraco) + (0.00088 * termoCoxa) + (0.00441 * termoPant))) + (2.4 * sexoNum) - (0.048 * idade) + racaNum + 7.8
  }

  // IMO Lee/Rocha
  let massaOsseaRocha = 0
  if (alturaM > 0 && dUmero > 0 && dFemur > 0) {
    massaOsseaRocha = 3.02 * Math.pow(Math.pow(alturaM, 2) * (dUmero / 100) * (dFemur / 100) * 400, 0.712)
  }
  const imoLeeRocha = (massaMuscularLee > 0 && massaOsseaRocha > 0) ? (massaMuscularLee / massaOsseaRocha) : 0

  const pctMuscularLee = peso > 0 ? (massaMuscularLee / peso) * 100 : 0

  // DETECÇÃO DE HIPERTROFIA / ELEVADA MUSCULARIDADE
  const ehHipertrofiado = (sexo === 'M' && (imoKerr >= 4.6 || imoLeeRocha >= 3.0 || pctMuscularLee >= 46.8)) ||
                         (sexo === 'F' && (imoKerr >= 3.7 || imoLeeRocha >= 2.6 || pctMuscularLee >= 40.8))

  // DETECÇÃO DE SARCOPENIA / BAIXA MUSCULARIDADE
  const ehBaixaMuscularidade = (sexo === 'M' && pctMuscularLee < 32.0) || (sexo === 'F' && pctMuscularLee < 28.0)

  // 5. IMC
  const imcVal = alturaM > 0 ? peso / (alturaM * alturaM) : 0
  const classImc = classificarImc(imcVal)?.classificacao || '-'

  // 6. MASSA ADIPOSA KERR (1991) - TRAVA BIOLÓGICA
  let massaAdiposaKerr = 0
  if (soma6 > 0 && alturaCm > 0) {
    const zAdiposo = ((soma6 * (170.18 / alturaCm)) - 116.41) / 34.79
    massaAdiposaKerr = Math.max(0, ((zAdiposo * 5.85) + 25.6) * Math.pow(alturaCm / 170.18, 3))
  }
  const pctAdiposoKerr = peso > 0 ? Number(((massaAdiposaKerr / peso) * 100).toFixed(2)) : 0

  // 7. MOTOR DE DECISÃO CLÍNICA
  let nomeEquacaoRecomendada = ''
  let motivo = ''

  if (idade < 18) {
    nomeEquacaoRecomendada = 'Slaughter et al. (1988) - 2skf'
    motivo = `Paciente jovem (${idade} anos). Protocolo ajustado para maturação biológica e crescimento infantojuvenil.`
  }
  else if (idade >= 60) {
    if (sexo === 'M') {
      nomeEquacaoRecomendada = 'Durnin et al. (1974) - 4skf (50 a 72 anos)'
      motivo = `Paciente idoso (${idade} anos). Ajustado pela referência (${referenciaDobrasUsada}) para compensar perdas minerais e redistribuição tecidual.`
    } else {
      nomeEquacaoRecomendada = 'Durnin 4skf - Variação F (50+ anos Alt)'
      motivo = `Paciente idosa (${idade} anos). Ajustado pela referência (${referenciaDobrasUsada}) para compensar alteração da densidade mineral óssea.`
    }
  }
  // SE FOR ALTA MUSCULARIDADE / HIPERTROFIA
  else if (ehHipertrofiado || (imcVal >= 25.0 && ehHipertrofiado)) {
    if (sexo === 'M') {
      nomeEquacaoRecomendada = 'Durnin et al. (1974) - 4skf (17 a 72 anos)'
      motivo = `Alta Muscularidade Confirmada (IMO Kerr ${imoKerr.toFixed(2)} | IMO Lee ${imoLeeRocha.toFixed(2)}). A equação por dobras isola a hipertrofia muscular do acúmulo de gordura.`
    } else {
      nomeEquacaoRecomendada = 'Jackson et al. (1980) - 3skf'
      motivo = `Alta Muscularidade Confirmada (IMO Kerr ${imoKerr.toFixed(2)} | IMO Lee ${imoLeeRocha.toFixed(2)}). Equação por dobras evita o viés de peso total.`
    }
  }
  // SE FOR BAIXA MUSCULARIDADE / RISCO DE SARCOPENIA
  else if (ehBaixaMuscularidade) {
    nomeEquacaoRecomendada = sexo === 'M' ? 'Petroski (1995) - 4skf' : 'Petroski (1995) - 4skf'
    motivo = `Baixa Muscularidade Detectada (${pctMuscularLee.toFixed(1)}% muscular). Equação com ajuste regional para não subestimar gordura.`
  }
  // SE FOR ATLETA DE MODALIDADE ESPECÍFICA
  else if (esporte || modalidade) {
    if (modalidade.includes('futebol') || modalidade.includes('soccer')) {
      nomeEquacaoRecomendada = sexo === 'M' ? 'Reilly et al. (2009) - 4skf ISAK' : 'Withers et al. (1987) - 6skf'
      motivo = 'Atleta de futebol/soccer. Protocolo ISAK validado na modalidade.'
    } 
    else if (modalidade.includes('natação') || modalidade.includes('natacao') || modalidade.includes('swimming')) {
      nomeEquacaoRecomendada = sexo === 'M' ? 'Mitchell et al. (2020) - 7skf ISAK' : 'Mitchell et al. 2020 7skd ISAK'
      motivo = 'Atleta de natação. Equação validada contra DXA para a alta densidade de nadadores.'
    }
    else if (modalidade.includes('luta') || modalidade.includes('jiu') || modalidade.includes('judo') || modalidade.includes('mma')) {
      nomeEquacaoRecomendada = sexo === 'M' ? 'Evans et al. (2005) - 3skf (Brancos)' : 'Evans et al. 2005 3skf Brancas'
      motivo = 'Atleta de modalidades de combate. Validado em modelos 4C para alta densidade musculoesquelética.'
    }
    else {
      nomeEquacaoRecomendada = sexo === 'M' ? 'Withers et al. (1987) - 7skf' : 'Withers et al. (1987) - 6skf'
      motivo = 'Atleta com elevado condicionamento físico. Padrão ISAK de alta sensibilidade regional.'
    }
  }
  // POPULAÇÃO GERAL BRASILEIRA
  else {
    if (soma6 > 130) {
      nomeEquacaoRecomendada = sexo === 'M' ? 'Weltman et al. (1987) - Por Perímetros' : 'Weltman et al. (1988) - Perímetros'
      motivo = `Dobras elevadas (Σ6 = ${soma6} mm). Recomendada equação por circunferências para evitar viés de compressibilidade do adipômetro.`
    } else {
      nomeEquacaoRecomendada = 'Petroski (1995) - 4skf'
      motivo = `Adulto populacional (${idade} anos). Equação validada na população brasileira por pesagem hidrostática.`
    }
  }

  return {
    nomeEquacaoRecomendada,
    motivo,
    travaKerr: {
      massaAdiposaKg: Number(massaAdiposaKerr.toFixed(2)),
      pctAdiposo: pctAdiposoKerr
    },
    indicadoresCruzados: {
      soma6,
      referenciaUsada: referenciaDobrasUsada,
      statusDobras: statusDobrasBrutas,
      imoKerr: imoKerr > 0 ? Number(imoKerr.toFixed(2)) : '-',
      imoLeeRocha: imoLeeRocha > 0 ? Number(imoLeeRocha.toFixed(2)) : '-',
      pctMuscularLee: pctMuscularLee > 0 ? Number(pctMuscularLee.toFixed(1)) : '-',
      ehHipertrofiado,
      imc: Number(imcVal.toFixed(1)),
      classificacaoImc: classImc
    }
  }
}