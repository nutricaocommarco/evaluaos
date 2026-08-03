/**
 * EVALUAOS - Engine de Recomendação Automática de Equações Antropométricas
 * Baseado no Trabalho de Conclusão de Curso (TCC - Marco Aurélio Neves Junior, 2026)
 * & Cruzamento das Escalas Normativas (escalasNormativas.js)
 * 
 * REFERÊNCIAS DE CRUZAMENTO:
 * - ARGOREF: Holway (2025) [Jovens 20-30 anos]
 * - Percentis ISAK: Campa et al. (2025) [Estratificado por idade]
 * - Tabela de Aptidão: Morrow et al. (2003)
 * - Somatotipo: Heath & Carter (1967)
 * - Trava Biológica: Kerr (1991)
 */

import { 
  classificarArgoref, 
  classificarPercentilItaliano, 
  classificarImc,
  classificarSomatotipoDetalhado 
} from './escalasNormativas'

export function recomendarEquacaoIdeal(medidas = {}, paciente = {}) {
  const sexo = paciente.sexo || 'M'
  
  // 1. DADOS DEMOGRÁFICOS & IDADE
  let idade = paciente.idade || 25
  if (!idade && paciente.data_nascimento) {
    const birthDate = new Date(paciente.data_nascimento + 'T12:00:00')
    const evalDate = new Date()
    idade = evalDate.getFullYear() - birthDate.getFullYear()
    const m = evalDate.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && evalDate.getDate() < birthDate.getDate())) idade--
  }

  const esporte = paciente.pratica_esporte || false
  const modalidade = (paciente.modalidade_esportiva || '').toLowerCase()

  // 2. EXTRAÇÃO DAS DOBRAS CUTÂNEAS (mm)
  const tr = Number(medidas.dobra_cutanea_triceps || medidas.dobra_triceps) || 0
  const sub = Number(medidas.dobra_cutanea_subescapular || medidas.dobra_subescapular) || 0
  const bi = Number(medidas.dobra_cutanea_biceps || medidas.dobra_biceps) || 0
  const si = Number(medidas.dobra_cutanea_crista_iliaca || medidas.dobra_crista_iliaca) || 0
  const se = Number(medidas.dobra_cutanea_supraespinhal || medidas.dobra_supraespinhal) || 0
  const ab = Number(medidas.dobra_cutanea_abdominal || medidas.dobra_abdominal) || 0
  const cx = Number(medidas.dobra_cutanea_coxa_media || medidas.dobra_coxa) || 0
  const pa = Number(medidas.dobra_cutanea_panturrilha || medidas.dobra_panturrilha_medial) || 0

  const peso = Number(medidas.peso_paciente) || 0
  const alturaCm = Number(medidas.altura_paciente) || 0
  const alturaM = alturaCm / 100

  // 3. INDICADORES DE ADIPOSIDADE SUBCUTÂNEA BRUTA
  const soma6 = tr + sub + si + se + ab + cx

  // Cruzamento do Indicador de Dobras segundo a Faixa Etária
  let statusDobrasBrutas = ''
  let referenciaDobrasUsada = ''

  if (idade >= 20 && idade <= 30) {
    statusDobrasBrutas = classificarArgoref(soma6, sexo).classificacao
    referenciaDobrasUsada = 'ARGOREF (Holway, 2025)'
  } else {
    // Fora da faixa de 20-30 anos, usa a Curva Percentil ISAK (Campa et al., 2025)
    statusDobrasBrutas = classificarPercentilItaliano(soma6, sexo, idade)
    referenciaDobrasUsada = `Percentil ISAK (Campa et al., 2025 - ${idade} anos)`
  }

  // 4. IMC & SOMATOTIPO (Cruzamento para Falso Sobrepeso)
  const imcVal = alturaM > 0 ? peso / (alturaM * alturaM) : 0
  const classImc = classificarImc(imcVal).classificacao

  // Somatotipo Mesomorfia Rápida
  const diamUmero = Number(medidas.diametro_umero) || 6.5
  const diamFemur = Number(medidas.diametro_femur) || 9.5
  const pBraco = Number(medidas.perimetro_braco_contraido) || 0
  const pPant = Number(medidas.perimetro_panturrilha) || 0
  
  const bracoCorr = pBraco - (tr / 10)
  const pantCorr = pPant - (pa / 10)
  
  let mesoVal = 0
  if (alturaCm > 0) {
    mesoVal = (0.858 * diamUmero) + (0.601 * diamFemur) + (0.188 * bracoCorr) + (0.161 * pantCorr) - (0.131 * alturaCm) + 4.5
  }

  const ehMusculosoFalsoSobrepeso = imcVal >= 25.0 && mesoVal >= 5.5

  // 5. CÁLCULO DA MASSA ADIPOSA ANATÔMICA DE KERR (1991) - TRAVA BIOLÓGICA
  let massaAdiposaKerr = 0
  if (soma6 > 0 && alturaCm > 0) {
    const zAdiposo = ((soma6 * (170.18 / alturaCm)) - 116.41) / 34.79
    massaAdiposaKerr = Math.max(0, ((zAdiposo * 5.85) + 25.6) * Math.pow(alturaCm / 170.18, 3))
  }
  const pctAdiposoKerr = peso > 0 ? Number(((massaAdiposaKerr / peso) * 100).toFixed(2)) : 0

  // 6. MOTOR DE DECISÃO CLÍNICA PARA RECOMENDAÇÃO DA EQUAÇÃO
  let nomeEquacaoRecomendada = ''
  let motivo = ''

  // CASO 1: CRIANÇAS E ADOLESCENTES (< 18 ANOS)
  if (idade < 18) {
    nomeEquacaoRecomendada = 'Slaughter et al. (1988) - 2skf'
    motivo = `Paciente jovem (${idade} anos). Protocolo ajustado para maturação biológica e crescimento infantojuvenil.`
  }
  // CASO 2: IDOSOS (>= 60 ANOS)
  else if (idade >= 60) {
    if (sexo === 'M') {
      nomeEquacaoRecomendada = 'Durnin et al. (1974) - 4skf (50 a 72 anos)'
      motivo = `Paciente idoso (${idade} anos). Ajustado pelo Percentil ISAK (${statusDobrasBrutas}) para compensar a perda mineral óssea e redistribuição gordurosa.`
    } else {
      nomeEquacaoRecomendada = 'Durnin 4skf - Variação F (50+ anos Alt)'
      motivo = `Paciente idosa (${idade} anos). Ajustado pelo Percentil ISAK (${statusDobrasBrutas}) para compensar alteração de densidade mineral óssea.`
    }
  }
  // CASO 3: FALSO SOBREPESO (IMC Alto + Mesomorfia Elevada)
  else if (ehMusculosoFalsoSobrepeso) {
    if (sexo === 'M') {
      nomeEquacaoRecomendada = 'Durnin et al. (1974) - 4skf (17 a 72 anos)'
      motivo = `Falso Sobrepeso Detectado (IMC ${imcVal.toFixed(1)} kg/m² com Mesomorfia ${mesoVal.toFixed(1)}). A equação por dobras foi selecionada para isolar a hipertrofia muscular do acúmulo de gordura.`
    } else {
      nomeEquacaoRecomendada = 'Jackson et al. (1980) - 3skf'
      motivo = `Perfil com alta massa muscular/estrutural. Equação por dobras evita superestimativa por peso total.`
    }
  }
  // CASO 4: ATLETAS DE ELITE E MODALIDADES ESPECÍFICAS
  else if (esporte || modalidade) {
    if (modalidade.includes('futebol') || modalidade.includes('soccer')) {
      nomeEquacaoRecomendada = sexo === 'M' ? 'Reilly et al. (2009) - 4skf ISAK' : 'Withers et al. (1987) - 6skf'
      motivo = 'Atleta de futebol/soccer. Protocolo ISAK validado na modalidade.'
    } 
    else if (modalidade.includes('natação') || modalidade.includes('natacao') || modalidade.includes('swimming')) {
      nomeEquacaoRecomendada = sexo === 'M' ? 'Mitchell et al. (2020) - 7skf ISAK' : 'Mitchell et al. 2020 7skd ISAK'
      motivo = 'Atleta de natação. Equação validada contra DXA para a alta densidade hídrica/muscular de nadadores.'
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
  // CASO 5: POPULAÇÃO GERAL E BRASILEIRA (COM TRAVA PARA DOBRAS EXTREMAS)
  else {
    if (soma6 > 130) {
      nomeEquacaoRecomendada = sexo === 'M' ? 'Weltman et al. (1987) - Por Perímetros' : 'Weltman et al. (1988) - Perímetros'
      motivo = `Dobras elevadas (Σ6 = ${soma6} mm). Recomendada equação por circunferências para evitar o viés de compressibilidade do adipômetro.`
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
      mesomorfia: mesoVal > 0 ? Number(mesoVal.toFixed(1)) : '-',
      imc: Number(imcVal.toFixed(1)),
      classificacaoImc: classImc
    }
  }
}