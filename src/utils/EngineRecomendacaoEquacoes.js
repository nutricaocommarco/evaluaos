/**
 * EVALUAOS - Sistema Especialista em Cineantropometria (Motor TCC)
 * Baseado no Critério de Decisão Clínica na Avaliação da Composição Corporal (2026)
 * & Módulo de Muscularidade (ARGOREF / Campa 2025 / Lee 2000 / Kerr 1991 / Heath-Carter)
 */

import * as Eq from './equacoes'
import { 
  classificarArgoref, 
  classificarPercentilItaliano, 
  classificarImc,
  classificarMorrow 
} from './escalasNormativas'

// MAPEAMENTO GLOBAL DE TODAS AS EQUAÇÕES DISPONÍVEIS NO SISTEMA COM METADADOS CLÍNICOS
const METADADOS_EQUACOES = [
  // --- FEMININAS ---
  { id: 'calcularFemDurnin1974', nome: 'Durnin et al. (1974) - 4skf', sexo: 'F', idadeMin: 16, idadeMax: 68, tipo: 'dobras', pop: 'geral', func: Eq.calcularFemDurnin1974 },
  { id: 'calcularFemJacksonPollock1980_3skf', nome: 'Jackson et al. (1980) - 3skf', sexo: 'F', idadeMin: 18, idadeMax: 55, tipo: 'dobras', pop: 'geral', func: Eq.calcularFemJacksonPollock1980_3skf },
  { id: 'calcularFemPetroski1995_4skf', nome: 'Petroski (1995) - 4skf', sexo: 'F', idadeMin: 18, idadeMax: 61, tipo: 'dobras', pop: 'brasileira', func: Eq.calcularFemPetroski1995_4skf },
  { id: 'calcularFemGuedes1985_3skf', nome: 'Guedes (1985) - 3skf', sexo: 'F', idadeMin: 17, idadeMax: 29, tipo: 'dobras', pop: 'universitaria', func: Eq.calcularFemGuedes1985_3skf },
  { id: 'calcularFemWithers1987_4skf', nome: 'Withers et al. (1987) - 4skf', sexo: 'F', idadeMin: 11, idadeMax: 41, tipo: 'dobras', pop: 'atleta', func: Eq.calcularFemWithers1987_4skf },
  { id: 'calcularFemWithers1987_6skf', nome: 'Withers et al. (1987) - 6skf', sexo: 'F', idadeMin: 17, idadeMax: 35, tipo: 'dobras', pop: 'atleta', func: Eq.calcularFemWithers1987_6skf },
  { id: 'calcularFemSlaughter1988_2skf', nome: 'Slaughter et al. (1988) - 2skf', sexo: 'F', idadeMin: 8, idadeMax: 17, tipo: 'dobras', pop: 'crianca', func: Eq.calcularFemSlaughter1988_2skf },
  { id: 'calcularFemYuhasz1974_6skf', nome: 'Yuhasz (1974) - 6skf', sexo: 'F', idadeMin: 18, idadeMax: 40, tipo: 'dobras', pop: 'atleta', func: Eq.calcularFemYuhasz1974_6skf },
  { id: 'calcularFemKatchMcArdle1973_3skf', nome: 'Katch & McArdle (1973) - 3skf', sexo: 'F', idadeMin: 18, idadeMax: 30, tipo: 'dobras', pop: 'universitaria', func: Eq.calcularFemKatchMcArdle1973_3skf },
  { id: 'calcularFemSloan1962_2skf', nome: 'Sloan et al. (1962) - 2skf', sexo: 'F', idadeMin: 17, idadeMax: 25, tipo: 'dobras', pop: 'universitaria', func: Eq.calcularFemSloan1962_2skf },
  { id: 'calcularFemWilmoreBehnke1970_3skf', nome: 'Wilmore & Behnke (1970) - 3skf', sexo: 'F', idadeMin: 17, idadeMax: 48, tipo: 'dobras', pop: 'geral', func: Eq.calcularFemWilmoreBehnke1970_3skf },
  { id: 'calcularFemThorlandGeneralizada1984', nome: 'Thorland et al. (1984) - Generalizada', sexo: 'F', idadeMin: 14, idadeMax: 25, tipo: 'dobras', pop: 'atleta', func: Eq.calcularFemThorlandGeneralizada1984 },
  { id: 'calcularFemLewis1978', nome: 'Lewis et al. (1978) - Dobras e Perímetros', sexo: 'F', idadeMin: 30, idadeMax: 59, tipo: 'perimetros', pop: 'atleta', func: Eq.calcularFemLewis1978 },
  { id: 'calcularFemJacksonPollock1980_4skf', nome: 'Jackson et al. (1980) - 4skf', sexo: 'F', idadeMin: 18, idadeMax: 55, tipo: 'dobras', pop: 'geral', func: Eq.calcularFemJacksonPollock1980_4skf },
  { id: 'calcularFemTranWeltman1989_Perimetros', nome: 'Tran & Weltman (1989) - Perímetros', sexo: 'F', idadeMin: 15, idadeMax: 79, tipo: 'perimetros', pop: 'idoso', func: Eq.calcularFemTranWeltman1989_Perimetros },
  { id: 'calcularFemWeltman1988_Perimetros', nome: 'Weltman et al. (1988) - Perímetros', sexo: 'F', idadeMin: 20, idadeMax: 60, tipo: 'perimetros', pop: 'obeso', func: Eq.calcularFemWeltman1988_Perimetros },
  { id: 'calcularFemWoolcottBergman2018', nome: 'Woolcott & Bergman 2018', sexo: 'F', idadeMin: 20, idadeMax: 69, tipo: 'perimetros', pop: 'obeso', func: Eq.calcularFemWoolcottBergman2018 },
  { id: 'calcularFemDeurenberg1991_IMC', nome: 'Deurenberg et al. (1991) - Por IMC', sexo: 'F', idadeMin: 18, idadeMax: 80, tipo: 'imc', pop: 'geral', func: Eq.calcularFemDeurenberg1991_IMC },
  { id: 'calcularFemMitchell2020_7skf', nome: 'Mitchell et al. 2020 7skd ISAK', sexo: 'F', idadeMin: 15, idadeMax: 28, tipo: 'dobras', pop: 'atleta', func: Eq.calcularFemMitchell2020_7skf },
  { id: 'calcularFemEston2005_3skf', nome: 'Eston et al. 2005 3skf ISAK', sexo: 'F', idadeMin: 18, idadeMax: 36, tipo: 'dobras', pop: 'geral', func: Eq.calcularFemEston2005_3skf },
  { id: 'calcularFemEvans2005_3skf_Brancas', nome: 'Evans et al. 2005 3skf Brancas', sexo: 'F', idadeMin: 18, idadeMax: 34, tipo: 'dobras', pop: 'atleta', func: Eq.calcularFemEvans2005_3skf_Brancas },
  { id: 'calcularFemEvans2005_3skf_Negras', nome: 'Evans et al. 2005 3skf Negras', sexo: 'F', idadeMin: 18, idadeMax: 26, tipo: 'dobras', pop: 'atleta', func: Eq.calcularFemEvans2005_3skf_Negras },
  { id: 'calcularFemDurnin1974_Menor17', nome: 'Durnin 4skf (menor de 17 anos)', sexo: 'F', idadeMin: 10, idadeMax: 16, tipo: 'dobras', pop: 'crianca', func: Eq.calcularFemDurnin1974_Menor17 },
  { id: 'calcularFemDurnin1974_16a19anos', nome: 'Durnin 4skf (16-19 anos)', sexo: 'F', idadeMin: 16, idadeMax: 19, tipo: 'dobras', pop: 'geral', func: Eq.calcularFemDurnin1974_16a19anos },
  { id: 'calcularFemDurnin1974_20a29anos', nome: 'Durnin 4skf (20-29 anos)', sexo: 'F', idadeMin: 20, idadeMax: 29, tipo: 'dobras', pop: 'geral', func: Eq.calcularFemDurnin1974_20a29anos },
  { id: 'calcularFemDurnin1974_30a39anos', nome: 'Durnin 4skf (30-39 anos)', sexo: 'F', idadeMin: 30, idadeMax: 39, tipo: 'dobras', pop: 'geral', func: Eq.calcularFemDurnin1974_30a39anos },
  { id: 'calcularFemDurnin1974_40a49anos', nome: 'Durnin 4skf (40-49 anos)', sexo: 'F', idadeMin: 40, idadeMax: 49, tipo: 'dobras', pop: 'geral', func: Eq.calcularFemDurnin1974_40a49anos },
  { id: 'calcularFemDurnin1974_50a58anos', nome: 'Durnin 4skf - Variação F (50+ anos Alt)', sexo: 'F', idadeMin: 50, idadeMax: 80, tipo: 'dobras', pop: 'idoso', func: Eq.calcularFemDurnin1974_50a58anos },
  { id: 'calcularFemDurnin1974_1skf', nome: 'Durnin  et al. 1974 1skf', sexo: 'F', idadeMin: 16, idadeMax: 68, tipo: 'dobras', pop: 'geral', func: Eq.calcularFemDurnin1974_1skf },
  { id: 'calcularFemDurnin1974_2skf', nome: 'Durnin  et al. 1974 2skf', sexo: 'F', idadeMin: 16, idadeMax: 68, tipo: 'dobras', pop: 'geral', func: Eq.calcularFemDurnin1974_2skf },
  { id: 'calcularFemNagamineSuzuki1964_2skf', nome: 'Nagamine & Suzuki, 1964 2skf', sexo: 'F', idadeMin: 18, idadeMax: 23, tipo: 'dobras', pop: 'asiatica', func: Eq.calcularFemNagamineSuzuki1964_2skf },
  { id: 'calcularFemDeurenberg1990_PrePuberes', nome: 'Deurenberg et al. 1990 pré-puberes', sexo: 'F', idadeMin: 8, idadeMax: 12, tipo: 'dobras', pop: 'crianca', func: Eq.calcularFemDeurenberg1990_PrePuberes },
  { id: 'calcularFemDeurenberg1990_Puberes', nome: 'Deurenberg et al. 1990 púberes', sexo: 'F', idadeMin: 12, idadeMax: 15, tipo: 'dobras', pop: 'crianca', func: Eq.calcularFemDeurenberg1990_Puberes },
  { id: 'calcularFemDeurenberg1990_PosPuberes', nome: 'Deurenberg et al. 1990 pós-puberes', sexo: 'F', idadeMin: 15, idadeMax: 18, tipo: 'dobras', pop: 'crianca', func: Eq.calcularFemDeurenberg1990_PosPuberes },
  { id: 'calcularFemOrtizHernandez2016', nome: 'Ortiz-Hernández et al. 2016', sexo: 'F', idadeMin: 5, idadeMax: 19, tipo: 'mista', pop: 'crianca', func: Eq.calcularFemOrtizHernandez2016 },

  // --- MASCULINAS ---
  { id: 'calcularMascMitchell2020_7skd', nome: 'Mitchell et al. (2020) - 7skf ISAK', sexo: 'M', idadeMin: 15, idadeMax: 28, tipo: 'dobras', pop: 'atleta', func: Eq.calcularMascMitchell2020_7skd },
  { id: 'calcularMascWoolcottBergman2018', nome: 'Woolcott & Bergman (2018) - RFM', sexo: 'M', idadeMin: 20, idadeMax: 69, tipo: 'perimetros', pop: 'obeso', func: Eq.calcularMascWoolcottBergman2018 },
  { id: 'calcularMascGuedes1985_3skd', nome: 'Guedes (1985) - 3skf', sexo: 'M', idadeMin: 17, idadeMax: 27, tipo: 'dobras', pop: 'universitaria', func: Eq.calcularMascGuedes1985_3skd },
  { id: 'calcularMascDeurenberg1991_IMC', nome: 'Deurenberg et al. (1991) - Por IMC', sexo: 'M', idadeMin: 18, idadeMax: 80, tipo: 'imc', pop: 'geral', func: Eq.calcularMascDeurenberg1991_IMC },
  { id: 'calcularMascWeltman1987', nome: 'Weltman et al. (1987) - Por Perímetros', sexo: 'M', idadeMin: 24, idadeMax: 68, tipo: 'perimetros', pop: 'obeso', func: Eq.calcularMascWeltman1987 },
  { id: 'calcularMascPetroski1995_4skd', nome: 'Petroski (1995) - 4skf', sexo: 'M', idadeMin: 18, idadeMax: 61, tipo: 'dobras', pop: 'brasileira', func: Eq.calcularMascPetroski1995_4skd },
  { id: 'calcularMascStewartHannan_2skd', nome: 'Stewart & Hannan (2000) - 2skf', sexo: 'M', idadeMin: 18, idadeMax: 45, tipo: 'dobras', pop: 'atleta', func: Eq.calcularMascStewartHannan_2skd },
  { id: 'calcularMascFaulkner1968_4skd', nome: 'Faulkner (1968) - 4skf', sexo: 'M', idadeMin: 17, idadeMax: 35, tipo: 'dobras', pop: 'geral', func: Eq.calcularMascFaulkner1968_4skd },
  { id: 'calcularMascReilly2009_4skd', nome: 'Reilly et al. (2009) - 4skf ISAK', sexo: 'M', idadeMin: 18, idadeMax: 35, tipo: 'dobras', pop: 'atleta', func: Eq.calcularMascReilly2009_4skd },
  { id: 'calcularMascEvans2005_3skd_White', nome: 'Evans et al. (2005) - 3skf (Brancos)', sexo: 'M', idadeMin: 18, idadeMax: 26, tipo: 'dobras', pop: 'atleta', func: Eq.calcularMascEvans2005_3skd_White },
  { id: 'calcularMascEvans2005_3skd_Black', nome: 'Evans et al. (2005) - 3skf (Negros)', sexo: 'M', idadeMin: 18, idadeMax: 26, tipo: 'dobras', pop: 'atleta', func: Eq.calcularMascEvans2005_3skd_Black },
  { id: 'calcularMascKatchMcArdle1973_3skd', nome: 'Katch & McArdle (1973) - 3skf', sexo: 'M', idadeMin: 18, idadeMax: 30, tipo: 'dobras', pop: 'universitaria', func: Eq.calcularMascKatchMcArdle1973_3skd },
  { id: 'calcularMascWithers1987_7skd', nome: 'Withers et al. (1987) - 7skf', sexo: 'M', idadeMin: 15, idadeMax: 39, tipo: 'dobras', pop: 'atleta', func: Eq.calcularMascWithers1987_7skd },
  { id: 'calcularMascSlaughter1988_2skd', nome: 'Slaughter et al. (1988) - 2skf', sexo: 'M', idadeMin: 8, idadeMax: 17, tipo: 'dobras', pop: 'crianca', func: Eq.calcularMascSlaughter1988_2skd },
  { id: 'calcularMascYuhasz1974_6skd', nome: 'Yuhasz (1974) - 6skf', sexo: 'M', idadeMin: 18, idadeMax: 40, tipo: 'dobras', pop: 'atleta', func: Eq.calcularMascYuhasz1974_6skd },
  { id: 'calcularMascWilmoreBehnke1969_2skd', nome: 'Wilmore & Behnke (1969) - 2skf', sexo: 'M', idadeMin: 17, idadeMax: 37, tipo: 'dobras', pop: 'geral', func: Eq.calcularMascWilmoreBehnke1969_2skd },
  { id: 'calcularMascBoileau1985_2skd', nome: 'Boileau et al. (1985) - 2skf', sexo: 'M', idadeMin: 8, idadeMax: 17, tipo: 'dobras', pop: 'crianca', func: Eq.calcularMascBoileau1985_2skd },
  { id: 'calcularMascDeurenberg1990_4skd_PrePuberes', nome: 'Deurenberg et al. (1990) - Pré-Púberes', sexo: 'M', idadeMin: 8, idadeMax: 12, tipo: 'dobras', pop: 'crianca', func: Eq.calcularMascDeurenberg1990_4skd_PrePuberes },
  { id: 'calcularMascDeurenberg1990_4skd_Puberes', nome: 'Deurenberg et al. (1990) - Púberes', sexo: 'M', idadeMin: 12, idadeMax: 15, tipo: 'dobras', pop: 'crianca', func: Eq.calcularMascDeurenberg1990_4skd_Puberes },
  { id: 'calcularMascDeurenberg1990_4skd_PosPuberes', nome: 'Deurenberg et al. (1990) - Pós-Púberes', sexo: 'M', idadeMin: 15, idadeMax: 18, tipo: 'dobras', pop: 'crianca', func: Eq.calcularMascDeurenberg1990_4skd_PosPuberes },
  { id: 'calcularMascEston2005_2skd', nome: 'Eston et al. (2005) - 2skd ISAK', sexo: 'M', idadeMin: 18, idadeMax: 36, tipo: 'dobras', pop: 'geral', func: Eq.calcularMascEston2005_2skd },
  { id: 'calcularMascEston2005_6skd', nome: 'Eston et al. (2005) - 6skd ISAK', sexo: 'M', idadeMin: 18, idadeMax: 36, tipo: 'dobras', pop: 'geral', func: Eq.calcularMascEston2005_6skd },
  { id: 'calcularMascDurnin1974_17a72anos', nome: 'Durnin et al. (1974) - 4skf (17 a 72 anos)', sexo: 'M', idadeMin: 17, idadeMax: 72, tipo: 'dobras', pop: 'geral', func: Eq.calcularMascDurnin1974_17a72anos },
  { id: 'calcularMascDurnin1974_17a19anos', nome: 'Durnin et al. (1974) - 4skf (17 a 19 anos)', sexo: 'M', idadeMin: 17, idadeMax: 19, tipo: 'dobras', pop: 'geral', func: Eq.calcularMascDurnin1974_17a19anos },
  { id: 'calcularMascDurnin1974_20a29anos', nome: 'Durnin et al. (1974) - 4skf (20 a 29 anos)', sexo: 'M', idadeMin: 20, idadeMax: 29, tipo: 'dobras', pop: 'geral', func: Eq.calcularMascDurnin1974_20a29anos },
  { id: 'calcularMascDurnin1974_30a39anos', nome: 'Durnin et al. (1974) - 4skf (30 a 39 anos)', sexo: 'M', idadeMin: 30, idadeMax: 39, tipo: 'dobras', pop: 'geral', func: Eq.calcularMascDurnin1974_30a39anos },
  { id: 'calcularMascDurnin1974_40a49anos', nome: 'Durnin et al. (1974) - 4skf (40 a 49 anos)', sexo: 'M', idadeMin: 40, idadeMax: 49, tipo: 'dobras', pop: 'geral', func: Eq.calcularMascDurnin1974_40a49anos },
  { id: 'calcularMascDurnin1974_50a72anos', nome: 'Durnin et al. (1974) - 4skf (50 a 72 anos)', sexo: 'M', idadeMin: 50, idadeMax: 80, tipo: 'dobras', pop: 'idoso', func: Eq.calcularMascDurnin1974_50a72anos },
  { id: 'calcularMascDurnin1974_1skd', nome: 'Durnin et al. (1974) - 1skf (Só Tríceps)', sexo: 'M', idadeMin: 17, idadeMax: 72, tipo: 'dobras', pop: 'geral', func: Eq.calcularMascDurnin1974_1skd },
  { id: 'calcularMascDurninRahaman1967_4skd', nome: 'Durnin & Rahaman (1967) - 4skf (< 17 anos)', sexo: 'M', idadeMin: 10, idadeMax: 16, tipo: 'dobras', pop: 'crianca', func: Eq.calcularMascDurninRahaman1967_4skd },
  { id: 'calcularMascForsythSinning1973_2skd', nome: 'Forsyth & Sinning (1973) - 2skf', sexo: 'M', idadeMin: 19, idadeMax: 22, tipo: 'dobras', pop: 'atleta', func: Eq.calcularMascForsythSinning1973_2skd },
  { id: 'calcularMascNagamineSuzuki1964_2skd', nome: 'Nagamine & Suzuki (1964) - 2skd', sexo: 'M', idadeMin: 18, idadeMax: 27, tipo: 'dobras', pop: 'asiatica', func: Eq.calcularMascNagamineSuzuki1964_2skd },
  { id: 'calcularMascSloan1967_2skd', nome: 'Sloan (1967) - 2skd', sexo: 'M', idadeMin: 18, idadeMax: 26, tipo: 'dobras', pop: 'universitaria', func: Eq.calcularMascSloan1967_2skd },
  { id: 'calcularMascHortobagyi1992', nome: 'Hortobagyi et al. (1992) - Massa/Estatura', sexo: 'M', idadeMin: 18, idadeMax: 30, tipo: 'mista', pop: 'atleta', func: Eq.calcularMascHortobagyi1992 },
  { id: 'calcularMascOrtizHernandez2016', nome: 'Ortiz-Hernández et al. (2016) - Mista', sexo: 'M', idadeMin: 5, idadeMax: 19, tipo: 'mista', pop: 'crianca', func: Eq.calcularMascOrtizHernandez2016 }
]

export function recomendarEquacaoIdeal(medidas = {}, paciente = {}) {
  if (!medidas || !paciente) {
    return {
      equacoesSugeridas: [],
      travaKerr: { massaAdiposaKg: 0, pctAdiposo: 0 },
      indicadoresCruzados: {}
    }
  }

  const sexo = paciente.sexo || 'M'
  const etnia = (paciente.etnia || '').toLowerCase()
  const esporte = paciente.pratica_esporte === true || paciente.pratica_esporte === 'true'
  const modalidade = (paciente.modalidade_esportiva || '').toLowerCase()

  // 1. IDADE SEGURA
  let idade = Number(paciente.idade || paciente.idade_anos || medidas.idade_anos) || 0
  if (!idade && (paciente.data_nascimento || paciente.data_nasc)) {
    const dataNascStr = paciente.data_nascimento || paciente.data_nasc
    const birthDate = new Date(dataNascStr + 'T12:00:00')
    const evalDate = new Date(medidas.data_avaliacao || Date.now())
    idade = evalDate.getFullYear() - birthDate.getFullYear()
    const m = evalDate.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && evalDate.getDate() - birthDate.getDate())) idade--
  }
  if (!idade || idade <= 0) idade = 25;

  // 2. EXTRAÇÃO DE MEDIDAS
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

  // 3. Σ 6 DOBRAS & REFERÊNCIA NORMATIVA
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

  // 4. CÁLCULO DE MUSCULARIDADE & FALSO SOBREPESO
  const parte1 = 0.6 * alturaCm * Math.pow(dUmero + dFemur + dRadio + dMaleolar, 2) * 0.0001
  const tCoxa = cCoxa - (cx * 0.3141)
  const tPant = cPant - (pa * 0.3141)
  const parte2 = (alturaCm * (0.0553 * Math.pow(tCoxa, 2) + 0.0987 * Math.pow(cAntebraco, 2) + 0.0331 * Math.pow(tPant, 2)) - 2445) * 0.001
  const imoKerr = (parte1 > 0 && parte2 > 0) ? (parte2 / parte1) : 0

  const bracoCorr = pBraco - (tr * 0.3141)
  const coxaCorr = cCoxa - (cx * 0.3141)
  const pantCorr = cPant - (pa * 0.3141)

  let massaMuscularLee = 0
  if (alturaM > 0 && pBraco > 0 && cCoxa > 0 && cPant > 0) {
    const sexoNum = sexo === 'M' ? 1 : 0
    let racaNum = 0
    if (etnia.includes('afro') || etnia.includes('negra')) racaNum = 1.1
    if (etnia.includes('asiat')) racaNum = -2
    massaMuscularLee = (alturaM * ((0.00744 * Math.pow(bracoCorr, 2)) + (0.00088 * Math.pow(coxaCorr, 2)) + (0.00441 * Math.pow(pantCorr, 2)))) + (2.4 * sexoNum) - (0.048 * idade) + racaNum + 7.8
  }

  let massaOsseaRocha = 0
  if (alturaM > 0 && dUmero > 0 && dFemur > 0) {
    massaOsseaRocha = 3.02 * Math.pow(Math.pow(alturaM, 2) * (dUmero / 100) * (dFemur / 100) * 400, 0.712)
  }
  const imoLeeRocha = (massaMuscularLee > 0 && massaOsseaRocha > 0) ? (massaMuscularLee / massaOsseaRocha) : 0
  const pctMuscularLee = peso > 0 ? (massaMuscularLee / peso) * 100 : 0

  let mesoVal = 0
  if (alturaCm > 0) {
    mesoVal = (0.858 * (dUmero || 6.5)) + (0.601 * (dFemur || 9.5)) + (0.188 * bracoCorr) + (0.161 * pantCorr) - (0.131 * alturaCm) + 4.5
  }

  const ehHipertrofiado = (sexo === 'M' && (imoKerr >= 4.6 || imoLeeRocha >= 3.0 || pctMuscularLee >= 46.8 || mesoVal >= 5.5)) ||
                         (sexo === 'F' && (imoKerr >= 3.7 || imoLeeRocha >= 2.6 || pctMuscularLee >= 40.8 || mesoVal >= 4.5))

  const imcVal = alturaM > 0 ? peso / (alturaM * alturaM) : 0
  const classImc = classificarImc(imcVal)?.classificacao || '-'
  const ehFalsoSobrepeso = imcVal >= 25.0 && ehHipertrofiado

  // 5. TRAVA DE KERR (1991)
  let massaAdiposaKerr = 0
  if (soma6 > 0 && alturaCm > 0) {
    const zAdiposo = ((soma6 * (170.18 / alturaCm)) - 116.41) / 34.79
    massaAdiposaKerr = Math.max(0, ((zAdiposo * 5.85) + 25.6) * Math.pow(alturaCm / 170.18, 3))
  }
  const pctAdiposoKerr = peso > 0 ? Number(((massaAdiposaKerr / peso) * 100).toFixed(2)) : 0

  // ============================================================
  // 6. SISTEMA ESPECIALISTA DE PONTUAÇÃO DAS 60+ EQUAÇÕES
  // ============================================================
  const listaCandidatas = sexo === 'F' ? METADADOS_EQUACOES.filter(e => e.sexo === 'F') : METADADOS_EQUACOES.filter(e => e.sexo === 'M')

  let equacoesPontuadas = listaCandidatas.map(eq => {
    let score = 50 // Base
    let razoes = []

    // A. ADEQUAÇÃO DE IDADE
    if (idade >= eq.idadeMin && idade <= eq.idadeMax) {
      score += 25
      razoes.push(`Faixa etária compatível com a amostra original (${eq.idadeMin}-${eq.idadeMax} anos).`)
    } else {
      score -= 30
      razoes.push(`Fora da faixa etária original da equação (${eq.idadeMin}-${eq.idadeMax} anos).`)
    }

    // B. PERFIL CLÍNICO / ESPORTIVO
    if (idade < 18 && eq.pop === 'crianca') {
      score += 30
      razoes.push('Específica para o crescimento e maturação infantojuvenil.')
    }
    else if (idade >= 60 && eq.pop === 'idoso') {
      score += 30
      razoes.push('Calibrada para alterações geriátricas da densidade tecidual.')
    }
    else if (ehFalsoSobrepeso && eq.tipo === 'dobras') {
      score += 35
      razoes.push('Excelente controle para falso sobrepeso (isola peso bruto do tecido muscular).')
    }
    else if (esporte && eq.pop === 'atleta') {
      score += 30
      razoes.push('Validada em populações atléticas de alto rendimento.')
    }
    else if (!esporte && eq.pop === 'geral') {
      score += 20
      razoes.push('Indicada para a população adulta sedentária ou fisicamente ativa padrão.')
    }

    // C. TESTE DE PLAUSIBILIDADE (Simulação rápida do %GC para cruzar com Kerr e Morrow)
    try {
      const resSimulado = eq.func(medidas, paciente)
      const pgcSimulado = typeof resSimulado === 'object' ? resSimulado.valor : resSimulado
      
      if (pgcSimulado > 0) {
        const diffKerr = Math.abs(pgcSimulado - pctAdiposoKerr)
        if (diffKerr <= 3.0) {
          score += 30
          razoes.push(`Convergência anatômica perfeita com o modelo de Kerr (1991) [Diferença de apenas ${diffKerr.toFixed(1)}%].`)
        } else if (diffKerr <= 7.0) {
          score += 15
          razoes.push(`Boa compatibilidade biológica com a massa adiposa de Kerr.`)
        } else {
          score -= 20
          razoes.push(`Divergência expressiva em relação ao teto anatômico de Kerr (${diffKerr.toFixed(1)}% de desvio).`)
        }
      }
    } catch (err) {
      score -= 10
    }

    return {
      nome: eq.nome,
      score,
      justificativa: razoes.join(' ')
    }
  })

  // Ordena da maior pontuação para a menor
  equacoesPontuadas.sort((a, b) => b.score - a.score)

  // Seleciona as 2 melhores opções para apresentar ao Avaliador
  const melhoresOpcoes = equacoesPontuadas.slice(0, 2)

  return {
    nomeEquacaoRecomendada: melhoresOpcoes[0]?.nome || '',
    equacoesSugeridas: melhoresOpcoes,
    motivo: melhoresOpcoes[0]?.justificativa || '',
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