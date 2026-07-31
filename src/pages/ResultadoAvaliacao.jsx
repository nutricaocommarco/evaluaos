import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import BotaoExportarPDF from '../components/BotaoExportarPDF';

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
  const [tokenPublico, setTokenPublico] = useState('')

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

      // BUSCA DINÂMICA DO AVALIADOR
      let avalData = null;
      if (pac.id_avaliador) {
        const { data } = await supabase
          .from('avaliadores')
          .select('empresa, nome_completo, logomarca_url')
          .eq('auth_id', pac.id_avaliador)
          .maybeSingle();
        avalData = data;
      }

      if (!avalData) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.email) {
          const { data } = await supabase
            .from('avaliadores')
            .select('empresa, nome_completo, logomarca_url')
            .eq('email', authData.user.email)
            .maybeSingle();
          avalData = data;
        }
      }

      if (avalData) {
        setNomeEmpresa(avalData.empresa || '');
        setNomeAvaliador(avalData.nome_completo || '');
        setLogomarcaUrl(avalData.logomarca_url || '');
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

      let calcMuscular = 0
      if (alturaM > 0 && pBraco > 0 && pCoxa > 0 && pPant > 0) {
        const sexoNum = pac.sexo === 'M' ? 1 : 0
        let racaNum = 0
        if (pac.etnia === 'Afrodescendente') racaNum = 1.1
        if (pac.etnia === 'Asiatico') racaNum = -2
        let idade = 25
        if (pac.data_nascimento) {
          const birthDate = new Date(pac.data_nascimento + 'T12:00:00')
          const evalDate = new Date((avalDados.data_avaliacao || '') + 'T12:00:00')
          idade = evalDate.getFullYear() - birthDate.getFullYear()
          const m = evalDate.getMonth() - birthDate.getMonth()
          if (m < 0 || (m === 0 && evalDate.getDate() < birthDate.getDate())) idade--
        }
        calcMuscular = (alturaM * ((0.00744 * termoBraco) + (0.00088 * termoCoxa) + (0.00441 * termoPant))) + (2.4 * sexoNum) - (0.048 * idade) + racaNum + 7.8
      }

      const pCintura = avalDados.perimetro_cintura || 0
      const pQuadril = avalDados.perimetro_quadril || 0
      const calcRcq = pQuadril > 0 ? pCintura / pQuadril : 0
      const calcRce = alturaCm > 0 ? pCintura / alturaCm : 0

      const dSub = avalDados.dobra_cutanea_subescapular || 0
      const dSup = avalDados.dobra_cutanea_supraespinhal || 0
      const dAbd = avalDados.dobra_cutanea_abdominal || 0
      const dBic = avalDados.dobra_cutanea_biceps || 0
      const dIli = avalDados.dobra_cutanea_crista_iliaca || 0
      
      const calcSoma6 = dTri + dSub + dSup + dAbd + dCoxa + dPant
      const calcSoma8 = calcSoma6 + dBic + dIli

      const somatotipo = calcularSomatotipo(avalDados)

      // === CÁLCULOS DO IAM E IMO PARA O BANCO DE DADOS ===
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
  const percentualGordura = aval.percentual_de_gordura || 0 
  const massaGorda = dados.massa_gorda || 0
  const massaMagra = dados.massa_magra || 0
  const massaMuscular = dados.massa_muscular || 0

  const iamVal = dados.indice_adiposo_muscular || ((massaMuscular > 0 && massaGorda > 0) ? (massaGorda / massaMuscular) : 0)
  const imoVal = dados.indice_massa_ossea_imo || 0

  const perimCorrigidoBraco = dados.perimetro_corrigido_braco || 0;
  const perimCorrigidoCoxa = dados.perimetro_corrigido_coxa || 0;
  const perimCorrigidoPanturrilha = dados.perimetro_corrigido_panturrilha || 0;

  const coordX = 150 + ((dados.somatocarta_eixo_x || 0) * 15)
  const coordY = 150 - ((dados.somatocarta_eixo_y || 0) * 11)

  const rcq = dados.relacao_cintura_quadril || 0;
  const rce = dados.relacao_cintura_estatura || 0;
  const soma6 = dados.somatorio_6_dobras || 0;
  const soma8 = dados.somatorio_8_dobras || 0;

  const renderMedidaItem = (label, valor, unidade) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0" key={label}>
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <span className="text-sm font-bold text-gray-800">
        {valor != null ? Number(valor).toFixed(1) : '-'} <span className="text-xs text-gray-400 font-normal">{unidade}</span>
      </span>
    </div>
  )

  return (
    <div className={`space-y-6 pb-10 ${isPublicView ? 'max-w-4xl mx-auto p-4 sm:p-6' : ''}`}>
      
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative">
        
        {/* TOPO: LOGO, DADOS DO AVALIADOR E BRANDING EVALUAOS */}
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
              Gerado via <span className="font-bold text-emerald-600">EvaluaOS</span>
            </span>
            {!isPublicView && (
              <button onClick={() => navigate('/pacientes')} className="text-xs text-emerald-600 font-semibold hover:underline mt-2 inline-block">
                ← Voltar para Histórico
              </button>
            )}
          </div>
        </div>

        {/* NOME DO PACIENTE E LAUDO */}
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
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">📐 1. Medidas Básicas</h3>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2">
            {renderMedidaItem('Peso', aval.peso_paciente, 'kg')}
            {renderMedidaItem('Estatura', aval.altura_paciente, 'cm')}
            {renderMedidaItem('Altura Sentado', aval.altura_sentado_paciente, 'cm')}
            {renderMedidaItem('Envergadura', aval.envergadura_paciente, 'cm')}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">📊 2. Composição Corporal</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-semibold text-gray-500 uppercase">IMC</p>
            <p className="text-2xl font-black text-gray-800 mt-1">{imc > 0 ? imc.toFixed(1) : '-'} <span className="text-xs font-normal text-gray-500">kg/m²</span></p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-semibold text-gray-500 uppercase">% Gordura</p>
            <p className="text-2xl font-black text-amber-500 mt-1">{percentualGordura > 0 ? percentualGordura.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-500">%</span></p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-semibold text-gray-500 uppercase">Massa Gorda</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{massaGorda > 0 ? massaGorda.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-500">kg</span></p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-semibold text-gray-500 uppercase">Massa Magra</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{massaMagra > 0 ? massaMagra.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-500">kg</span></p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center border-l-4 border-l-emerald-500 relative">
            <p className="text-xs font-semibold text-gray-500 uppercase">Massa Muscular</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{massaMuscular > 0 ? massaMuscular.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-500">kg</span></p>
            <span className="absolute bottom-2 right-3 text-[9px] font-medium text-gray-400">Ref: Lee 2000</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">🤏 3. Dobras Cutâneas</h3>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2">
            {renderMedidaItem('Tríceps', aval.dobra_cutanea_triceps, 'mm')}
            {renderMedidaItem('Subescapular', aval.dobra_cutanea_subescapular, 'mm')}
            {renderMedidaItem('Bíceps', aval.dobra_cutanea_biceps, 'mm')}
            {renderMedidaItem('Crista Ilíaca', aval.dobra_cutanea_crista_iliaca, 'mm')}
            {renderMedidaItem('Supraespinhal', aval.dobra_cutanea_supraespinhal, 'mm')}
            {renderMedidaItem('Abdominal', aval.dobra_cutanea_abdominal, 'mm')}
            {renderMedidaItem('Coxa Média', aval.dobra_cutanea_coxa_media, 'mm')}
            {renderMedidaItem('Panturrilha', aval.dobra_cutanea_panturrilha, 'mm')}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">⚖️ 4. Indicadores de Saúde</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <span className="text-xs font-bold text-gray-600">Relação Cintura-Quadril</span>
            <span className="text-lg font-black text-indigo-600">{rcq > 0 ? rcq.toFixed(2) : '-'}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <span className="text-xs font-bold text-gray-600">Relação Cintura-Estatura</span>
            <span className="text-lg font-black text-indigo-600">{rce > 0 ? rce.toFixed(2) : '-'}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-700">Circunferência da Cintura (Status)</span>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md uppercase tracking-wide">
              {statusCintura}
            </span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <span className="text-xs font-bold text-gray-600">Σ 6 Dobras</span>
            <span className="text-lg font-black text-amber-600">{soma6 > 0 ? soma6.toFixed(1) : '-'} <span className="text-xs font-normal text-gray-400">mm</span></span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <span className="text-xs font-bold text-gray-600">Σ 8 Dobras</span>
            <span className="text-lg font-black text-amber-600">{soma8 > 0 ? soma8.toFixed(1) : '-'} <span className="text-xs font-normal text-gray-400">mm</span></span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">🔄 5. Perímetros</h3>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2">
            {renderMedidaItem('Braço Relaxado', aval.perimetro_braco_relaxado, 'cm')}
            {renderMedidaItem('Braço Contraído', aval.perimetro_braco_contraido, 'cm')}
            {renderMedidaItem('Antebraço', aval.perimetro_antibraco, 'cm')}
            {renderMedidaItem('Cintura', aval.perimetro_cintura, 'cm')}
            {renderMedidaItem('Abdominal', aval.perimetro_abdominal, 'cm')}
            {renderMedidaItem('Quadril', aval.perimetro_quadril, 'cm')}
            {renderMedidaItem('Coxa Máxima', aval.perimetro_coxa_maxima, 'cm')}
            {renderMedidaItem('Coxa Média', aval.perimetro_coxa_media, 'cm')}
            {renderMedidaItem('Panturrilha', aval.perimetro_panturrilha, 'cm')}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">💪 6. Perímetros Corrigidos (Massa Muscular Regional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <span className="text-xs font-bold text-gray-600">Braço</span>
            <span className="text-lg font-black text-emerald-600">{perimCorrigidoBraco > 0 ? perimCorrigidoBraco.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-400">cm</span></span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <span className="text-xs font-bold text-gray-600">Coxa</span>
            <span className="text-lg font-black text-emerald-600">{perimCorrigidoCoxa > 0 ? perimCorrigidoCoxa.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-400">cm</span></span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
            <span className="text-xs font-bold text-gray-600">Panturrilha</span>
            <span className="text-lg font-black text-emerald-600">{perimCorrigidoPanturrilha > 0 ? perimCorrigidoPanturrilha.toFixed(2) : '-'} <span className="text-xs font-normal text-gray-400">cm</span></span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">🦴 7. Diâmetros Ósseos</h3>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2">
            {renderMedidaItem('Úmero', aval.diametro_umero, 'cm')}
            {renderMedidaItem('Fêmur', aval.diametro_femur, 'cm')}
            {renderMedidaItem('Punho', aval.diametro_punho, 'cm')}
            {renderMedidaItem('Tornozelo', aval.diametro_maleolar, 'cm')}
          </div>
        </div>
      </div>

      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 px-1 mt-6">🧬 8. Somatotipo (Heath-Carter)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="space-y-5 mt-2">
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span className="text-amber-700">Endomorfia (Adiposidade)</span>
                <span>{dados.somatotipo_endomorfia || '-'}</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (dados.somatotipo_endomorfia || 0) * 10)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span className="text-blue-700">Mesomorfia (Musculosidade)</span>
                <span>{dados.somatotipo_mesomorfia || '-'}</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (dados.somatotipo_mesomorfia || 0) * 10)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold mb-1">
                <span className="text-emerald-700">Ectomorfia (Magreza / Linearidade)</span>
                <span>{dados.somatotipo_ectomorfia || '-'}</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (dados.somatotipo_ectomorfia || 0) * 10)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

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
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 mt-6">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b pb-2">🚀 10. Outros Indicadores & Classificações</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">

          <div className="flex justify-between items-center p-3 border border-gray-100 rounded-lg bg-gray-50">
            <span className="text-xs font-semibold text-gray-700">Índice Adiposo Muscular (IAM)</span>
            <span className="text-xs font-bold text-gray-800">
              {iamVal > 0 ? iamVal.toFixed(2) : '-'}
            </span>
          </div>

          <div className="flex flex-col p-3 border border-gray-100 rounded-lg bg-gray-50 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-700">Índice de Músculo Ósseo (IMO)</span>
              <span className="text-sm font-bold text-emerald-700">
                {imoVal > 0 ? imoVal.toFixed(3) : '-'}
              </span>
            </div>
          </div>
          
          {[
            'Área de Previsão Visceral (APVAT)', 
            'Gordura (Escala Morrow)', 
            'Gordura (Escala Argoref)'
          ].map((item, index) => (
            <div key={index} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg bg-gray-50">
              <span className="text-xs font-semibold text-gray-700">{item}</span>
              <span className="text-[10px] font-bold bg-gray-200 text-gray-500 px-2 py-1 rounded-md uppercase tracking-wide">Em breve</span>
            </div>
          ))}

        </div>
        
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

    </div>
  )
}