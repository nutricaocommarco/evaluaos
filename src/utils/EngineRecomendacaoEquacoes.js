/**
 * EVALUAOS - Sistema Especialista em Cineantropometria Avançada (V2.4)
 * Hierarquia Exata: Sexo -> Endomorfia -> Morrow et al. -> Argoref / ISAK -> Kerr (Kg Normalizado) -> Idade -> Nacionalidade -> Bônus
 */

import * as Eq from './equacoes'
import { 
  classificarArgoref, 
  classificarPercentilItaliano, 
  classificarImc,
  classificarMorrow 
} from './escalasNormativas'

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
  { id: 'calcularMascForsythSinning1973_2skd', nome: 'Forsyth & Sinning (1973) - 2skd', sexo: 'M', idadeMin: 19, idadeMax: 22, tipo: 'dobras', pop: 'atleta', func: Eq.calcularMascForsythSinning1973_2skd },
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

  // 1. DADOS DEMOGRÁFICOS DO PACIENTE
  const sexo = paciente.sexo || 'M'
  const etnia = (paciente.etnia || '').toLowerCase()
  const nacionalidade = (paciente.nacionalidade || '').toLowerCase()
  const esporte = paciente.pratica_esporte === true || paciente.pratica_esporte === 'true'
  const modalidade = (paciente.modalidade_esportiva || '').toLowerCase()

  let idade = Number(paciente.idade || paciente.idade_anos || medidas.idade_anos) || 0
  if (!idade && (paciente.data_nascimento || paciente.data_nasc)) {
    const dataNascStr = paciente.data_nascimento || paciente.data_nasc
    const birthDate = new Date(dataNascStr + 'T12:00:00')
    const evalDate = new Date(medidas.data_avaliacao || Date.now())
    idade = evalDate.getFullYear() - birthDate.getFullYear()
    const m = evalDate.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && evalDate.getDate() < birthDate.getDate())) idade--
  }
  if (!idade || idade <= 0) idade = 25;

  // 2. EXTRAÇÃO DE MEDIDAS
  const peso = Number(medidas.peso_paciente || medidas.massa_kg || medidas.peso_kg) || 0
  const alturaCm = Number(medidas.altura_paciente || medidas.estatura_cm || medidas.altura_cm) || 0
  const alturaM = alturaCm / 100

  const tr = Number(medidas.dobra_cutanea_triceps) || 0
  const sub = Number(medidas.dobra_cutanea_subescapular) || 0
  const bi = Number(medidas.dobra_cutanea_biceps) || 0
  const si = Number(medidas.dobra_cutanea_crista_iliaca || medidas.dobra_cutanea_supra_iliaca) || 0
  const se = Number(medidas.dobra_cutanea_supraespinhal) || 0
  const ab = Number(medidas.dobra_cutanea_abdominal) || 0
  const cx = Number(medidas.dobra_cutanea_coxa_media) || 0
  const pa = Number(medidas.dobra_cutanea_panturrilha) || 0

  const soma6 = tr + sub + si + se + ab + cx
  const soma8 = soma6 + bi + pa

  // =================================================================
  // 🔬 A. CÁLCULO EXATO DOS 4 COMPONENTES (IDÊNTICO AO LAUDO)
  // =================================================================
  
  // 1. Tecido Adiposo (Kerr, 1988)
  let massaAdiposaKerr = 0;
  if (soma6 > 0 && alturaCm > 0) {
    const zAdiposo = ((soma6 * (170.18 / alturaCm)) - 116.41) / 34.79;
    massaAdiposaKerr = Math.max(0, ((zAdiposo * 5.85) + 25.6) * Math.pow(alturaCm / 170.18, 3));
  }

  // 2. Tecido Muscular (Lee, 2000)
  const dUmero = Number(medidas.diametro_umero) || 0
  const dFemur = Number(medidas.diametro_femur) || 0

  const pBraco = Number(medidas.perimetro_braco_relaxado) || 0
  const cCoxa = Number(medidas.perimetro_coxa_media) || 0
  const cPant = Number(medidas.perimetro_panturrilha) || 0

  const bracoCorr = pBraco > 0 ? pBraco - (tr * 0.314) : 0;
  const coxaCorr = cCoxa > 0 ? cCoxa - (cx * 0.314) : 0;
  const pantCorr = cPant > 0 ? cPant - (pa * 0.314) : 0;

  let massaMuscularLee = 0
  if (alturaM > 0 && pBraco > 0 && cCoxa > 0 && cPant > 0) {
    const sexoNum = sexo === 'M' ? 1 : 0
    let racaNum = 0
    if (etnia.includes('afro') || etnia.includes('negra')) racaNum = 1.1
    if (etnia.includes('asiat')) racaNum = -2
    massaMuscularLee = (alturaM * ((0.00744 * Math.pow(bracoCorr, 2)) + (0.00088 * Math.pow(coxaCorr, 2)) + (0.00441 * Math.pow(pantCorr, 2)))) + (2.4 * sexoNum) - (0.048 * idade) + racaNum + 7.8
  }

  // 3. Tecido Ósseo (Rocha, 1975)
  let massaOsseaRocha = 0
  if (alturaM > 0 && dUmero > 0 && dFemur > 0) {
    massaOsseaRocha = 3.02 * Math.pow(Math.pow(alturaM, 2) * (dUmero / 100) * (dFemur / 100) * 400, 0.712)
  }

  // 4. Massa Residual (Würch, 1973)
  const pctResidualWurch = sexo === 'M' ? 0.24 : 0.21
  let massaResidual4C = peso > 0 ? peso * pctResidualWurch : 0

  // =================================================================
  // ⚖️ NORMALIZAÇÃO PRÓ-RATA DOS 4 COMPONENTES
  // Corrige o "Efeito Frankenstein" igual ao ResultadoAvaliacao.jsx
  // =================================================================
  const somaBruta4C = massaAdiposaKerr + massaMuscularLee + massaOsseaRocha + massaResidual4C;
  if (somaBruta4C > 0 && peso > 0) {
    const fatorAjuste = peso / somaBruta4C;
    massaAdiposaKerr *= fatorAjuste;
    massaMuscularLee *= fatorAjuste;
    massaOsseaRocha *= fatorAjuste;
    massaResidual4C *= fatorAjuste;
  }

  // Após ajuste, tiramos o %Adiposo
  const pctAdiposoKerr = peso > 0 ? Number(((massaAdiposaKerr / peso) * 100).toFixed(2)) : 0

  // E. Índices IMO e IAM (Baseados nas massas já ajustadas)
  const imoLeeRocha = (massaMuscularLee > 0 && massaOsseaRocha > 0) ? (massaMuscularLee / massaOsseaRocha) : 0
  const iamVal = (massaMuscularLee > 0 && massaAdiposaKerr > 0) ? (massaAdiposaKerr / massaMuscularLee) : 0

  // F. Somatotipo (Endomorfia / Mesomorfia)
  const somaDobrasEndo = (tr + sub + se) * (170.18 / (alturaCm || 1))
  let endomorfia = 0
  if (alturaCm > 0) {
    endomorfia = -0.7182 + (0.1451 * somaDobrasEndo) - (0.00068 * Math.pow(somaDobrasEndo, 2)) + (0.0000014 * Math.pow(somaDobrasEndo, 3))
  }
  endomorfia = Math.max(0.1, Number(endomorfia.toFixed(1)))

  let mesomorfia = 0
  if (alturaCm > 0) {
    mesomorfia = (0.858 * dUmero) + (0.601 * dFemur) + (0.188 * bracoCorr) + (0.161 * pantCorr) - (0.131 * alturaCm) + 4.5
  }

  const imcVal = alturaM > 0 ? peso / (alturaM * alturaM) : 0
  const classImc = classificarImc(imcVal)?.classificacao || '-'
  
  // Classificação Morrow BASE é extraída da estimativa física de Kerr ajustada
  const statusMorrowObj = classificarMorrow(pctAdiposoKerr, sexo, idade)
  const statusMorrow = typeof statusMorrowObj === 'object' ? statusMorrowObj.classificacao : statusMorrowObj

  let referenciaDobrasUsada = '-'
  let statusDobrasBrutas = '-'
  if (soma6 > 0) {
    if (idade >= 20 && idade <= 30) {
      statusDobrasBrutas = classificarArgoref(soma6, sexo).classificacao
      referenciaDobrasUsada = 'ARGOREF (Holway, 2025)'
    } else {
      statusDobrasBrutas = classificarPercentilItaliano(soma6, sexo, idade)
      referenciaDobrasUsada = `Percentil ISAK (Campa et al., 2025 - ${idade} anos)`
    }
  }

  const ehHipertrofiado = (sexo === 'M' && (imoLeeRocha >= 3.0 || mesomorfia >= 5.5)) ||
                         (sexo === 'F' && (imoLeeRocha >= 2.6 || mesomorfia >= 4.5))
  const ehFalsoSobrepeso = imcVal >= 25.0 && ehHipertrofiado

  // ============================================================
  // 5. ENGINE DE RECOMENDAÇÃO (HIERARQUIA ESTRITA SOLICITADA)
  // ============================================================
  const listaCandidatas = sexo === 'F' ? METADADOS_EQUACOES.filter(e => e.sexo === 'F') : METADADOS_EQUACOES.filter(e => e.sexo === 'M')

  let equacoesPontuadas = []

  listaCandidatas.forEach(eq => {
    let score = 1000 // Base alta para pontuação hierárquica
    let razoes = []
    let pgcSimulado = 0

    try {
      const resSimulado = eq.func(medidas, paciente)
      pgcSimulado = typeof resSimulado === 'object' ? resSimulado.valor : resSimulado
    } catch (err) {
      pgcSimulado = 0
    }

    if (pgcSimulado <= 0 || pgcSimulado >= 60) return

    const massaGordaSimuladaKg = (pgcSimulado / 100) * peso

    // 🥇 HIERARQUIA 1: CLASSIFICAÇÃO DA ENDOMORFIA (Somatotipo)
    if (endomorfia >= 6.0) {
      if (eq.pop === 'obeso') {
        score += 200
        razoes.push(`Endomorfia Alta (${endomorfia}): Equação ideal para perfis de alta adiposidade.`)
      } else if (eq.pop === 'geral') {
        score += 50
      } else {
        score -= 100
      }
    } else if (endomorfia <= 3.5) {
      if (eq.pop === 'atleta') {
        score += 200
        razoes.push(`Endomorfia Baixa (${endomorfia}): Equação ideal para perfis atléticos e magros.`)
      } else {
        score -= 50
      }
    } else {
      if (['geral', 'brasileira', 'universitaria'].includes(eq.pop)) {
        score += 100
        razoes.push(`Endomorfia Moderada (${endomorfia}): Recomendada para o perfil populacional padrão.`)
      }
    }

    // 🥈 HIERARQUIA 2: MORROW ET AL. (Adiposidade Molecular)
    const morrowEqObj = classificarMorrow(pgcSimulado, sexo, idade)
    const nomeMorrowEq = typeof morrowEqObj === 'object' ? morrowEqObj.classificacao : morrowEqObj
    
    if (nomeMorrowEq === statusMorrow && statusMorrow !== '-') {
      score += 150
      razoes.push(`Morrow (2003): O resultado (${pgcSimulado.toFixed(1)}%) mantém a classificação real de saúde do paciente ("${statusMorrow}").`)
    }

    // 🥉 HIERARQUIA 3: ARGOREF / ISAK (Adiposidade Subcutânea)
    if (statusDobrasBrutas !== '-') {
      if ((statusDobrasBrutas.includes('Elevado') || statusDobrasBrutas.includes('Acima')) && (eq.pop === 'obeso' || eq.tipo === 'perimetros')) {
        score += 150
        razoes.push(`Argoref/ISAK (${statusDobrasBrutas}): O perfil de dobras espessas prioriza esta equação.`)
      } else if ((statusDobrasBrutas.includes('Baixo') || statusDobrasBrutas.includes('Abaixo')) && eq.pop === 'atleta') {
        score += 150
        razoes.push(`Argoref/ISAK (${statusDobrasBrutas}): O perfil de dobras finas prioriza este modelo atlético.`)
      } else {
        score += 50
      }
    }

    // 🏅 HIERARQUIA 4: TRAVA DE KERR EM KG (O Limite Biológico Corrigido)
    const diffKerr = massaGordaSimuladaKg - massaAdiposaKerr
    if (diffKerr <= 0) {
      score += 200
      razoes.push(`Trava de Kerr: A gordura estimada (${massaGordaSimuladaKg.toFixed(1)} kg) respeita perfeitamente o teto do Tecido Adiposo (${massaAdiposaKerr.toFixed(1)} kg).`)
    } else if (diffKerr > 0 && diffKerr <= 2.0) {
      // Pequena margem de erro estatístico das equações preditivas vs fracionamento anatômico
      score -= 50 
      razoes.push(`Aviso: A gordura excede levemente o tecido adiposo em ${diffKerr.toFixed(1)} kg (margem de erro da equação).`)
    } else {
      score -= 300 // Penalidade severa: quebrou o princípio biológico
      razoes.push(`Erro Biológico: A equação superestima a Massa Gorda (${massaGordaSimuladaKg.toFixed(1)} kg) acima do Tecido Adiposo total palpável (${massaAdiposaKerr.toFixed(1)} kg).`)
    }

    // 👤 HIERARQUIA 5: IDADE E NACIONALIDADE
    if (idade >= eq.idadeMin && idade <= eq.idadeMax) {
      score += 100
      razoes.push(`Idade compatível (${eq.idadeMin}-${eq.idadeMax} anos).`)
    } else {
      score -= 100
    }

    if (nacionalidade.includes('brasil') && eq.pop === 'brasileira') {
      score += 80
      razoes.push('Amostra populacional validada no Brasil.')
    } else if (etnia.includes('asiat') && eq.pop === 'asiatica') {
      score += 80
      razoes.push('Calibrada para asiáticas.')
    }

    // ⚡ BÔNUS DE AJUSTE FINO (Desempate)
    if (esporte && eq.pop === 'atleta') {
      score += 30
      razoes.push('Bônus: Adequada ao perfil de prática esportiva.')
    }
    if (soma6 > 130 && eq.tipo === 'perimetros') {
      score += 40
      razoes.push('Bônus: Uso de perímetros evita a compressão do adipômetro em dobras extremas.')
    }
    if (ehFalsoSobrepeso && eq.tipo === 'dobras') {
      score += 30
      razoes.push('Bônus: Dobras isolam o falso sobrepeso gerado pelo alto IMC muscular.')
    }

    equacoesPontuadas.push({
      nome: eq.nome,
      score,
      justificativa: razoes.join(' ')
    })
  })

  // Ordena por pontuação decrescente e extrai as 3 melhores opções válidas
  equacoesPontuadas.sort((a, b) => b.score - a.score)
  const melhoresOpcoes = equacoesPontuadas.slice(0, 3)

  return {
    nomeEquacaoRecomendada: melhoresOpcoes[0]?.nome || '',
    equacoesSugeridas: melhoresOpcoes,
    motivo: melhoresOpcoes[0]?.justificativa || '',
    travaKerr: {
      massaAdiposaKg: Number(massaAdiposaKerr.toFixed(2)),
      pctAdiposo: pctAdiposoKerr
    },
    indicadoresCruzados: {
      peso,
      alturaCm,
      imc: Number(imcVal.toFixed(1)),
      classificacaoImc: classImc,
      massaAdiposaKg: Number(massaAdiposaKerr.toFixed(2)),
      massaMuscularLee: Number(massaMuscularLee.toFixed(2)),
      massaOsseaRocha: Number(massaOsseaRocha.toFixed(2)),
      massaResidual4C: Number(massaResidual4C.toFixed(2)),
      soma6,
      soma8,
      endomorfia,
      mesomorfia: Number(mesomorfia.toFixed(1)),
      statusMorrow,
      iamVal: Number(iamVal.toFixed(2)),
      imoVal: Number(imoLeeRocha.toFixed(3)),
      referenciaUsada: referenciaDobrasUsada,
      statusDobras: statusDobrasBrutas
    }
  }
}