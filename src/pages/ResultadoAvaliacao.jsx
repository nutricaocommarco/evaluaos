import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { obterUrlEmbedYouTube } from '../utils/youtube'
import BotaoExportarPDF from '../components/BotaoExportarPDF'
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend 
} from 'recharts'
import { 
  classificarImc, 
  classificarRce, 
  classificarRcq, 
  classificarArgoref, 
  classificarMorrow, 
  classificarApVat, 
  classificarSomatotipoDetalhado 
} from '../utils/escalasNormativas'

// --- HELPER CÁLCULO DE SOMATOTIPO HEATH-CARTER ---
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

export default function ResultadoAvaliacao() {
  const location = useLocation()
  const navigate = useNavigate()
  const { tokenUrl } = useParams()

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

  if (!tokenUrl && !avaliacaoId) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
        <h2 className="text-xl font-bold text-gray-800">Nenhuma avaliação foi selecionada.</h2>
        <p className="text-gray-500">Selecione uma avaliação na lista para gerar o relatório.</p>
        <button onClick={() => navigate('/pacientes')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg">
          Voltar para Pacientes
        </button>
      </div>
    )
  }

  useEffect(() => {
    async function processarERecarregarResultados() {
      setLoading(true)

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
            .select('visibilidade_publica')
            .eq('auth_id', avalData.auth_id)
            .maybeSingle();

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
      const dCoxa = avalDados.dobra_cutanea_coxa_media || 0
      const dPant = avalDados.dobra_cutanea_panturrilha || 0

      const calcPerimCorrigidoBraco = pBraco > 0 ? pBraco - (dTri * 0.314) : 0;
      const calcPerimCorrigidoCoxa = pCoxa > 0 ? pCoxa - (dCoxa * 0.314) : 0;
      const calcPerimCorrigidoPanturrilha = pPant > 0 ? pPant - (dPant * 0.314) : 0;

      const termoBraco = Math.pow(calcPerimCorrigidoBraco, 2)
      const termoCoxa = Math.pow(calcPerimCorrigidoCoxa, 2)
      const termoPant = Math.pow(calcPerimCorrigidoPanturrilha, 2)

      let calcIdade = 25
      if (pac.data_nascimento) {
        const birthDate = new Date(pac.data_nascimento + 'T12:00:00')
        const evalDate = new Date((avalDados.data_avaliacao || '') + 'T12:00:00')
        calcIdade = evalDate.getFullYear() - birthDate.getFullYear()
        const m = evalDate.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && evalDate.getDate() < birthDate.getDate())) calcIdade--
      }

      let calcMuscular = 0
      if (alturaM > 0 && pBraco > 0 && pCoxa > 0 && pPant > 0) {
        const sexoNum = pac.sexo === 'M' ? 1 : 0
        let racaNum = 0
        if (pac.etnia === 'Afrodescendente') racaNum = 1.1
        if (pac.etnia === 'Asiatico') racaNum = -2
        calcMuscular = (alturaM * ((0.00744 * termoBraco) + (0.00088 * termoCoxa) + (0.00441 * termoPant))) + (2.4 * sexoNum) - (0.048 * calcIdade) + racaNum + 7.8
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

      const dSub = avalDados.dobra_cutanea_subescapular || 0
      const dSup = avalDados.dobra_cutanea_supraespinhal || 0
      const dAbd = avalDados.dobra_cutanea_abdominal || 0
      const dBic = avalDados.dobra_cutanea_biceps || 0
      const dIli = avalDados.dobra_cutanea_crista_iliaca || 0

      const calcSoma6 = dTri + dSub + dSup + dAbd + dCoxa + dPant
      const calcSoma8 = calcSoma6 + dBic + dIli

      const somatotipo = calcularSomatotipo(avalDados)

      const iamVal = (calcMuscular > 0 && massaGordaCalc > 0) ? (massaGordaCalc / calcMuscular) : 0

      const dUmero = Number(avalDados.diametro_umero) || 0;
      const dFemur = Number(avalDados.diametro_femur) || 0;
      const dRadio = Number(avalDados.diametro_punho) || 0; 
      const dMaleolar = Number(avalDados.diametro_maleolar) || 0;
      const parte1 = 0.6 * alturaCm * Math.pow(dUmero + dFemur + dRadio + dMaleolar, 2) * 0.0001;

      const cCoxa = Number(avalDados.perimetro_coxa_media) || 0;
      const cAntebraco = Number(avalDados.perimetro_antibraco) || 0;
      const cPant = Number(avalDados.perimetro_panturrilha) || 0;

      const tCoxa = cCoxa - (dCoxa * 0.3141);
      const tPant = cPant - (dPant * 0.3141);
      const parte2 = (alturaCm * (0.0553 * Math.pow(tCoxa, 2) + 0.0987 * Math.pow(cAntebraco, 2) + 0.0331 * Math.pow(tPant, 2)) - 2445) * 0.001;
      const imoVal = (parte1 > 0 && parte2 > 0) ? (parte2 / parte1) : 0;

      const payloadCalculado = {
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
        avaliacoes: avalDados,
        pacientes: pac
      })

      setLoading(false)
    }

    processarERecarregarResultados()
  }, [avaliacaoId, tokenUrl, isPublicView])

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando e atualizando relatório...</div>
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
  const alturaCm = aval.altura_paciente || 0
  const alturaM = alturaCm / 100
  const dUmero = Number(aval.diametro_umero) || 0
  const dFemur = Number(aval.diametro_femur) || 0

  // --- CÁLCULO DE 2 COMPONENTES (2C - EQUAÇÃO ESCOLHIDA) ---
  const pctGorduraRegressao = percentualGordura
  const pctMassaLivreGordura = pctGorduraRegressao > 0 ? (100 - pctGorduraRegressao) : 0
  const massaGorda2C = dados.massa_gorda || (pesoTotal * (pctGorduraRegressao / 100))
  const massaMagra2C = dados.massa_magra || (pesoTotal - massaGorda2C)

  const dadosPizza2Comp = [
    { name: 'Massa Gorda (%GC)', value: pctGorduraRegressao, kg: massaGorda2C, color: '#f59e0b' },
    { name: 'Massa Livre de Gordura (MLG)', value: pctMassaLivreGordura, kg: massaMagra2C, color: '#3b82f6' }
  ]

  // --- CÁLCULO DO TECIDO ADIPOSO (MODELO PHANTOM DE KERR 1988 / 1991) ---
  const dTri = aval.dobra_cutanea_triceps || 0
  const dSub = aval.dobra_cutanea_subescapular || 0
  const dSup = aval.dobra_cutanea_supraespinhal || 0
  const dAbd = aval.dobra_cutanea_abdominal || 0
  const dCoxa = aval.dobra_cutanea_coxa_media || 0
  const dPant = aval.dobra_cutanea_panturrilha || 0

  const soma6DobrasKerr = dTri + dSub + dSup + dAbd + dCoxa + dPant
  
  let massaAdiposaKerrKg = 0
  if (soma6DobrasKerr > 0 && alturaCm > 0) {
    const zAdiposo = ((soma6DobrasKerr * (170.18 / alturaCm)) - 116.41) / 34.79
    massaAdiposaKerrKg = Math.max(0, ((zAdiposo * 5.85) + 25.6) / Math.pow(170.18 / alturaCm, 3))
  } else {
    massaAdiposaKerrKg = massaGorda2C
  }

  // --- CÁLCULO DE 4 COMPONENTES (4C - DE ROSE ET AL.) ---
  const massaMuscularLee = dados.massa_muscular || 0

  // 1. Tecido Ósseo (Rocha, 1975)
  let massaOssea4C = 0
  if (alturaM > 0 && dUmero > 0 && dFemur > 0) {
    massaOssea4C = 3.02 * Math.pow(Math.pow(alturaM, 2) * (dUmero / 100) * (dFemur / 100) * 400, 0.712)
  }

  // 2. Tecido Residual (Würch, 1973)
  const pctResidualWurch = pac.sexo === 'M' ? 0.24 : 0.21
  const massaResidual4C = pesoTotal * pctResidualWurch

  // Percentuais de De Rose
  const pctGorduraDeRose = pesoTotal > 0 ? (massaAdiposaKerrKg / pesoTotal) * 100 : 0
  const pctMusculoDeRose = pesoTotal > 0 ? (massaMuscularLee / pesoTotal) * 100 : 0
  const pctOssoDeRose = pesoTotal > 0 ? (massaOssea4C / pesoTotal) * 100 : 0
  const pctResidualDeRose = pesoTotal > 0 ? (massaResidual4C / pesoTotal) * 100 : 0

  // Dados para o Gráfico de Pizza de 4 Componentes
  const dadosPizza4Comp = [
    { name: 'Tecido Adiposo (Kerr 1991)', value: pctGorduraDeRose, kg: massaAdiposaKerrKg, color: '#f59e0b' },
    { name: 'Tecido Muscular (Lee 2000)', value: pctMusculoDeRose, kg: massaMuscularLee, color: '#10b981' },
    { name: 'Tecido Ósseo (Rocha 1975)', value: pctOssoDeRose, kg: massaOssea4C, color: '#6366f1' },
    { name: 'Massa Residual (Würch 1973)', value: pctResidualDeRose, kg: massaResidual4C, color: '#64748b' }
  ]

  const iamVal = dados.indice_adiposo_muscular || ((massaMuscularLee > 0 && massaAdiposaKerrKg > 0) ? (massaAdiposaKerrKg / massaMuscularLee) : 0)
  const imoVal = dados.indice_massa_ossea_imo || 0
  const apvatVal = dados.area_previsao_visceral_apvat || 0

  const infoApVat = classificarApVat ? classificarApVat(apvatVal, pac.sexo) : { classificacao: '-', cor: 'gray' };
  const rcq = dados.relacao_cintura_quadril || 0;
  const infoRcq = classificarRcq ? classificarRcq(rcq, pac.sexo) : { classificacao: '-', cor: 'gray' };
  const rce = dados.relacao_cintura_estatura || 0;
  const infoRce = classificarRce ? classificarRce(rce) : { classificacao: '-', cor: 'gray' };

  const soma6 = dados.somatorio_6_dobras || 0;
  const soma8 = dados.somatorio_8_dobras || 0;

  const infoArgoref = classificarArgoref ? classificarArgoref(soma6, pac.sexo) : { classificacao: '-', cor: 'gray' };
  const infoMorrow = classificarMorrow ? classificarMorrow(percentualGordura, pac.sexo, idade) : { classificacao: '-', cor: 'gray' };

  const descricoesSomatotipo = classificarSomatotipoDetalhado ? classificarSomatotipoDetalhado({
    endomorfia: dados.somatotipo_endomorfia,
    mesomorfia: dados.somatotipo_mesomorfia,
    ectomorfia: dados.somatotipo_ectomorfia
  }) : {
    endomorfia: { descricao: '-' },
    mesomorfia: { descricao: '-' },
    ectomorfia: { descricao: '-' }
  };

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
      <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0" key={label}>
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className="text-sm font-bold text-gray-800">
          {valor != null ? Number(valor).toFixed(1) : '-'} <span className="text-xs text-gray-400 font-normal">{unidade}</span>
        </span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 pb-10 ${isPublicView ? 'max-w-4xl mx-auto p-4 sm:p-6' : ''}`}>

      {/* TOPO E CABEÇALHO */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-4">
            {logomarcaUrl ? (
              <img src={logomarcaUrl} alt="Logo" className="h-16 w-auto object-contain" />
            ) : (
              <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{nomeEmpresa || 'Consultório'}</h1>
              <p className="text-xs text-gray-500">Avaliador(a): <span className="font-semibold text-gray-700">{nomeAvaliador || '-'}</span></p>
            </div>
          </div>

          <div className="flex flex-col items-end mt-4 sm:mt-0">
            <span className="text-[10px] text-gray-400 font-medium tracking-wide">
              Gerado via <a href="https://evaluaos.nutricaocommarco.com.br" target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-600 hover:underline">EvaluaOS</a>
            </span>
            {!isPublicView && (
              <button onClick={() => navigate('/pacientes')} className="text-xs text-emerald-600 font-semibold hover:underline mt-2 inline-block">
                ← Voltar para Histórico
              </button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-black text-gray-800">Laudo Antropométrico</h2>
          <p className="text-lg font-medium text-gray-500 mt-1">{pac.nome_completo}</p>
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Sobre a Avaliação</p>
            <div className="space-y-1">
              <p className="text-sm text-gray-700"><span className="font-semibold">Data:</span> {new Date((aval.data_avaliacao || '') + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Idade Calculada:</span> {idade > 0 ? `${idade} anos` : <span className="text-red-500">N/A</span>}</p>
              {aval.equacao_de_regressao_escolhida && (
                <p className="text-sm text-gray-700"><span className="font-semibold">Protocolo:</span> {aval.equacao_de_regressao_escolhida}</p>
              )}
            </div>
          </div>

          <div className="flex-[2] bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Perfil do Paciente</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
              {pac.sexo && <p className="text-sm text-gray-700"><span className="font-semibold">Sexo:</span> {pac.sexo === 'M' ? 'Masculino' : 'Feminino'}</p>}
              {pac.etnia && <p className="text-sm text-gray-700"><span className="font-semibold">Etnia:</span> {pac.etnia}</p>}
              {pac.nacionalidade && <p className="text-sm text-gray-700"><span className="font-semibold">Nac.:</span> {pac.nacionalidade}</p>}
              {pac.ocupacao && <p className="text-sm text-gray-700"><span className="font-semibold">Ocupação:</span> {pac.ocupacao}</p>}
              {(pac.pratica_esporte === 'true' || pac.pratica_esporte === true) && (
                <p className="text-sm text-gray-700 sm:col-span-2">
                  <span className="font-semibold">Esporte:</span> {pac.modalidade_esportiva || 'Sim'} {pac.nivel_pratica ? `(${pac.nivel_pratica})` : ''}
                </p>
              )}
              {pac.observacoes && (
                <div className="col-span-full pt-2 mt-1 border-t border-gray-200">
                  <p className="text-sm text-gray-700"><span className="font-semibold">Obs:</span> {pac.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {temEquipamentos && (
          <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">🛠️ Equipamentos Utilizados</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
              {equipamentos.plicometro_adipometro && (
                <p className="text-xs text-gray-700"><span className="font-semibold">Adipômetro:</span> {equipamentos.plicometro_adipometro}</p>
              )}
              {equipamentos.paquimetro && (
                <p className="text-xs text-gray-700"><span className="font-semibold">Paquímetro:</span> {equipamentos.paquimetro}</p>
              )}
              {equipamentos.trena && (
                <p className="text-xs text-gray-700"><span className="font-semibold">Trena:</span> {equipamentos.trena}</p>
              )}
              {equipamentos.balanca && (
                <p className="text-xs text-gray-700"><span className="font-semibold">Balança:</span> {equipamentos.balanca}</p>
              )}
              {equipamentos.estadiometro && (
                <p className="text-xs text-gray-700"><span className="font-semibold">Estadiômetro:</span> {equipamentos.estadiometro}</p>
              )}
              {equipamentos.banco && (
                <p className="text-xs text-gray-700">
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
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">📐 1. Medidas Básicas</h3>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
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
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">📊 2. Composição Corporal</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {/* CARD DO IMC COM CLASSIFICAÇÃO */}
            {podeExibir('laudo_imc') && (
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between relative">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">IMC</p>
                  <p className="text-2xl font-black text-gray-800 mt-1">
                    {imc > 0 ? imc.toFixed(1) : '-'} <span className="text-xs font-normal text-gray-500">kg/m²</span>
                  </p>
                </div>
                {imc > 0 && (
                  <div className="pt-2 mt-2 border-t border-gray-50 flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      infoImc.cor === 'red' ? 'bg-red-100 text-red-800' :
                      infoImc.cor === 'orange' ? 'bg-orange-100 text-orange-800' :
                      infoImc.cor === 'amber' ? 'bg-amber-100 text-amber-800' :
                      infoImc.cor === 'blue' ? 'bg-blue-100 text-blue-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {infoImc.classificacao}
                    </span>
                  </div>
                )}
                <span className="absolute bottom-2 right-3 text-[9px] font-medium text-gray-400">Ref: OMS 1998</span>
              </div>
            )}

            {podeExibir('laudo_percentual_gordura') && (
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-semibold text-gray-500 uppercase">% Gordura</p>
                <p className="text-2xl font-black text-amber-500 mt-1">{percentualGordura > 0 ? percentualGordura.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-500">%</span></p>
              </div>
            )}
            {podeExibir('laudo_massa_gorda') && (
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-semibold text-gray-500 uppercase">Massa Gorda</p>
                <p className="text-2xl font-black text-amber-600 mt-1">{massaGorda2C > 0 ? massaGorda2C.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-500">kg</span></p>
              </div>
            )}
            {podeExibir('laudo_massa_magra') && (
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
                <p className="text-xs font-semibold text-gray-500 uppercase">Massa Magra</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{massaMagra2C > 0 ? massaMagra2C.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-500">kg</span></p>
              </div>
            )}
            {podeExibir('laudo_massa_muscular') && (
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center border-l-4 border-l-emerald-500 relative">
                <p className="text-xs font-semibold text-gray-500 uppercase">Massa Muscular</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">{massaMuscularLee > 0 ? massaMuscularLee.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-500">kg</span></p>
                <span className="absolute bottom-2 right-3 text-[9px] font-medium text-gray-400">Ref: Lee 2000</span>
              </div>
            )}
          </div>

          {/* 🥧 1. FRACIONAMENTO EM 2 COMPONENTES (EQUAÇÃO ESCOLHIDA) */}
          {podeExibir('laudo_fracionamento_2c') && pctGorduraRegressao > 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 mb-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">
                  📊 Fracionamento em 2 Componentes (Modelo 2C)
                </h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
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

                <div className="w-full md:w-1/2 space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {dadosPizza2Comp.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-xs font-bold text-gray-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-gray-800">{item.kg.toFixed(2)} kg</span>
                        <span className="text-[10px] font-semibold text-gray-400 ml-1.5">({item.value.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 🥧 2. FRACIONAMENTO EM 4 COMPONENTES (DE ROSE ET AL.) */}
          {podeExibir('laudo_fracionamento_4c') && pesoTotal > 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider">
                  🧩 Fracionamento Anatômico em 4 Componentes (Modelo 4C - De Rose et al.)
                </h3>
                <span className="text-[10px] text-gray-400 font-medium">Modelo 4C</span>
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

                <div className="w-full md:w-1/2 space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {dadosPizza4Comp.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-xs font-bold text-gray-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-gray-800">{item.kg.toFixed(2)} kg</span>
                        <span className="text-[10px] font-semibold text-gray-400 ml-1.5">({item.value.toFixed(1)}%)</span>
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
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">🤏 3. Dobras Cutâneas</h3>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
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
      {(podeExibir('laudo_rcq') || podeExibir('laudo_rce') || podeExibir('laudo_status_cintura') || podeExibir('laudo_soma_6') || podeExibir('laudo_soma_8')) && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">⚖️ 4. Indicadores de Saúde</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* RCQ COM BADGE DE CLASSIFICAÇÃO */}
            {podeExibir('laudo_rcq') && (
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600">Relação Cintura-Quadril</span>
                  <span className="text-lg font-black text-indigo-600">{rcq > 0 ? rcq.toFixed(2) : '-'}</span>
                </div>
                {rcq > 0 && (
                  <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-medium">Classificação:</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                      infoRcq.cor === 'red' ? 'bg-red-100 text-red-800' :
                      infoRcq.cor === 'amber' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {infoRcq.classificacao}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* RCE COM BADGE DE CLASSIFICAÇÃO */}
            {podeExibir('laudo_rce') && (
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600">Relação Cintura-Estatura</span>
                  <span className="text-lg font-black text-indigo-600">{rce > 0 ? rce.toFixed(2) : '-'}</span>
                </div>
                {rce > 0 && (
                  <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-medium">Classificação:</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                      infoRce.cor === 'red' ? 'bg-red-100 text-red-800' :
                      infoRce.cor === 'amber' ? 'bg-amber-100 text-amber-800' :
                      infoRce.cor === 'blue' ? 'bg-blue-100 text-blue-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {infoRce.classificacao}
                    </span>
                  </div>
                )}
              </div>
            )}

            {podeExibir('laudo_status_cintura') && (
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700">Circunferência da Cintura (Status)</span>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md uppercase tracking-wide">
                  {statusCintura}
                </span>
              </div>
            )}
            
            {/* Σ 6 DOBRAS COM CLASSIFICAÇÃO ARGOREF LOGO ABAIXO */}
            {podeExibir('laudo_soma_6') && (
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600">Σ 6 Dobras</span>
                  <span className="text-lg font-black text-amber-600">{soma6 > 0 ? soma6.toFixed(1) : '-'} <span className="text-xs font-normal text-gray-400">mm</span></span>
                </div>
                {soma6 > 0 && (
                  <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-semibold">ARGOREF (Holway):</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                      infoArgoref.cor === 'red' ? 'bg-red-100 text-red-800' :
                      infoArgoref.cor === 'amber' ? 'bg-amber-100 text-amber-800' :
                      infoArgoref.cor === 'blue' ? 'bg-blue-100 text-blue-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {infoArgoref.classificacao}
                    </span>
                  </div>
                )}
              </div>
            )}

            {podeExibir('laudo_soma_8') && (
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">Σ 8 Dobras</span>
                <span className="text-lg font-black text-amber-600">{soma8 > 0 ? soma8.toFixed(1) : '-'} <span className="text-xs font-normal text-gray-400">mm</span></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. PERÍMETROS */}
      {(podeExibir('laudo_perim_braco_rel') || podeExibir('laudo_perim_braco_cont') || podeExibir('laudo_perim_antibraco') || podeExibir('laudo_perim_cintura') || podeExibir('laudo_perim_abdominal') || podeExibir('laudo_perim_quadril') || podeExibir('laudo_perim_coxa_max') || podeExibir('laudo_perim_coxa_med') || podeExibir('laudo_perim_panturrilha')) && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">🔄 5. Perímetros</h3>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
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
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">💪 6. Perímetros Corrigidos (Massa Muscular Regional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {podeExibir('laudo_perim_corrigido_braco') && (
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">Braço</span>
                <span className="text-lg font-black text-emerald-600">{perimCorrigidoBraco > 0 ? perimCorrigidoBraco.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-400">cm</span></span>
              </div>
            )}
            {podeExibir('laudo_perim_corrigido_coxa') && (
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">Coxa</span>
                <span className="text-lg font-black text-emerald-600">{perimCorrigidoCoxa > 0 ? perimCorrigidoCoxa.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-400">cm</span></span>
              </div>
            )}
            {podeExibir('laudo_perim_corrigido_panturrilha') && (
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">Panturrilha</span>
                <span className="text-lg font-black text-emerald-600">{perimCorrigidoPanturrilha > 0 ? perimCorrigidoPanturrilha.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-400">cm</span></span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. DIÂMETROS ÓSSEOS */}
      {(podeExibir('laudo_diam_umero') || podeExibir('laudo_diam_femur') || podeExibir('laudo_diam_punho') || podeExibir('laudo_diam_maleolar')) && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">🦴 7. Diâmetros Ósseos</h3>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2">
              {renderMedidaItem('Úmero', aval.diametro_umero, 'cm', 'laudo_diam_umero')}
              {renderMedidaItem('Fêmur', aval.diametro_femur, 'cm', 'laudo_diam_femur')}
              {renderMedidaItem('Punho', aval.diametro_punho, 'cm', 'laudo_diam_punho')}
              {renderMedidaItem('Tornozelo', aval.diametro_maleolar, 'cm', 'laudo_diam_maleolar')}
            </div>
          </div>
        </div>
      )}

      {/* 8 e 9. SOMATOTIPO E SOMATOCARTA COM DESCRIÇÕES VERBAIS DEDICADAS */}
      {(podeExibir('laudo_somatotipo_barras') || podeExibir('laudo_somatocarta_grafico')) && (
        <>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">🧬 8. Somatotipo (Heath-Carter)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {podeExibir('laudo_somatotipo_barras') && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
                <div className="space-y-5 mt-2">
                  
                  {/* Endomorfia */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span className="text-amber-700">Endomorfia (Adiposidade)</span>
                      <span>{dados.somatotipo_endomorfia || '-'}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full mb-1">
                      <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (dados.somatotipo_endomorfia || 0) * 10)}%` }}></div>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      {descricoesSomatotipo.endomorfia.descricao}
                    </p>
                  </div>

                  {/* Mesomorfia */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span className="text-blue-700">Mesomorfia (Musculosidade)</span>
                      <span>{dados.somatotipo_mesomorfia || '-'}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full mb-1">
                      <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (dados.somatotipo_mesomorfia || 0) * 10)}%` }}></div>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      {descricoesSomatotipo.mesomorfia.descricao}
                    </p>
                  </div>

                  {/* Ectomorfia */}
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-1">
                      <span className="text-emerald-700">Ectomorfia (Magreza / Linearidade)</span>
                      <span>{dados.somatotipo_ectomorfia || '-'}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2.5 rounded-full mb-1">
                      <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (dados.somatotipo_ectomorfia || 0) * 10)}%` }}></div>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      {descricoesSomatotipo.ectomorfia.descricao}
                    </p>
                  </div>

                </div>
              </div>
            )}

            {podeExibir('laudo_somatocarta_grafico') && (
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                <div className="relative">
                  <svg width="280" height="280" className="border rounded-lg bg-slate-50 shadow-inner">
                    <line x1="140" y1="20" x2="140" y2="260" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4" />
                    <line x1="20" y1="140" x2="260" y2="140" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4" />
                    <polygon points="140,30 40,230 240,230" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                    <text x="140" y="20" textAnchor="middle" className="text-[10px] font-bold fill-blue-600">MESOMORFIA</text>
                    <text x="50" y="245" textAnchor="middle" className="text-[10px] font-bold fill-amber-600">ENDOMORFIA</text>
                    <text x="230" y="245" textAnchor="middle" className="text-[10px] font-bold fill-emerald-600">ECTOMORFIA</text>
                    {dados.somatocarta_eixo_x != null && dados.somatocarta_eixo_y != null && (
                      <circle cx={coordX} cy={coordY} r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2" className="shadow-lg" />
                    )}
                  </svg>
                  <p className="text-center text-xs text-gray-500 mt-3 font-medium">
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
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 mt-6">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-2">🚀 10. Outros Indicadores & Classificações</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            
            {/* apVAT */}
            {podeExibir('laudo_apvat') && (
              <div className="flex flex-col justify-between p-3 border border-gray-100 rounded-lg bg-gray-50 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Área Visceral (apVAT)</span>
                  <span className="text-xs font-bold text-gray-800">
                    {apvatVal > 0 ? `${apvatVal.toFixed(1)} cm²` : '-'}
                  </span>
                </div>
                {apvatVal > 0 && (
                  <div className="flex justify-end">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      infoApVat.cor === 'red' ? 'bg-red-100 text-red-800' :
                      infoApVat.cor === 'orange' ? 'bg-orange-100 text-orange-800' :
                      infoApVat.cor === 'amber' ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {infoApVat.classificacao}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Classificação Morrow et al. (2003) */}
            {podeExibir('laudo_morrow') && (
              <div className="flex flex-col justify-between p-3 border border-gray-100 rounded-lg bg-gray-50 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Gordura (Morrow 2003)</span>
                  <span className="text-xs font-bold text-gray-800">{percentualGordura > 0 ? `${percentualGordura.toFixed(1)}%` : '-'}</span>
                </div>
                {percentualGordura > 0 && (
                  <div className="flex justify-end">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      infoMorrow.cor === 'red' ? 'bg-red-100 text-red-800' :
                      infoMorrow.cor === 'orange' ? 'bg-orange-100 text-orange-800' :
                      infoMorrow.cor === 'amber' ? 'bg-amber-100 text-amber-800' :
                      infoMorrow.cor === 'blue' ? 'bg-blue-100 text-blue-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {infoMorrow.classificacao}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ÍNDICE ADIPOSO MUSCULAR (IAM) COM EXPLICAÇÃO PRÁTICA */}
            {podeExibir('laudo_iam') && (
              <div className="flex flex-col justify-between p-3 border border-gray-100 rounded-lg bg-gray-50 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Índice Adiposo Muscular (IAM)</span>
                  <span className="text-xs font-bold text-gray-800">
                    {iamVal > 0 ? iamVal.toFixed(2) : '-'}
                  </span>
                </div>
                {iamVal > 0 && (
                  <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-100">
                    Você possui <strong className="text-gray-700">{(iamVal * 1000).toFixed(0)}g de gordura</strong> para cada <strong className="text-emerald-700">1kg de músculo</strong>.
                  </p>
                )}
              </div>
            )}

            {/* ÍNDICE DE MÚSCULO ÓSSEO (IMO) */}
            {podeExibir('laudo_imo') && (
              <div className="flex flex-col p-3 border border-gray-100 rounded-lg bg-gray-50 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-700">Índice Músculo Ósseo (IMO)</span>
                  <span className="text-sm font-bold text-emerald-700">
                    {imoVal > 0 ? imoVal.toFixed(3) : '-'}
                  </span>
                </div>
              </div>
            )}

          </div>

          {videoEmbedUrl && (
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3 my-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-base">
                  📹
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Mensagem & Orientações em Vídeo</h3>
                  <p className="text-xs text-slate-500">Assista às explicações do seu avaliador sobre os resultados.</p>
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
            />
          )}
        </div>
      )}

    </div>
  )
}