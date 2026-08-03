/**
 * Módulo de Cálculos Antropométricos - EvaluaOS
 * Arquivo: calculosAntropometricos.js
 * Protocolos: Petroski, Jackson & Pollock, Guedes, Faulkner, Somatotipo Heath-Carter, apVAT (Samouda 2013) e Fracionamento 4C De Rose et al.
 */

export function calcularResultadosAntropometricos(dados, sexo, idade = 25) {
  const peso = parseFloat(dados.peso_paciente) || 0
  const alturaCm = parseFloat(dados.altura_paciente) || 0
  const alturaM = alturaCm / 100

  // 1. ÍNDICE DE MASSA CORPORAL (IMC)
  const imc = alturaM > 0 ? (peso / (alturaM * alturaM)).toFixed(2) : null

  // Extração das Dobras Cutâneas (mm)
  const triceps = parseFloat(dados.dobra_triceps || dados.dobra_cutanea_triceps) || 0
  const subescapular = parseFloat(dados.dobra_subescapular || dados.dobra_cutanea_subescapular) || 0
  const biceps = parseFloat(dados.dobra_biceps || dados.dobra_cutanea_biceps) || 0
  const cristaIliaca = parseFloat(dados.dobra_crista_iliaca || dados.dobra_cutanea_crista_iliaca) || 0
  const supraespinal = parseFloat(dados.dobra_supraespinal || dados.dobra_cutanea_supraespinhal) || 0
  const abdominal = parseFloat(dados.dobra_abdominal || dados.dobra_cutanea_abdominal) || 0
  const coxa = parseFloat(dados.dobra_coxa || dados.dobra_cutanea_coxa_media) || 0
  const panturrilha = parseFloat(dados.dobra_panturrilha_medial || dados.dobra_cutanea_panturrilha) || 0

  // Perímetros (cm)
  const perimCintura = parseFloat(dados.perimetro_cintura) || 0
  const perimCoxaMaxima = parseFloat(dados.perimetro_coxa_maxima) || 0

  // 💡 2. CÁLCULO DA ÁREA DE PREVISÃO VISCERAL (apVAT - Samouda et al., 2013)
  let apvat = 0
  if (perimCintura > 0 && perimCoxaMaxima > 0) {
    if (sexo === 'M') {
      apvat = (6 * perimCintura) - (4.41 * perimCoxaMaxima) + (1.19 * idade) - 213.65
    } else {
      const imcVal = parseFloat(imc) || 0
      apvat = (2.15 * perimCintura) - (3.63 * perimCoxaMaxima) + (1.46 * idade) + (6.22 * imcVal) - 92.713
    }
  }
  apvat = Math.max(0, Number(apvat.toFixed(1)))

  // 3. SOMATÓRIOS DE DOBRAS
  const somatorio6 = (triceps + subescapular + cristaIliaca + supraespinal + abdominal + coxa).toFixed(1)
  const somatorio8 = (triceps + subescapular + biceps + cristaIliaca + supraespinal + abdominal + coxa + panturrilha).toFixed(1)

  // 4. DENSIDADE CORPORAL & PERCENTUAL DE GORDURA (%G)
  let percentualGordura = 0
  const equacao = dados.equacao_de_regressao_escolhida || 'Petroski'

  if (equacao === 'Petroski') {
    if (sexo === 'M') {
      const densidade = 1.10726863 - 0.00081201 * (triceps + subescapular + supraespinal + panturrilha) + 0.00000212 * Math.pow(triceps + subescapular + supraespinal + panturrilha, 2) - 0.00041761 * idade
      percentualGordura = (4.95 / densidade - 4.5) * 100
    } else {
      const densidade = 1.0296 - 0.00068 * (triceps + subescapular + cristaIliaca + coxa) + 0.0000026 * Math.pow(triceps + subescapular + cristaIliaca + coxa, 2) - 0.00029 * idade
      percentualGordura = (4.95 / densidade - 4.5) * 100
    }
  } else if (equacao === 'Faulkner') {
    percentualGordura = (triceps + subescapular + supraespinal + abdominal) * 0.153 + 5.783
  } else {
    let densidade = 1.05
    if (sexo === 'M') {
      const soma3 = triceps + cristaIliaca + abdominal
      densidade = 1.10938 - (0.0008267 * soma3) + (0.0000016 * soma3 * soma3) - (0.0002574 * idade)
    } else {
      const soma3 = triceps + cristaIliaca + coxa
      densidade = 1.0994921 - (0.0009929 * soma3) + (0.0000023 * soma3 * soma3) - (0.0001392 * idade)
    }
    percentualGordura = (4.95 / densidade - 4.5) * 100
  }

  percentualGordura = parseFloat(Math.max(3, Math.min(60, percentualGordura)).toFixed(2))

  // 5. FRACIONAMENTO DE MASSA EM 4 COMPONENTES (MÉTODO DE ROSE ET AL.)
  const diamUmero = parseFloat(dados.diametro_umero || dados.diametro_biepicondilar_umero) || 0
  const diamFemur = parseFloat(dados.diametro_femur || dados.diametro_bicondilar_femur) || 0

  // A. Massa Adiposa / Gorda (kg)
  const massaGordaKg = parseFloat(((peso * percentualGordura) / 100).toFixed(2))
  const massaMagraKg = parseFloat((peso - massaGordaKg).toFixed(2))

  // B. Massa Óssea (Von Döbeln modificada por Rocha, 1975)
  let massaOsseaKg = 0
  if (alturaM > 0 && diamUmero > 0 && diamFemur > 0) {
    massaOsseaKg = 3.02 * Math.pow(Math.pow(alturaM, 2) * (diamUmero / 100) * (diamFemur / 100) * 400, 0.712)
  }
  massaOsseaKg = parseFloat(massaOsseaKg.toFixed(2))

  // C. Massa Residual (Würch, 1973)
  const pctResidualWurch = sexo === 'M' ? 0.24 : 0.21
  const massaResidualKg = parseFloat((peso * pctResidualWurch).toFixed(2))

  // D. Massa Muscular (Diferencial residual do modelo de 4C de De Rose)
  const massaMuscularDeRoseKg = parseFloat(Math.max(0, peso - (massaGordaKg + massaOsseaKg + massaResidualKg)).toFixed(2))

  // Percentuais Fracionados de De Rose (%)
  const pctMassaGordaDeRose = peso > 0 ? parseFloat(((massaGordaKg / peso) * 100).toFixed(1)) : 0
  const pctMassaMuscularDeRose = peso > 0 ? parseFloat(((massaMuscularDeRoseKg / peso) * 100).toFixed(1)) : 0
  const pctMassaOsseaDeRose = peso > 0 ? parseFloat(((massaOsseaKg / peso) * 100).toFixed(1)) : 0
  const pctMassaResidualDeRose = peso > 0 ? parseFloat(((massaResidualKg / peso) * 100).toFixed(1)) : 0

  // 6. PERÍMETROS CORRIGIDOS (cm)
  const perimBraco = parseFloat(dados.perimetro_braco_relaxado) || 0
  const perimCoxa = parseFloat(dados.perimetro_coxa_media || dados.perimetro_coxa_medial) || 0
  const perimPanturrilha = parseFloat(dados.perimetro_panturrilha) || 0

  const perimBracoCorr = perimBraco > 0 ? (perimBraco - (Math.PI * (triceps / 10))).toFixed(2) : null
  const perimCoxaCorr = perimCoxa > 0 ? (perimCoxa - (Math.PI * (coxa / 10))).toFixed(2) : null
  const perimPantCorr = perimPanturrilha > 0 ? (perimPanturrilha - (Math.PI * (panturrilha / 10))).toFixed(2) : null

  // 7. SOMATOTIPO (Heath-Carter)
  const soma3Somato = (triceps + subescapular + supraespinal) * (170.18 / (alturaCm || 170))
  const endomorfia = (-0.7182 + (0.1451 * soma3Somato) - (0.00068 * Math.pow(soma3Somato, 2)) + (0.0000014 * Math.pow(soma3Somato, 3))).toFixed(2)

  const umeroSomato = diamUmero || 6.5
  const femurSomato = diamFemur || 9.5
  const mesomorfia = ((0.858 * umeroSomato) + (0.601 * femurSomato) + (0.188 * (perimBracoCorr || 25)) + (0.161 * (perimPantCorr || 30)) - (0.161 * alturaCm) + 1.601).toFixed(2)

  const hwr = alturaCm / Math.pow(peso || 1, 1 / 3)
  let ectomorfia = 0
  if (hwr >= 40.75) {
    ectomorfia = (0.732 * hwr) - 28.58
  } else if (hwr > 38.25) {
    ectomorfia = (0.463 * hwr) - 17.63
  } else {
    ectomorfia = 0.1
  }
  ectomorfia = ectomorfia.toFixed(2)

  const somatocartaX = (parseFloat(ectomorfia) - parseFloat(endomorfia)).toFixed(2)
  const somatocartaY = ((2 * parseFloat(mesomorfia)) - (parseFloat(endomorfia) + parseFloat(ectomorfia))).toFixed(2)

  return {
    imc: parseFloat(imc),
    massa_gorda: massaGordaKg,
    massa_magra: massaMagraKg,
    
    // 🌟 COMPONENTES DE DE ROSE ET AL. (4C)
    massa_ossea_derose: massaOsseaKg,
    massa_residual_derose: massaResidualKg,
    massa_muscular_derose: massaMuscularDeRoseKg,
    pct_massa_gorda_derose: pctMassaGordaDeRose,
    pct_massa_muscular_derose: pctMassaMuscularDeRose,
    pct_massa_ossea_derose: pctMassaOsseaDeRose,
    pct_massa_residual_derose: pctMassaResidualDeRose,

    area_previsao_visceral_apvat: apvat,
    somatorio_6_dobras: parseFloat(somatorio6),
    somatorio_8_dobras: parseFloat(somatorio8),
    perimetro_corrigido_braco: parseFloat(perimBracoCorr),
    perimetro_corrigido_coxa: parseFloat(perimCoxaCorr),
    perimetro_corrigido_panturrilha: parseFloat(perimPantCorr),
    somatotipo_endomorfia: parseFloat(endomorfia),
    somatotipo_mesomorfia: parseFloat(mesomorfia),
    somatotipo_ectomorfia: parseFloat(ectomorfia),
    somatocarta_eixo_x: parseFloat(somatocartaX),
    somatocarta_eixo_y: parseFloat(somatocartaY)
  }
}