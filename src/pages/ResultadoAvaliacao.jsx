import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { obterUrlEmbedYouTube } from '../utils/youtube'
import { useTheme } from '../contexts/ThemeContext'
import BotaoExportarPDF from '../components/BotaoExportarPDF'
import NavegacaoPortalPaciente from '../components/NavegacaoPortalPaciente'
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { 
  classificarImc, 
  classificarRce, 
  classificarRcq, 
  classificarArgoref, 
  classificarPercentilItaliano,
  classificarMorrow,
  classificarApVat,
  classificarSomatotipoDetalhado,
  calcularIndiceCormico,
  calcularIndiceManouvrier,
  calcularEnvergaduraRelativa,
  calcularIndiceConicidade,
  classificarConicidade,
  classificarImo
} from '../utils/escalasNormativas'

const calcularSomatotipo = (medidas) => {
  const triceps = medidas.dobra_cutanea_triceps || 0;
  const subescapular = medidas.dobra_cutanea_subescapular || 0;
  const supraespinhal = medidas.dobra_cutanea_supraespinhal || 0;
  const panturrilha_dobra = medidas.dobra_cutanea_panturrilha || 0;

  const altura = medidas.altura_paciente || 0;
  const diam_umero = medidas.diametro_umero || 0;
  const diam_femur = medidas.diametro_femur || 0;
  const perim_braco = medidas.perimetro_braco_contraido || 0;
  const perim_panturrilha = medidas.perimetro_panturrilha || 0;
  const peso = medidas.peso_paciente || 0;

  const somaDobrasEndo = (triceps + subescapular + supraespinhal) * (170.18 / (altura || 1));
  let endomorfia = 0;
  if (altura > 0) {
    endomorfia = -0.7182 + (0.1451 * somaDobrasEndo) - (0.00068 * Math.pow(somaDobrasEndo, 2)) + (0.0000014 * Math.pow(somaDobrasEndo, 3));
  }

  const braco_corrigido = perim_braco - (triceps / 10);
  const panturrilha_corrigida = perim_panturrilha - (panturrilha_dobra / 10);
  let mesomorfia = 0;
  if (altura > 0) {
    mesomorfia = (0.858 * diam_umero) + (0.601 * diam_femur) + (0.188 * braco_corrigido) + (0.161 * panturrilha_corrigida) - (0.131 * altura) + 4.5;
  }

  let ectomorfia = 0;
  if (peso > 0 && altura > 0) {
    const cap = altura / Math.pow(peso, 0.3333);
    if (cap >= 40.75) {
      ectomorfia = 0.732 * cap - 28.58;
    } else if (cap > 38.25 && cap < 40.75) {
      ectomorfia = 0.463 * cap - 17.63;
    } else {
      ectomorfia = 0.1;
    }
  }

  const eixoX = ectomorfia - endomorfia;
  const eixoY = (2 * mesomorfia) - (endomorfia + ectomorfia);

  return {
    somatotipo_endomorfia: Math.max(0.1, Number(endomorfia.toFixed(1))),
    somatotipo_mesomorfia: Math.max(0.1, Number(mesomorfia.toFixed(1))),
    somatotipo_ectomorfia: Math.max(0.1, Number(ectomorfia.toFixed(1))),
    somatocarta_eixo_x: Number(eixoX.toFixed(1)),
    somatocarta_eixo_y: Number(eixoY.toFixed(1))
  }
}

// SIMULADOR LOCAL DA TRAJETÓRIA BWP PARA O LAUDO
const getBMRLocal = (weight, height, age, isMale, bf, activeFormula) => {
  let lbm = weight;
  if (bf && bf > 0) lbm = weight * (1 - (bf / 100));

  switch (activeFormula) {
    case 'mifflin': return isMale ? (10 * weight) + (6.25 * height) - (5 * age) + 5 : (10 * weight) + (6.25 * height) - (5 * age) - 161;
    case 'harris': return isMale ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age) : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    case 'cunningham': return 500 + (22 * lbm);
    case 'tinsley': return (bf && bf > 0) ? (25.9 * lbm + 284) : (24.8 * weight + 10);
    default: return isMale ? (10 * weight) + (6.25 * height) - (5 * age) + 5 : (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
};

const simulateWeightTrajectory = (intake, days, initialWeight, height, age, isMale, bf, pal, formula, baselineTDEE) => {
  let currentWeight = initialWeight;
  // %GC é opcional — só rastreamos massa gorda quando o dado existe de
  // verdade (ver mesma correção em BodyWP.jsx).
  const temBF = !!(bf && bf > 0);
  let initialFM = temBF ? initialWeight * (bf / 100) : 0;
  let currentFM = initialFM;
  let data = [];
  
  const metabolicAdaptation = intake < baselineTDEE ? (baselineTDEE - intake) * 0.14 : 0; 
  const energyDensity = 7300; 
  
  const deficit = baselineTDEE - intake;
  let maxGlycogenWaterLoss = 0;
  
  if (deficit > 0) {
    maxGlycogenWaterLoss = Math.min(2.5, 1.25 * (deficit / 500));
  } else if (deficit < 0) {
    maxGlycogenWaterLoss = -Math.min(1.5, 0.8 * (Math.abs(deficit) / 500));
  }
  
  for (let i = 0; i <= days; i++) {
    const glycogenWaterLoss = maxGlycogenWaterLoss * (1 - Math.exp(-i / 3.5));
    const displayWeight = Number((currentWeight - glycogenWaterLoss).toFixed(1));
    // Mesma correção de BodyWP.jsx: incerteza assintótica em vez de linear
    // sem limite (senão uma projeção de 365 dias mostraria ±11,4kg de faixa).
    const uncertainty = Number((2.8 * (1 - Math.exp(-i / 45))).toFixed(1));
    const currentBf = temBF && displayWeight > 0 ? (currentFM / displayWeight) * 100 : 0;

    const pesoAlto = Number((displayWeight + uncertainty).toFixed(1));
    const pesoBaixo = Number((Math.max(30, displayWeight - uncertainty)).toFixed(1));

    data.push({
      dia: i,
      pesoEstimado: displayWeight,
      pesoAlto,
      pesoBaixo,
      bfEstimado: temBF ? Number(currentBf.toFixed(1)) : null
    });

    let dailyBMR = getBMRLocal(displayWeight, height, age, isMale, currentBf, formula);
    const theoreticalTDEE = dailyBMR * pal;
    const actualTDEE = theoreticalTDEE - metabolicAdaptation;
    const dailyBalance = actualTDEE - intake;
    const weightChange = dailyBalance / energyDensity;

    currentWeight -= weightChange;

    if (temBF) {
      if (weightChange > 0) currentFM -= (weightChange * 0.75);
      else currentFM -= (weightChange * 0.50);

      if (currentFM < (displayWeight * 0.03)) currentFM = displayWeight * 0.03;
    }
  }

  return data;
};

const CustomTooltipGraficoTrajetoria = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
        <p className="font-bold text-slate-300 border-b border-slate-700 pb-1 flex justify-between gap-4">
          <span>Dia {label}</span>
          <span className="text-primary-400 font-bold">{data.pesoEstimado} kg</span>
        </p>
        <p className="text-slate-300 font-medium flex justify-between gap-4">
          <span>Faixa Esperada:</span>
          <span className="font-bold text-blue-300">[{data.pesoBaixo} kg a {data.pesoAlto} kg]</span>
        </p>
        {data.bfEstimado > 0 && (
          <p className="text-slate-300 font-medium flex justify-between gap-4 pt-1 border-t border-slate-800">
            <span>Gordura Estimada:</span>
            <span className="font-bold text-amber-400">{data.bfEstimado}%</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function ResultadoAvaliacao() {
  const location = useLocation()
  const navigate = useNavigate()
  const { tokenUrl } = useParams()
  const { darkMode, setDarkMode, setCorPrimaria } = useTheme()

  const isPublicView = !!tokenUrl;
  const avaliacaoId = location.state?.avaliacaoId || null

  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState(null)

  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [nomeAvaliador, setNomeAvaliador] = useState('')
  const [logomarcaUrl, setLogomarcaUrl] = useState('')
  const [videoUrlPadrao, setVideoUrlPadrao] = useState('')
  const [tokenPublico, setTokenPublico] = useState('')
  const [configVisibilidade, setConfigVisibilidade] = useState({})
  const [equipamentos, setEquipamentos] = useState(null)
  const [sessaoAtiva, setSessaoAtiva] = useState(false)

  if (!tokenUrl && !avaliacaoId) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Nenhuma avaliação foi selecionada.</h2>
        <p className="text-gray-500 dark:text-slate-400">Selecione uma avaliação na lista para gerar o relatório.</p>
        <button onClick={() => navigate('/pacientes')} className="px-6 py-2 bg-primary-600 text-white rounded-lg">
          Voltar para Pacientes
        </button>
      </div>
    )
  }

  useEffect(() => {
    async function processarERecarregarResultados() {
      setLoading(true)

      const { data: sessaoData } = await supabase.auth.getUser()
      setSessaoAtiva(!!sessaoData?.user)

      let query = supabase.from('avaliacoes').select(`*, pacientes ( * )`);

      if (tokenUrl) {
        query = query.eq('token_publico', tokenUrl);
      } else {
        query = query.eq('id', avaliacaoId);
      }

      const { data: avalDados, error: avalError } = await query.single();

      if (avalError) {
        console.error('Avaliação não encontrada:', avalError)
        setLoading(false)
        return
      }

      setTokenPublico(avalDados.token_publico || '')
      const pac = avalDados.pacientes || {}

      let avalData = null;
      if (pac.id_avaliador) {
        const { data } = await supabase
          .from('avaliadores')
          .select('id, auth_id, empresa, nome_completo, logomarca_url, video_url_padrao')
          .eq('auth_id', pac.id_avaliador)
          .maybeSingle();
        avalData = data;
      }

      if (!avalData) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.email) {
          const { data } = await supabase
            .from('avaliadores')
            .select('id, auth_id, empresa, nome_completo, logomarca_url, video_url_padrao')
            .eq('email', authData.user.email)
            .maybeSingle();
          avalData = data;
        }
      }

      if (avalData) {
        setNomeEmpresa(avalData.empresa || '');
        setNomeAvaliador(avalData.nome_completo || '');
        setLogomarcaUrl(avalData.logomarca_url || '');
        setVideoUrlPadrao(avalData.video_url_padrao || '');

        const idParaEquipamento = avalData.id || avalData.auth_id;
        if (idParaEquipamento) {
          const { data: equipData } = await supabase
            .from('equipamentos')
            .select('*')
            .eq('id_avaliador', idParaEquipamento)
            .maybeSingle();

          if (equipData) {
            setEquipamentos(equipData);
          }
        }

        if (avalData.auth_id) {
          const { data: configData } = await supabase
            .from('configuracoes_avaliador')
            .select('visibilidade_publica, dark_mode, cor_primaria')
            .eq('auth_id', avalData.auth_id)
            .maybeSingle();

          if (isPublicView && configData) {
            setDarkMode(pac.tema_dark_mode != null ? pac.tema_dark_mode : !!configData.dark_mode);
            if (configData.cor_primaria) setCorPrimaria(configData.cor_primaria);
          }

          if (configData?.visibilidade_publica) {
            setConfigVisibilidade(configData.visibilidade_publica);
          }
        }
      }

      const pesoFinal = avalDados.peso_paciente || 0
      const alturaCm = avalDados.altura_paciente || 0
      const alturaM = alturaCm / 100
      const pcGorduraFinal = avalDados.percentual_de_gordura || 0

      const calcImc = alturaM > 0 ? pesoFinal / (alturaM * alturaM) : 0
      const massaGordaCalc = pesoFinal > 0 ? (pcGorduraFinal * pesoFinal) / 100 : 0
      const massaMagraCalc = pesoFinal > 0 ? pesoFinal - massaGordaCalc : 0

      const pBraco = avalDados.perimetro_braco_relaxado || 0
      const pCoxa = avalDados.perimetro_coxa_media || 0
      const pPant = avalDados.perimetro_panturrilha || 0
      const dTri = avalDados.dobra_cutanea_triceps || 0
      const dSub = avalDados.dobra_cutanea_subescapular || 0
      const dSup = avalDados.dobra_cutanea_supraespinhal || 0
      const dAbd = avalDados.dobra_cutanea_abdominal || 0
      const dCoxa = avalDados.dobra_cutanea_coxa_media || 0
      const dPant = avalDados.dobra_cutanea_panturrilha || 0
      const dBic = avalDados.dobra_cutanea_biceps || 0
      const dIli = avalDados.dobra_cutanea_crista_iliaca || 0

      const calcSoma6 = dTri + dSub + dSup + dAbd + dCoxa + dPant
      const calcSoma8 = calcSoma6 + dBic + dIli

      const calcPerimCorrigidoBraco = pBraco > 0 ? pBraco - (dTri * 0.314) : 0;
      const calcPerimCorrigidoCoxa = pCoxa > 0 ? pCoxa - (dCoxa * 0.314) : 0;
      const calcPerimCorrigidoPanturrilha = pPant > 0 ? pPant - (dPant * 0.314) : 0;

      let calcIdade = 25
      if (pac.data_nascimento) {
        const birthDate = new Date(pac.data_nascimento + 'T12:00:00')
        const evalDate = new Date((avalDados.data_avaliacao || '') + 'T12:00:00')
        calcIdade = evalDate.getFullYear() - birthDate.getFullYear()
        const m = evalDate.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && evalDate.getDate() < birthDate.getDate())) calcIdade--
      }

      // 1. Kerr (1988)
      let calcKerr = 0;
      if (calcSoma6 > 0 && alturaCm > 0) {
        const zAdiposo = ((calcSoma6 * (170.18 / alturaCm)) - 116.41) / 34.79;
        calcKerr = Math.max(0, ((zAdiposo * 5.85) + 25.6) * Math.pow(alturaCm / 170.18, 3));
      }

      // 2. Lee (2000)
      let calcMuscular = 0
      if (alturaM > 0 && pBraco > 0 && pCoxa > 0 && pPant > 0) {
        const sexoNum = pac.sexo === 'M' ? 1 : 0
        let racaNum = 0
        if (pac.etnia === 'Afrodescendente') racaNum = 1.1
        if (pac.etnia === 'Asiatico') racaNum = -2
        calcMuscular = (alturaM * ((0.00744 * Math.pow(calcPerimCorrigidoBraco, 2)) + (0.00088 * Math.pow(calcPerimCorrigidoCoxa, 2)) + (0.00441 * Math.pow(calcPerimCorrigidoPanturrilha, 2)))) + (2.4 * sexoNum) - (0.048 * calcIdade) + racaNum + 7.8
      }

      // 3. Rocha (1975)
      let calcRocha = 0;
      const dUmero = Number(avalDados.diametro_umero) || 0;
      const dFemur = Number(avalDados.diametro_femur) || 0;
      if (alturaM > 0 && dUmero > 0 && dFemur > 0) {
        calcRocha = 3.02 * Math.pow(Math.pow(alturaM, 2) * (dUmero / 100) * (dFemur / 100) * 400, 0.712)
      }

      // Massa Muscular - Martin (1990) e Massa Óssea - Martin (1991), usadas só no IMO
      // (o Fracionamento em 4C acima continua em Lee/Rocha, sem mudança de escopo).
      // IMO usa só o método Martin (sem fallback para outra fórmula/escala) para não
      // pular de escala entre avaliações na Evolução quando os dados mudam de perfil.
      // A correção de perímetro (girth - dobra*0.314) parte de uma camada de gordura fina;
      // em dobras muito altas ela subestima a gordura e infla o músculo (validado com paciente
      // real: dobras de coxa/panturrilha bem acima do normal chegaram a estimar quase metade
      // do peso corporal em músculo). O gate é pela dobra em si, não por IMC/peso — um
      // fisiculturista tem perímetro grande mas dobra fina, então continua entrando normalmente;
      // quem tem dobra grossa (a causa real do erro) que fica de fora, mostrando "-" no IMO.
      const pAntebraco = Number(avalDados.perimetro_antibraco) || 0;
      const dentroFaixaSeguraMartin = dCoxa > 0 && dCoxa < 25 && dPant > 0 && dPant < 25;
      let calcMuscularMartin = 0;
      if (dentroFaixaSeguraMartin && alturaCm > 0 && calcPerimCorrigidoCoxa > 0 && pAntebraco > 0 && calcPerimCorrigidoPanturrilha > 0) {
        calcMuscularMartin = ((alturaCm * ((0.0553 * Math.pow(calcPerimCorrigidoCoxa, 2)) + (0.0987 * Math.pow(pAntebraco, 2)) + (0.0331 * Math.pow(calcPerimCorrigidoPanturrilha, 2)))) - 2445) * 0.001;
      }

      const dPunho = Number(avalDados.diametro_punho) || 0;
      const dTornozelo = Number(avalDados.diametro_maleolar) || 0;
      let calcOsseaMartin = 0;
      if (dentroFaixaSeguraMartin && alturaCm > 0 && dUmero > 0 && dFemur > 0 && dPunho > 0 && dTornozelo > 0) {
        calcOsseaMartin = 0.6 * alturaCm * Math.pow(dUmero + dFemur + dPunho + dTornozelo, 2) * 0.0001;
      }

      // 4. Würch (1973)
      const pctResidualWurch = pac.sexo === 'M' ? 0.24 : 0.21
      let calcWurch = pesoFinal > 0 ? pesoFinal * pctResidualWurch : 0

      // AJUSTE PRÓ-RATA (só Ósseo/Residual)
      // Adiposo (Kerr) e Muscular (Lee) usam fórmulas Phantom validadas e ficam fixos.
      // Ósseo (Rocha) e Residual (Würch, % fixo do peso) são estimativas mais incertas
      // (sem medidas de tórax/cintura escapular) — a diferença entre o peso real e
      // Adiposo+Muscular é redistribuída proporcionalmente só entre elas, evitando o
      // "efeito Frankenstein" (soma ≠ peso) sem corromper os dois valores já exatos.
      const massaRestante4C = Math.max(0, pesoFinal - calcKerr - calcMuscular);
      const somaOsseoResidualBruto = calcRocha + calcWurch;
      if (somaOsseoResidualBruto > 0 && massaRestante4C > 0) {
        const fatorAjusteRestante = massaRestante4C / somaOsseoResidualBruto;
        calcRocha *= fatorAjusteRestante;
        calcWurch *= fatorAjusteRestante;
      }

      const pCintura = avalDados.perimetro_cintura || 0
      const pQuadril = avalDados.perimetro_quadril || 0
      const pCoxaMax = avalDados.perimetro_coxa_maxima || 0

      const calcRcq = pQuadril > 0 ? pCintura / pQuadril : 0
      const calcRce = alturaCm > 0 ? pCintura / alturaCm : 0

      let calcApVat = 0
      if (pCintura > 0 && pCoxaMax > 0) {
        if (pac.sexo === 'M') {
          calcApVat = (6 * pCintura) - (4.41 * pCoxaMax) + (1.19 * calcIdade) - 213.65;
        } else {
          calcApVat = (2.15 * pCintura) - (3.63 * pCoxaMax) + (1.46 * calcIdade) + (6.22 * calcImc) - 92.713;
        }
        calcApVat = Math.max(0, calcApVat);
      }

      const somatotipo = calcularSomatotipo(avalDados)
      const iamVal = (calcMuscular > 0 && calcKerr > 0) ? (calcKerr / calcMuscular) : 0
      const imoVal = (calcMuscularMartin > 0 && calcOsseaMartin > 0) ? (calcMuscularMartin / calcOsseaMartin) : 0

      // BUSCAR DADOS DE PLANEJAMENTO DO BANCO DE DADOS
      const { data: calcSalvoNoBanco } = await supabase
        .from('dados_calculados')
        .select('*')
        .eq('id_avaliacao', avalDados.id)
        .maybeSingle();

      const payloadCalculado = {
        ...calcSalvoNoBanco, 
        id_paciente: pac.id || avalDados.id_paciente,
        id_avaliacao: avalDados.id,
        imc: Number(calcImc.toFixed(2)),
        massa_gorda: Number(massaGordaCalc.toFixed(2)),
        massa_magra: Number(massaMagraCalc.toFixed(2)),
        massa_muscular: Number(calcMuscular.toFixed(2)),
        relacao_cintura_quadril: Number(calcRcq.toFixed(2)),
        relacao_cintura_estatura: Number(calcRce.toFixed(2)),
        area_previsao_visceral_apvat: Number(calcApVat.toFixed(1)),
        somatorio_6_dobras: Number(calcSoma6.toFixed(1)),
        somatorio_8_dobras: Number(calcSoma8.toFixed(1)),
        perimetro_corrigido_braco: Number(calcPerimCorrigidoBraco.toFixed(2)),
        perimetro_corrigido_coxa: Number(calcPerimCorrigidoCoxa.toFixed(2)),
        perimetro_corrigido_panturrilha: Number(calcPerimCorrigidoPanturrilha.toFixed(2)),
        indice_massa_ossea_imo: Number(imoVal.toFixed(3)),
        indice_adiposo_muscular: Number(iamVal.toFixed(2)),
        ...somatotipo
      }

      if (!isPublicView) {
        const { error: upsertError } = await supabase
          .from('dados_calculados')
          .upsert(payloadCalculado, { onConflict: 'id_avaliacao' })

        if (upsertError) console.warn('Nota: Não foi possível sincronizar no banco.', upsertError)
      }

      setDados({
        ...payloadCalculado,
        calcKerr,
        calcRocha,
        calcWurch,
        avaliacoes: avalDados,
        pacientes: pac
      })

      setLoading(false)
    }

    processarERecarregarResultados()
  }, [avaliacaoId, tokenUrl, isPublicView])

  if (loading) return <div className="p-8 text-center text-gray-500 dark:text-slate-400">Carregando e atualizando relatório...</div>
  if (!dados) return <div className="p-8 text-center text-red-500">Não foi possível carregar os resultados desta avaliação.</div>

  const aval = dados.avaliacoes || {}
  const pac = dados.pacientes || {}

  const urlVideoRaw = aval.video_url || videoUrlPadrao
  const videoEmbedUrl = obterUrlEmbedYouTube(urlVideoRaw)

  const podeExibir = (chave) => {
    if (!configVisibilidade) return true;
    const idPaciente = pac?.id;
    if (idPaciente && configVisibilidade.pacientes?.[idPaciente]?.[chave] !== undefined) {
      return configVisibilidade.pacientes[idPaciente][chave];
    }
    if (configVisibilidade[chave] !== undefined) {
      return configVisibilidade[chave] !== false;
    }
    return true;
  }

  let idade = 0
  if (pac.data_nascimento) {
    const birthDate = new Date(pac.data_nascimento + 'T12:00:00')
    const evalDate = new Date(aval.data_avaliacao ? aval.data_avaliacao + 'T12:00:00' : Date.now())
    idade = evalDate.getFullYear() - birthDate.getFullYear()
    const m = evalDate.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && evalDate.getDate() < birthDate.getDate())) idade--
  }

  const cinturaVal = aval.perimetro_cintura || 0
  let statusCintura = '-'
  if (cinturaVal > 0) {
    if (pac.sexo === 'M') {
      if (cinturaVal < 94) statusCintura = 'Normal'
      else if (cinturaVal < 102) statusCintura = 'Elevado'
      else statusCintura = 'Muito Elevado'
    } else {
      if (cinturaVal < 80) statusCintura = 'Normal'
      else if (cinturaVal < 88) statusCintura = 'Elevado'
      else statusCintura = 'Muito Elevado'
    }
  }

  const imc = dados.imc || 0
  const infoImc = classificarImc ? classificarImc(imc) : { classificacao: '-', cor: 'gray' };
  const percentualGordura = aval.percentual_de_gordura || 0 
  const pesoTotal = aval.peso_paciente || 0

  const pctGorduraRegressao = percentualGordura
  const pctMassaLivreGordura = pctGorduraRegressao > 0 ? (100 - pctGorduraRegressao) : 0
  const massaGorda2C = dados.massa_gorda || (pesoTotal * (pctGorduraRegressao / 100))
  const massaMagra2C = dados.massa_magra || (pesoTotal - massaGorda2C)

  const dadosPizza2Comp = [
    { name: 'Massa Gorda (%GC)', value: pctGorduraRegressao, kg: massaGorda2C, color: '#f59e0b' },
    { name: 'Massa Livre de Gordura (MLG)', value: pctMassaLivreGordura, kg: massaMagra2C, color: '#3b82f6' }
  ]

  const massaMuscularLee = dados.massa_muscular || 0
  const massaAdiposaKerrKg = dados.calcKerr || 0
  const massaOssea4C = dados.calcRocha || 0
  const massaResidual4C = dados.calcWurch || 0

  const pctGorduraDeRose = pesoTotal > 0 ? (massaAdiposaKerrKg / pesoTotal) * 100 : 0
  const pctMusculoDeRose = pesoTotal > 0 ? (massaMuscularLee / pesoTotal) * 100 : 0
  const pctOssoDeRose = pesoTotal > 0 ? (massaOssea4C / pesoTotal) * 100 : 0
  const pctResidualDeRose = pesoTotal > 0 ? (massaResidual4C / pesoTotal) * 100 : 0

  const dadosPizza4Comp = [
    { name: 'Tecido Adiposo (Kerr 1991)', value: pctGorduraDeRose, kg: massaAdiposaKerrKg, color: '#f59e0b' },
    { name: 'Tecido Muscular (Lee 2000)', value: pctMusculoDeRose, kg: massaMuscularLee, color: '#10b981' },
    { name: 'Tecido Ósseo (Rocha 1975)', value: pctOssoDeRose, kg: massaOssea4C, color: '#6366f1' },
    { name: 'Massa Residual (Würch 1973)', value: pctResidualDeRose, kg: massaResidual4C, color: '#64748b' }
  ]

  const iamVal = dados.indice_adiposo_muscular || 0
  const imoVal = dados.indice_massa_ossea_imo || 0
  const infoImo = classificarImo(imoVal, pac.sexo)
  const apvatVal = dados.area_previsao_visceral_apvat || 0

  const infoApVat = classificarApVat ? classificarApVat(apvatVal, pac.sexo) : { classificacao: '-', cor: 'gray' };
  const rcq = dados.relacao_cintura_quadril || 0;
  const infoRcq = classificarRcq ? classificarRcq(rcq, pac.sexo) : { classificacao: '-', cor: 'gray' };
  const rce = dados.relacao_cintura_estatura || 0;
  const infoRce = classificarRce ? classificarRce(rce) : { classificacao: '-', cor: 'gray' };

  const infoCormico = calcularIndiceCormico(aval.altura_sentado_paciente, aval.altura_paciente);
  const infoManouvrier = calcularIndiceManouvrier(aval.altura_sentado_paciente, aval.altura_paciente);
  const infoEnvergadura = calcularEnvergaduraRelativa(aval.envergadura_paciente, aval.altura_paciente);
  const conicidadeVal = calcularIndiceConicidade(aval.peso_paciente, aval.altura_paciente, aval.perimetro_cintura);
  const infoConicidade = classificarConicidade(conicidadeVal, pac.sexo);

  const soma6 = dados.somatorio_6_dobras || 0;
  const soma8 = dados.somatorio_8_dobras || 0;

  const ehIdadeArgoref = idade >= 20 && idade <= 30
  const infoSoma6 = ehIdadeArgoref 
    ? (classificarArgoref ? classificarArgoref(soma6, pac.sexo) : { classificacao: '-', cor: 'gray' })
    : { classificacao: classificarPercentilItaliano ? classificarPercentilItaliano(soma6, pac.sexo, idade) : '-', cor: 'emerald' }
  const rotuloSoma6 = ehIdadeArgoref ? 'ARGOREF (Holway):' : 'Percentil ISAK (Campa):'

  const infoMorrow = classificarMorrow ? classificarMorrow(percentualGordura, pac.sexo, idade) : { classificacao: '-', cor: 'gray' };

  const descricoesSomatotipo = classificarSomatotipoDetalhado ? classificarSomatotipoDetalhado({
    endomorfia: dados.somatotipo_endomorfia,
    mesomorfia: dados.somatotipo_mesomorfia,
    ectomorfia: dados.somatotipo_ectomorfia
  }) : { endomorfia: { descricao: '-' }, mesomorfia: { descricao: '-' }, ectomorfia: { descricao: '-' } };

  const perimCorrigidoBraco = dados.perimetro_corrigido_braco || 0;
  const perimCorrigidoCoxa = dados.perimetro_corrigido_coxa || 0;
  const perimCorrigidoPanturrilha = dados.perimetro_corrigido_panturrilha || 0;

  const coordX = 150 + ((dados.somatocarta_eixo_x || 0) * 15)
  const coordY = 150 - ((dados.somatocarta_eixo_y || 0) * 11)

  const temEquipamentos = equipamentos && (
    equipamentos.plicometro_adipometro || 
    equipamentos.paquimetro || 
    equipamentos.trena || 
    equipamentos.balanca || 
    equipamentos.estadiometro || 
    equipamentos.banco
  );

  const renderMedidaItem = (label, valor, unidade, chaveVisibilidade) => {
    if (!podeExibir(chaveVisibilidade)) return null;
    return (
      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-800 last:border-0" key={label}>
        <span className="text-xs font-medium text-gray-600 dark:text-slate-400">{label}</span>
        <span className="text-sm font-bold text-gray-800 dark:text-slate-100">
          {valor != null ? Number(valor).toFixed(1) : '-'} <span className="text-xs text-gray-400 dark:text-slate-400 font-normal">{unidade}</span>
        </span>
      </div>
    )
  }

  // DETECÇÃO AUTOMÁTICA DE BULKING / HIPERTROFIA
  const isBulking = (dados?.peso_alvo && aval.peso_paciente && Number(dados.peso_alvo) > Number(aval.peso_paciente)) ||
                    (dados?.perda_peso_total_kg && Number(dados.perda_peso_total_kg) < 0) ||
                    (dados?.calorias_fase_mudanca && dados?.gasto_energetico_total && Number(dados.calorias_fase_mudanca) > Number(dados.gasto_energetico_total));

  const superavitKcal = dados?.calorias_fase_mudanca && dados?.gasto_energetico_total ? Number(dados.calorias_fase_mudanca) - Number(dados.gasto_energetico_total) : 0;

  const alturaMeters = (aval.altura_paciente || 170) / 100;
  const mlgAtual = massaMagra2C || 50;
  const ffmiCalculado = alturaMeters > 0 ? (mlgAtual / (alturaMeters * alturaMeters)) + (6.1 * (1.8 - alturaMeters)) : 20;

  // RECONSTRUÇÃO DA CURVA DE TRAJETÓRIA DINÂMICA
  const intakeCalc = Number(dados?.calorias_fase_mudanca || 0);
  const daysCalc = Number(dados?.dias_alvo || 90);
  const weightCalc = Number(aval?.peso_paciente || 0);
  const heightCalc = Number(aval?.altura_paciente || 170);
  const ageCalc = idade || 25;
  const isMaleCalc = pac.sexo === 'M';
  // Mesmo fallback que a calculadora usa ao importar a avaliação: se não
  // tem percentual_de_gordura preenchido direto, deriva de massa_gorda/peso
  // (comum em avaliações por dobras cutâneas). Sem isso, a reconstrução da
  // curva aqui no Laudo cairia pra 0% e travaria a % de gordura exibida.
  const bfCalc = percentualGordura > 0
    ? Number(percentualGordura)
    : (massaGorda2C > 0 && weightCalc > 0 ? Number(((massaGorda2C / weightCalc) * 100).toFixed(1)) : 0);
  const palCalc = Number(dados?.fator_atividade || 1.2);
  const eqNome = (dados?.equacao_metabolica || '').toLowerCase();
  const formulaCalc = eqNome.includes('harris') ? 'harris' :
                      eqNome.includes('cunningham') ? 'cunningham' :
                      eqNome.includes('tinsley') ? 'tinsley' : 'mifflin';
  const baselineTDEECalc = Number(dados?.gasto_energetico_total || 2000);

  let dadosGraficoTrajetoria = [];
  if (intakeCalc > 0 && daysCalc > 0 && weightCalc > 0) {
    dadosGraficoTrajetoria = simulateWeightTrajectory(
      intakeCalc, daysCalc, weightCalc, heightCalc, ageCalc, isMaleCalc, bfCalc, palCalc, formulaCalc, baselineTDEECalc
    );
  }

  return (
    <div className={`space-y-6 pb-10 ${isPublicView ? 'max-w-4xl mx-auto p-4 sm:p-6' : ''}`}>

      {/* TOPO E CABEÇALHO */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-4">
            {logomarcaUrl ? (
              <img src={logomarcaUrl} alt="Logo" className="h-16 w-auto object-contain" />
            ) : (
              <div className="h-12 w-12 bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wide">{nomeEmpresa || 'Consultório'}</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400">Avaliador(a): <span className="font-semibold text-gray-700 dark:text-slate-300">{nomeAvaliador || '-'}</span></p>
            </div>
          </div>

          <div className="flex flex-col items-end mt-4 sm:mt-0">
            <span className="text-[10px] text-gray-400 dark:text-slate-400 font-medium tracking-wide">
              Gerado via <a href="https://evaluaos.nutricaocommarco.com.br" target="_blank" rel="noopener noreferrer" className="font-bold text-primary-600 hover:underline">EvaluaOS</a>
            </span>
            {!isPublicView && (
              <button onClick={() => navigate('/pacientes')} className="text-xs text-primary-600 font-semibold hover:underline mt-2 inline-block">
                ← Voltar para Histórico
              </button>
            )}
          </div>
        </div>

        {isPublicView && !sessaoAtiva && (
          <div className="mb-6">
            <NavegacaoPortalPaciente tokenPaciente={pac.token_publico} tokenLaudo={tokenPublico} ativo="laudo" />
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-800 dark:text-slate-100">Laudo Antropométrico</h2>
          <p className="text-lg font-medium text-gray-500 dark:text-slate-400 mt-1">{pac.nome_completo}</p>
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Sobre a Avaliação</p>
            <div className="space-y-1">
              <p className="text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Data:</span> {new Date((aval.data_avaliacao || '') + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              <p className="text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Idade Calculada:</span> {idade > 0 ? `${idade} anos` : <span className="text-red-500">N/A</span>}</p>
              {aval.equacao_de_regressao_escolhida && (
                <p className="text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Protocolo:</span> {aval.equacao_de_regressao_escolhida}</p>
              )}
            </div>
          </div>

          <div className="flex-[2] bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Perfil do Paciente</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {pac.sexo && <p className="text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Sexo:</span> {pac.sexo === 'M' ? 'Masculino' : 'Feminino'}</p>}
              {pac.etnia && <p className="text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Etnia:</span> {pac.etnia}</p>}
              {pac.nacionalidade && <p className="text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Nac.:</span> {pac.nacionalidade}</p>}
              {pac.ocupacao && <p className="text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Ocupação:</span> {pac.ocupacao}</p>}
              {(pac.pratica_esporte === 'true' || pac.pratica_esporte === true) && (
                <p className="text-sm text-gray-700 dark:text-slate-300 sm:col-span-2">
                  <span className="font-semibold">Esporte:</span> {pac.modalidade_esportiva || 'Sim'} {pac.nivel_pratica ? `(${pac.nivel_pratica})` : ''}
                </p>
              )}
              {pac.observacoes && (
                <div className="col-span-full pt-2 mt-1 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Obs:</span> {pac.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {temEquipamentos && (
          <div className="mt-4 bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">🛠️ Equipamentos Utilizados</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
              {equipamentos.plicometro_adipometro && (
                <p className="text-xs text-gray-700 dark:text-slate-300"><span className="font-semibold">Adipômetro:</span> {equipamentos.plicometro_adipometro}</p>
              )}
              {equipamentos.paquimetro && (
                <p className="text-xs text-gray-700 dark:text-slate-300"><span className="font-semibold">Paquímetro:</span> {equipamentos.paquimetro}</p>
              )}
              {equipamentos.trena && (
                <p className="text-xs text-gray-700 dark:text-slate-300"><span className="font-semibold">Trena:</span> {equipamentos.trena}</p>
              )}
              {equipamentos.balanca && (
                <p className="text-xs text-gray-700 dark:text-slate-300"><span className="font-semibold">Balança:</span> {equipamentos.balanca}</p>
              )}
              {equipamentos.estadiometro && (
                <p className="text-xs text-gray-700 dark:text-slate-300"><span className="font-semibold">Estadiômetro:</span> {equipamentos.estadiometro}</p>
              )}
              {equipamentos.banco && (
                <p className="text-xs text-gray-700 dark:text-slate-300">
                  <span className="font-semibold">Banco:</span> {equipamentos.banco} 
                  {equipamentos.altura_banco ? ` (${equipamentos.altura_banco} cm)` : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 1. MEDIDAS BÁSICAS */}
      {(podeExibir('laudo_peso') || podeExibir('laudo_estatura') || podeExibir('laudo_altura_sentado') || podeExibir('laudo_envergadura')) && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider mb-3 px-1 mt-6">📐 1. Medidas Básicas</h3>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2">
              {renderMedidaItem('Peso', aval.peso_paciente, 'kg', 'laudo_peso')}
              {renderMedidaItem('Estatura', aval.altura_paciente, 'cm', 'laudo_estatura')}
              {renderMedidaItem('Altura Sentado', aval.altura_sentado_paciente, 'cm', 'laudo_altura_sentado')}
              {renderMedidaItem('Envergadura', aval.envergadura_paciente, 'cm', 'laudo_envergadura')}
            </div>
          </div>
        </div>
      )}

      {/* 2. COMPOSIÇÃO CORPORAL */}
      {(podeExibir('laudo_imc') || podeExibir('laudo_percentual_gordura') || podeExibir('laudo_massa_gorda') || podeExibir('laudo_massa_magra') || podeExibir('laudo_massa_muscular')) && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider mb-3 px-1 mt-6">📊 2. Composição Corporal</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {/* CARD DO IMC COM CLASSIFICAÇÃO */}
            {podeExibir('laudo_imc') && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between relative">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">IMC</p>
                  <p className="text-2xl font-black text-gray-800 dark:text-slate-100 mt-1">
                    {imc > 0 ? imc.toFixed(1) : '-'} <span className="text-xs font-normal text-gray-500 dark:text-slate-400">kg/m²</span>
                  </p>
                </div>
                {imc > 0 && (
                  <div className="pt-2 mt-2 border-t border-gray-50 flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      infoImc.cor === 'red' ? 'bg-red-100 dark:bg-red-900/30 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                      infoImc.cor === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' :
                      infoImc.cor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                      infoImc.cor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                    }`}>
                      {infoImc.classificacao}
                    </span>
                  </div>
                )}
                <span className="absolute bottom-2 right-3 text-[9px] font-medium text-gray-400 dark:text-slate-400">Ref: OMS 1998</span>
              </div>
            )}

            {podeExibir('laudo_percentual_gordura') && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">% Gordura</p>
                <p className="text-2xl font-black text-amber-500 mt-1">{percentualGordura > 0 ? percentualGordura.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-500 dark:text-slate-400">%</span></p>
              </div>
            )}
            {podeExibir('laudo_massa_gorda') && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Massa Gorda</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{massaGorda2C > 0 ? massaGorda2C.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-500 dark:text-slate-400">kg</span></p>
              </div>
            )}
            {podeExibir('laudo_massa_magra') && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Massa Magra</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{massaMagra2C > 0 ? massaMagra2C.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-500 dark:text-slate-400">kg</span></p>
              </div>
            )}
            {podeExibir('laudo_massa_muscular') && (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-center border-l-4 border-l-primary-500 relative">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Massa Muscular</p>
                <p className="text-2xl font-black text-primary-700 dark:text-primary-400 mt-1">{massaMuscularLee > 0 ? massaMuscularLee.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-500 dark:text-slate-400">kg</span></p>
                <span className="absolute bottom-2 right-3 text-[9px] font-medium text-gray-400 dark:text-slate-400">Ref: Lee 2000</span>
              </div>
            )}
          </div>

          {/* 🥧 1. FRACIONAMENTO EM 2 COMPONENTES (EQUAÇÃO ESCOLHIDA) */}
          {podeExibir('laudo_fracionamento_2c') && pctGorduraRegressao > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4 mb-6">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-wider">
                  📊 Fracionamento em 2 Componentes (Modelo 2C)
                </h3>
                <span className="text-[10px] bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded font-bold">
                  Protocolo: {aval.equacao_de_regressao_escolhida || 'Petroski'}
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                <div className="w-full md:w-1/2 h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosPizza2Comp}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {dadosPizza2Comp.map((entry, index) => (
                          <Cell key={`cell-2c-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val, name, entry) => [
                          `${val.toFixed(1)}% (${entry.payload.kg.toFixed(2)} kg)`, 
                          name
                        ]}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full md:w-1/2 space-y-2 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                  {dadosPizza2Comp.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-gray-800 dark:text-slate-100">{item.kg.toFixed(2)} kg</span>
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-400 ml-1.5">({item.value.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 🥧 2. FRACIONAMENTO EM 4 COMPONENTES */}
          {podeExibir('laudo_fracionamento_4c') && pesoTotal > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 pb-2">
                <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-wider">
                  🧩 Fracionamento Anatômico em 4 Componentes
                </h3>
                <span className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">Modelos 4C</span>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-around gap-6">
                <div className="w-full md:w-1/2 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosPizza4Comp}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {dadosPizza4Comp.map((entry, index) => (
                          <Cell key={`cell-4c-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val, name, entry) => [
                          `${val.toFixed(1)}% (${entry.payload.kg.toFixed(2)} kg)`, 
                          name
                        ]}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full md:w-1/2 space-y-2 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                  {dadosPizza4Comp.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-gray-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-gray-800 dark:text-slate-100">{item.kg.toFixed(2)} kg</span>
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-400 ml-1.5">({item.value.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 3. DOBRAS CUTÂNEAS */}
      {(podeExibir('laudo_dobra_triceps') || podeExibir('laudo_dobra_subescapular') || podeExibir('laudo_dobra_biceps') || podeExibir('laudo_dobra_crista_iliaca') || podeExibir('laudo_dobra_supraespinhal') || podeExibir('laudo_dobra_abdominal') || podeExibir('laudo_dobra_coxa') || podeExibir('laudo_dobra_panturrilha')) && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider mb-3 px-1 mt-6">🤏 3. Dobras Cutâneas</h3>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2">
              {renderMedidaItem('Tríceps', aval.dobra_cutanea_triceps, 'mm', 'laudo_dobra_triceps')}
              {renderMedidaItem('Subescapular', aval.dobra_cutanea_subescapular, 'mm', 'laudo_dobra_subescapular')}
              {renderMedidaItem('Bíceps', aval.dobra_cutanea_biceps, 'mm', 'laudo_dobra_biceps')}
              {renderMedidaItem('Crista Ilíaca', aval.dobra_cutanea_crista_iliaca, 'mm', 'laudo_dobra_crista_iliaca')}
              {renderMedidaItem('Supraespinhal', aval.dobra_cutanea_supraespinhal, 'mm', 'laudo_dobra_supraespinhal')}
              {renderMedidaItem('Abdominal', aval.dobra_cutanea_abdominal, 'mm', 'laudo_dobra_abdominal')}
              {renderMedidaItem('Coxa Média', aval.dobra_cutanea_coxa_media, 'mm', 'laudo_dobra_coxa')}
              {renderMedidaItem('Panturrilha', aval.dobra_cutanea_panturrilha, 'mm', 'laudo_dobra_panturrilha')}
            </div>
          </div>
        </div>
      )}

      {/* 4. INDICADORES DE SAÚDE */}
      {(podeExibir('laudo_rcq') || podeExibir('laudo_rce') || podeExibir('laudo_status_cintura') || podeExibir('laudo_soma_6') || podeExibir('laudo_soma_8') || podeExibir('laudo_indice_cormico') || podeExibir('laudo_manouvrier') || podeExibir('laudo_envergadura_relativa') || podeExibir('laudo_conicidade')) && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider mb-3 px-1 mt-6">⚖️ 4. Indicadores de Saúde</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {podeExibir('laudo_rcq') && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Relação Cintura-Quadril</span>
                  <span className="text-lg font-black text-indigo-600">{rcq > 0 ? rcq.toFixed(2) : '-'}</span>
                </div>
                {rcq > 0 && (
                  <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">Classificação:</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                      infoRcq.cor === 'red' ? 'bg-red-100 dark:bg-red-900/30 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                      infoRcq.cor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                    }`}>
                      {infoRcq.classificacao}
                    </span>
                  </div>
                )}
              </div>
            )}

            {podeExibir('laudo_rce') && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Relação Cintura-Estatura</span>
                  <span className="text-lg font-black text-indigo-600">{rce > 0 ? rce.toFixed(2) : '-'}</span>
                </div>
                {rce > 0 && (
                  <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">Classificação:</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                      infoRce.cor === 'red' ? 'bg-red-100 dark:bg-red-900/30 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                      infoRce.cor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                      infoRce.cor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                    }`}>
                      {infoRce.classificacao}
                    </span>
                  </div>
                )}
              </div>
            )}

            {podeExibir('laudo_status_cintura') && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Circunferência da Cintura (Status)</span>
                <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-2 py-1 rounded-md uppercase tracking-wide">
                  {statusCintura}
                </span>
              </div>
            )}
            
            {podeExibir('laudo_soma_6') && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Σ 6 Dobras</span>
                  <span className="text-lg font-black text-amber-600">{soma6 > 0 ? soma6.toFixed(1) : '-'} <span className="text-xs font-normal text-gray-400 dark:text-slate-400">mm</span></span>
                </div>
                {soma6 > 0 && (
                  <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold">{rotuloSoma6}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                      infoSoma6.cor === 'red' ? 'bg-red-100 dark:bg-red-900/30 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                      infoSoma6.cor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                      infoSoma6.cor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                    }`}>
                      {infoSoma6.classificacao}
                    </span>
                  </div>
                )}
              </div>
            )}

            {podeExibir('laudo_soma_8') && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Σ 8 Dobras</span>
                <span className="text-lg font-black text-amber-600">{soma8 > 0 ? soma8.toFixed(1) : '-'} <span className="text-xs font-normal text-gray-400 dark:text-slate-400">mm</span></span>
              </div>
            )}

            {podeExibir('laudo_indice_cormico') && infoCormico.valor > 0 && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Índice Córmico</span>
                  <span className="text-lg font-black text-indigo-600">{infoCormico.valor.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-gray-50 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">Biotipo:</span>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                    {infoCormico.classificacao}
                  </span>
                </div>
              </div>
            )}

            {podeExibir('laudo_manouvrier') && infoManouvrier.valor > 0 && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Índice de Manouvrier</span>
                  <span className="text-lg font-black text-indigo-600">{infoManouvrier.valor.toFixed(0)}</span>
                </div>
                <div className="pt-2 border-t border-gray-50 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">Biotipo:</span>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                    {infoManouvrier.classificacao}
                  </span>
                </div>
              </div>
            )}

            {podeExibir('laudo_envergadura_relativa') && infoEnvergadura.valor > 0 && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Envergadura Relativa</span>
                  <span className="text-lg font-black text-indigo-600">{infoEnvergadura.valor.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-gray-50 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">Biotipo:</span>
                  <span className="text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                    {infoEnvergadura.classificacao}
                  </span>
                </div>
              </div>
            )}

            {podeExibir('laudo_conicidade') && conicidadeVal > 0 && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Índice de Conicidade</span>
                  <span className="text-lg font-black text-indigo-600">{conicidadeVal.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-gray-50 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">Classificação:</span>
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                    infoConicidade.cor === 'red' ? 'bg-red-100 dark:bg-red-900/30 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                    infoConicidade.cor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {infoConicidade.classificacao}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. PERÍMETROS */}
      {(podeExibir('laudo_perim_braco_rel') || podeExibir('laudo_perim_braco_cont') || podeExibir('laudo_perim_antibraco') || podeExibir('laudo_perim_cintura') || podeExibir('laudo_perim_abdominal') || podeExibir('laudo_perim_quadril') || podeExibir('laudo_perim_coxa_max') || podeExibir('laudo_perim_coxa_med') || podeExibir('laudo_perim_panturrilha')) && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider mb-3 px-1 mt-6">🔄 5. Perímetros</h3>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2">
              {renderMedidaItem('Braço Relaxado', aval.perimetro_braco_relaxado, 'cm', 'laudo_perim_braco_rel')}
              {renderMedidaItem('Braço Contraído', aval.perimetro_braco_contraido, 'cm', 'laudo_perim_braco_cont')}
              {renderMedidaItem('Antebraço', aval.perimetro_antibraco, 'cm', 'laudo_perim_antibraco')}
              {renderMedidaItem('Cintura', aval.perimetro_cintura, 'cm', 'laudo_perim_cintura')}
              {renderMedidaItem('Abdominal', aval.perimetro_abdominal, 'cm', 'laudo_perim_abdominal')}
              {renderMedidaItem('Quadril', aval.perimetro_quadril, 'cm', 'laudo_perim_quadril')}
              {renderMedidaItem('Coxa Máxima', aval.perimetro_coxa_maxima, 'cm', 'laudo_perim_coxa_max')}
              {renderMedidaItem('Coxa Média', aval.perimetro_coxa_media, 'cm', 'laudo_perim_coxa_med')}
              {renderMedidaItem('Panturrilha', aval.perimetro_panturrilha, 'cm', 'laudo_perim_panturrilha')}
            </div>
          </div>
        </div>
      )}

      {/* 6. PERÍMETROS CORRIGIDOS */}
      {(podeExibir('laudo_perim_corrigido_braco') || podeExibir('laudo_perim_corrigido_coxa') || podeExibir('laudo_perim_corrigido_panturrilha')) && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider mb-3 px-1 mt-6">💪 6. Perímetros Corrigidos (Massa Muscular Regional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {podeExibir('laudo_perim_corrigido_braco') && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Braço</span>
                <span className="text-lg font-black text-primary-600">{perimCorrigidoBraco > 0 ? perimCorrigidoBraco.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-400 dark:text-slate-400">cm</span></span>
              </div>
            )}
            {podeExibir('laudo_perim_corrigido_coxa') && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Coxa</span>
                <span className="text-lg font-black text-primary-600">{perimCorrigidoCoxa > 0 ? perimCorrigidoCoxa.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-400 dark:text-slate-400">cm</span></span>
              </div>
            )}
            {podeExibir('laudo_perim_corrigido_panturrilha') && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600 dark:text-slate-400">Panturrilha</span>
                <span className="text-lg font-black text-primary-600">{perimCorrigidoPanturrilha > 0 ? perimCorrigidoPanturrilha.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-400 dark:text-slate-400">cm</span></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. DIÂMETROS ÓSSEOS */}
      {(podeExibir('laudo_diam_umero') || podeExibir('laudo_diam_femur') || podeExibir('laudo_diam_punho') || podeExibir('laudo_diam_maleolar')) && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider mb-3 px-1 mt-6">🦴 7. Diâmetros Ósseos</h3>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2">
              {renderMedidaItem('Úmero', aval.diametro_umero, 'cm', 'laudo_diam_umero')}
              {renderMedidaItem('Fêmur', aval.diametro_femur, 'cm', 'laudo_diam_femur')}
              {renderMedidaItem('Punho', aval.diametro_punho, 'cm', 'laudo_diam_punho')}
              {renderMedidaItem('Tornozelo', aval.diametro_maleolar, 'cm', 'laudo_diam_maleolar')}
            </div>
          </div>
        </div>
      )}

      {/* 8 e 9. SOMATOTIPO E SOMATOCARTA */}
      {(podeExibir('laudo_somatotipo_barras') || podeExibir('laudo_somatocarta_grafico')) && (
        <>
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider mb-3 px-1 mt-6">🧬 8. Somatotipo (Heath-Carter)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {podeExibir('laudo_somatotipo_barras') && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
                <div className="space-y-5 mt-2">
                  
                  {/* Endomorfia */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span className="text-amber-700 dark:text-amber-400">Endomorfia (Adiposidade)</span>
                      <span>{dados.somatotipo_endomorfia || '-'}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full mb-1">
                      <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (dados.somatotipo_endomorfia || 0) * 10)}%` }}></div>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight">
                      {descricoesSomatotipo.endomorfia.descricao}
                    </p>
                  </div>

                  {/* Mesomorfia */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span className="text-blue-700 dark:text-blue-400">Mesomorfia (Musculosidade)</span>
                      <span>{dados.somatotipo_mesomorfia || '-'}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full mb-1">
                      <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (dados.somatotipo_mesomorfia || 0) * 10)}%` }}></div>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight">
                      {descricoesSomatotipo.mesomorfia.descricao}
                    </p>
                  </div>

                  {/* Ectomorfia */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span className="text-primary-700 dark:text-primary-400">Ectomorfia (Magreza / Linearidade)</span>
                      <span>{dados.somatotipo_ectomorfia || '-'}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full mb-1">
                      <div className="bg-primary-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (dados.somatotipo_ectomorfia || 0) * 10)}%` }}></div>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight">
                      {descricoesSomatotipo.ectomorfia.descricao}
                    </p>
                  </div>

                </div>
              </div>
            )}

            {podeExibir('laudo_somatocarta_grafico') && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
                <div className="relative">
                  <svg width="280" height="280" className="border rounded-lg bg-slate-50 dark:bg-slate-800 shadow-inner">
                    <line x1="140" y1="20" x2="140" y2="260" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4" />
                    <line x1="20" y1="140" x2="260" y2="140" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4" />
                    <polygon points="140,30 40,230 240,230" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                    <text x="140" y="20" textAnchor="middle" className="text-[10px] font-bold fill-blue-600">MESOMORFIA</text>
                    <text x="50" y="245" textAnchor="middle" className="text-[10px] font-bold fill-amber-600">ENDOMORFIA</text>
                    <text x="230" y="245" textAnchor="middle" className="text-[10px] font-bold fill-primary-600">ECTOMORFIA</text>
                    {dados.somatocarta_eixo_x != null && dados.somatocarta_eixo_y != null && (
                      <circle cx={coordX} cy={coordY} r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2" className="shadow-lg" />
                    )}
                  </svg>
                  <p className="text-center text-xs text-gray-500 dark:text-slate-400 mt-3 font-medium">
                    Coordenadas: X ({dados.somatocarta_eixo_x || '0'}) | Y ({dados.somatocarta_eixo_y || '0'})
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 10. OUTROS INDICADORES & CLASSIFICAÇÕES */}
      {(podeExibir('laudo_iam') || podeExibir('laudo_imo') || podeExibir('laudo_apvat') || podeExibir('laudo_morrow')) && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4 mt-6">
          <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider border-b pb-2">🚀 10. Outros Indicadores & Classificações</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            
            {/* apVAT */}
            {podeExibir('laudo_apvat') && (
              <div className="flex flex-col justify-between p-3 border border-gray-100 dark:border-slate-800 rounded-lg bg-gray-50 dark:bg-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Área Visceral (apVAT)</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-slate-100">
                    {apvatVal > 0 ? `${apvatVal.toFixed(1)} cm²` : '-'}
                  </span>
                </div>
                {apvatVal > 0 && (
                  <div className="flex justify-end">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      infoApVat.cor === 'red' ? 'bg-red-100 dark:bg-red-900/30 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                      infoApVat.cor === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' :
                      infoApVat.cor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                    }`}>
                      {infoApVat.classificacao}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Classificação Morrow et al. (2003) */}
            {podeExibir('laudo_morrow') && (
              <div className="flex flex-col justify-between p-3 border border-gray-100 dark:border-slate-800 rounded-lg bg-gray-50 dark:bg-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Gordura (Morrow 2003)</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-slate-100">{percentualGordura > 0 ? `${percentualGordura.toFixed(1)}%` : '-'}</span>
                </div>
                {percentualGordura > 0 && (
                  <div className="flex justify-end">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      infoMorrow.cor === 'red' ? 'bg-red-100 dark:bg-red-900/30 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                      infoMorrow.cor === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' :
                      infoMorrow.cor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                      infoMorrow.cor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                    }`}>
                      {infoMorrow.classificacao}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ÍNDICE ADIPOSO MUSCULAR (IAM) */}
            {podeExibir('laudo_iam') && (
              <div className="flex flex-col justify-between p-3 border border-gray-100 dark:border-slate-800 rounded-lg bg-gray-50 dark:bg-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Índice Adiposo Muscular (IAM)</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-slate-100">
                    {iamVal > 0 ? iamVal.toFixed(2) : '-'}
                  </span>
                </div>
                {iamVal > 0 && (
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 pt-1 border-t border-gray-100 dark:border-slate-800">
                    Você possui <strong className="text-gray-700 dark:text-slate-300">{(iamVal * 1000).toFixed(0)}g de gordura</strong> para cada <strong className="text-primary-700 dark:text-primary-400">1kg de músculo</strong>.
                  </p>
                )}
              </div>
            )}

            {/* ÍNDICE DE MÚSCULO ÓSSEO (IMO) */}
            {podeExibir('laudo_imo') && (
              <div className="flex flex-col p-3 border border-gray-100 dark:border-slate-800 rounded-lg bg-gray-50 dark:bg-slate-800 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Índice Músculo Ósseo (IMO)</span>
                  <span className="text-sm font-bold text-primary-700 dark:text-primary-400">
                    {imoVal > 0 ? imoVal.toFixed(3) : '-'}
                  </span>
                </div>
                {imoVal > 0 && (
                  <div className="pt-1 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 dark:text-slate-400 font-medium">Classificação (Holway):</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                      infoImo.cor === 'red' ? 'bg-red-100 dark:bg-red-900/30 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                      infoImo.cor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                      infoImo.cor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                      'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                    }`}>
                      {infoImo.classificacao}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. PLANEJAMENTO DIETÉTICO E METAS (HIPERTROFIA & EMAGRECIMENTO) */}
      {/* ========================================================================= */}
      {dados?.calorias_fase_mudanca && (podeExibir('laudo_plan_dieta') || podeExibir('laudo_plan_manutencao') || podeExibir('laudo_plan_peso_alvo') || podeExibir('laudo_plan_bf_alvo')) && (
        <div className={`bg-white dark:bg-slate-900 p-6 rounded-xl border shadow-sm space-y-6 mt-6 relative overflow-hidden ${isBulking ? 'border-primary-200 dark:border-primary-800' : 'border-blue-100 dark:border-blue-900/40'}`}>
          <div className={`absolute top-0 left-0 w-1.5 h-full ${isBulking ? 'bg-primary-600' : 'bg-blue-500'}`}></div>
          
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                🎯 11. Planejamento Metabólico & Metas
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                {isBulking ? 'Estratégia de Hipertrofia & Bulking Limpo em' : 'Projeção estimada considerando a adaptação metabólica em'} {dados.dias_alvo || '-'} dias.
              </p>
            </div>
            {isBulking && (
              <span className="text-[10px] bg-primary-100 dark:bg-primary-900/30 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                💪 Hipertrofia (Bulking)
              </span>
            )}
          </div>

          {/* ESTRUTURA PARA BULKING / HIPERTROFIA */}
          {isBulking ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Dieta de Superávit */}
                <div className="bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-primary-800 dark:text-primary-300 uppercase tracking-wider">Dieta Recomendada (Bulking)</p>
                    <p className="text-xs text-primary-600 font-medium">Calorias diárias em superávit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary-700 dark:text-primary-400">{dados.calorias_fase_mudanca}</p>
                    <p className="text-[9px] text-primary-600 uppercase font-bold">
                      Kcal / Dia {superavitKcal > 0 ? `(+${Math.round(superavitKcal)} kcal)` : ''}
                    </p>
                  </div>
                </div>

                {/* GET Base */}
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Gasto Energético Base (GET)</p>
                    <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">Manutenção atual</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-700 dark:text-slate-300">{dados.gasto_energetico_total || dados.calorias_manutencao_futura || '-'}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-400 uppercase font-bold">Kcal / Dia</p>
                  </div>
                </div>

              </div>

              {/* Metas de Peso Alvo e Teto Genético FFMI */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest block mb-1">Peso Alvo Projetado</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-200">{dados.peso_alvo || '-'} <span className="text-sm font-normal text-slate-400 dark:text-slate-400">kg</span></span>
                  {dados.peso_alvo && aval.peso_paciente && (
                    <span className={`text-[10px] font-bold block mt-1 rounded-md py-0.5 px-2 w-fit mx-auto ${
                      Number(dados.peso_alvo) >= Number(aval.peso_paciente)
                        ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20'
                        : 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/20'
                    }`}>
                      {Number(dados.peso_alvo) >= Number(aval.peso_paciente)
                        ? `+${(Number(dados.peso_alvo) - Number(aval.peso_paciente)).toFixed(1)} kg de Ganho`
                        : `-${(Number(aval.peso_paciente) - Number(dados.peso_alvo)).toFixed(1)} kg de Perda`
                      }
                    </span>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest block mb-1">Teto Genético (FFMI)</span>
                  <span className="text-2xl font-black text-blue-700 dark:text-blue-400">{ffmiCalculado.toFixed(1)}</span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 block mt-0.5">Potencial Muscular Natural</span>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest block mb-1">% Gordura Projetado</span>
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-200">{dados.meta_bf_percentual || percentualGordura.toFixed(1)} <span className="text-sm font-normal text-slate-400 dark:text-slate-400">%</span></span>
                  {dados.meta_bf_percentual && aval.percentual_de_gordura && (
                    <span className="text-[10px] font-bold text-amber-600 block mt-1 bg-amber-50 dark:bg-amber-900/20 dark:bg-amber-900/20 rounded-md py-0.5 px-2 w-fit mx-auto">
                      {(Number(dados.meta_bf_percentual) - Number(aval.percentual_de_gordura)).toFixed(1)}% em Relação ao Atual
                    </span>
                  )}
                </div>

              </div>

              {/* Tabela de Referência de Lyle McDonald */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-primary-400 uppercase tracking-wide">Tabela de Potencial Muscular (Lyle McDonald)</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400">Referência Natural</span>
                </div>
                <div className="grid grid-cols-4 text-center text-[10px] sm:text-xs pt-1">
                  <div>
                    <span className="block text-slate-400 dark:text-slate-400 font-bold">Ano 1</span>
                    <span className="font-black text-white">{pac.sexo === 'M' ? '9 - 11 kg/ano' : '4,5 - 5,4 kg/ano'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 dark:text-slate-400 font-bold">Ano 2</span>
                    <span className="font-black text-white">{pac.sexo === 'M' ? '4,5 - 5,4 kg/ano' : '2,2 - 2,7 kg/ano'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 dark:text-slate-400 font-bold">Ano 3</span>
                    <span className="font-black text-white">{pac.sexo === 'M' ? '2,3 - 2,7 kg/ano' : '1,1 - 1,4 kg/ano'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 dark:text-slate-400 font-bold">Ano 4+</span>
                    <span className="font-black text-white">{pac.sexo === 'M' ? '1,1 - 1,4 kg/ano' : '0,4 - 0,7 kg/ano'}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ESTRUTURA PADRÃO PARA EMAGRECIMENTO */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Bloco de Calorias */}
                {(podeExibir('laudo_plan_dieta') || podeExibir('laudo_plan_manutencao')) && (
                  <div className="space-y-3">
                    {podeExibir('laudo_plan_dieta') && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 p-4 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Dieta Recomendada</p>
                          <p className="text-xs text-blue-600/80 font-medium">Calorias para Fase de Mudança</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-blue-700 dark:text-blue-400">{dados.calorias_fase_mudanca}</p>
                          <p className="text-[9px] text-blue-500 uppercase font-bold">Kcal / Dia</p>
                        </div>
                      </div>
                    )}
                    
                    {podeExibir('laudo_plan_manutencao') && (
                      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Manutenção Futura</p>
                          <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">Após bater a meta</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-slate-700 dark:text-slate-300">{dados.calorias_manutencao_futura}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-400 uppercase font-bold">Kcal / Dia</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bloco de Metas Corporais Fracionadas */}
                {(podeExibir('laudo_plan_peso_alvo') || podeExibir('laudo_plan_bf_alvo')) && (
                  <div className="grid grid-cols-2 gap-3">
                    {podeExibir('laudo_plan_peso_alvo') && (
                      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex flex-col justify-center text-center ${!podeExibir('laudo_plan_bf_alvo') ? 'col-span-2' : ''}`}>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">Peso Alvo Projetado</span>
                        <span className="text-2xl font-black text-slate-800 dark:text-slate-200">{dados.peso_alvo} <span className="text-sm font-normal text-slate-400 dark:text-slate-400">kg</span></span>
                        {dados.peso_alvo && aval.peso_paciente && (
                          <span className={`text-[10px] font-bold mt-1 rounded-md py-0.5 px-2 w-fit mx-auto ${
                            Number(dados.peso_alvo) >= Number(aval.peso_paciente)
                              ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20'
                              : 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/20'
                          }`}>
                            {Number(dados.peso_alvo) >= Number(aval.peso_paciente)
                              ? `+${(Number(dados.peso_alvo) - Number(aval.peso_paciente)).toFixed(1)} kg`
                              : `-${(Number(aval.peso_paciente) - Number(dados.peso_alvo)).toFixed(1)} kg`
                            }
                          </span>
                        )}
                      </div>
                    )}

                    {podeExibir('laudo_plan_bf_alvo') && (
                      <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex flex-col justify-center text-center ${!podeExibir('laudo_plan_peso_alvo') ? 'col-span-2' : ''}`}>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest mb-1">% Gordura Projetado</span>
                        <span className="text-2xl font-black text-slate-800 dark:text-slate-200">{dados.meta_bf_percentual || '-'} <span className="text-sm font-normal text-slate-400 dark:text-slate-400">%</span></span>
                        {dados.meta_bf_percentual && aval.percentual_de_gordura && (
                          <span className="text-[10px] font-bold text-amber-600 mt-1 bg-amber-50 dark:bg-amber-900/20 dark:bg-amber-900/20 rounded-md py-0.5 px-2 w-fit mx-auto">
                            {(Number(dados.meta_bf_percentual) - Number(aval.percentual_de_gordura)).toFixed(1)}% em Relação ao Atual
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* GRÁFICO DA CURVA DE EMAGRECIMENTO (TRAJETÓRIA BWP) */}
              {dadosGraficoTrajetoria.length > 0 && podeExibir('laudo_plan_grafico_trajetoria') && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 mt-4">
                  <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        📉 Curva de Emagrecimento (Trajetória)
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Simulação fisiológica de evolução na balança considerando a adaptação metabólica.
                      </p>
                    </div>
                    <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 font-bold px-2.5 py-0.5 rounded uppercase">
                      {dados.dias_alvo || 90} dias
                    </span>
                  </div>

                  <div className="w-full h-[220px] sm:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={dadosGraficoTrajetoria} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                        <XAxis
                          dataKey="dia"
                          tick={{ fontSize: 9, fill: darkMode ? '#94a3b8' : '#64748b', fontWeight: 'bold' }}
                          tickFormatter={(val) => `Dia ${val}`}
                          minTickGap={25}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          domain={['dataMin - 1', 'dataMax + 1']}
                          tick={{ fontSize: 9, fill: darkMode ? '#94a3b8' : '#64748b', fontWeight: 'bold' }}
                          tickFormatter={(val) => `${val}kg`}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<CustomTooltipGraficoTrajetoria />} />
                        <Area type="monotone" dataKey="pesoAlto" stroke="none" fill="#bae6fd" fillOpacity={darkMode ? 0.15 : 0.4} />
                        <Area type="monotone" dataKey="pesoBaixo" stroke="none" fill={darkMode ? '#0f172a' : '#ffffff'} fillOpacity={1} />
                        <Line 
                          type="monotone" 
                          dataKey="pesoEstimado" 
                          stroke="#2563eb" 
                          strokeWidth={2.5} 
                          dot={false} 
                          activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} 
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex items-center gap-4 justify-center text-[10px] text-slate-500 dark:text-slate-400 font-medium pt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-sm"></div>
                      <span>Peso Médio Estimado</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 bg-sky-200 rounded-sm border border-sky-300"></div>
                      <span>Faixa Esperada (Incerteza)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {videoEmbedUrl && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3 my-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 text-primary-600 rounded-xl flex items-center justify-center font-bold text-base">
              📹
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Mensagem & Orientações em Vídeo</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Assista às explicações do seu avaliador sobre os resultados.</p>
            </div>
          </div>

          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md bg-slate-900">
            <iframe
              src={videoEmbedUrl}
              title="Orientações do Avaliador"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {dados && (
        <BotaoExportarPDF 
          dados={dados} 
          idade={idade} 
          statusCintura={statusCintura} 
          iamVal={iamVal} 
          imoVal={imoVal} 
          nomeEmpresa={nomeEmpresa}
          nomeAvaliador={nomeAvaliador}
          logomarcaUrl={logomarcaUrl}
          tokenPublico={tokenPublico}
          isPublicView={isPublicView}
          configVisibilidade={configVisibilidade}
        />
      )}
    </div>
  )
}