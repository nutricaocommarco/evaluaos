import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { obterUrlEmbedYouTube } from '../utils/youtube'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import BotaoExportarEvolucaoPDF from '../components/BotaoExportarEvolucaoPDF'
import { classificarArgoref, classificarApVat, calcularIndiceConicidade, classificarConicidade, classificarImo } from '../utils/escalasNormativas'
import { useTheme } from '../contexts/ThemeContext'

export default function EvolucaoPaciente() {
  const location = useLocation()
  const navigate = useNavigate()
  const { tokenUrl } = useParams() // Pega o token se for link público
  const { setDarkMode, setCorPrimaria } = useTheme()

  const isPublicView = !!tokenUrl;
  
  // Usa o paciente do state (se logado) ou null para buscar depois (se for link público)
  const [pacienteLocal, setPacienteLocal] = useState(location.state?.paciente || null)

  const [loading, setLoading] = useState(true)
  const [historico, setHistorico] = useState([])
  const [avaliador, setAvaliador] = useState(null)
  const [configVisibilidade, setConfigVisibilidade] = useState({})
  const [excluindoMetaId, setExcluindoMetaId] = useState(null)

  // Cores padronizadas para as bolinhas da Somatocarta e Legendas
  const coresAvaliacoes = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#64748b']

  useEffect(() => {
    async function carregarDados() {
      let pacienteAtual = pacienteLocal;

      // 1. Se for link público, busca o Paciente pelo token na tabela 'pacientes'
      if (tokenUrl) {
        const { data: pacData } = await supabase
          .from('pacientes')
          .select('*')
          .eq('token_publico', tokenUrl)
          .maybeSingle();

        if (pacData) {
          pacienteAtual = pacData;
          setPacienteLocal(pacData);
        } else {
          setLoading(false);
          return;
        }
      }

      if (!pacienteAtual) {
        setLoading(false);
        return;
      }

      // 2. Busca do Avaliador e de Suas Configurações
      let avalData = null;

      // A) Se usuário está logado no sistema
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.email) {
        const { data } = await supabase
          .from('avaliadores')
          .select('auth_id, nome_completo, instagram, empresa, logomarca_url, video_url_padrao')
          .eq('email', authData.user.email)
          .maybeSingle();
        avalData = data;
      }

      // B) Se for Link Público do Paciente (sem login ativo)
      if (!avalData && pacienteAtual.id_avaliador) {
        const { data } = await supabase
          .from('avaliadores')
          .select('auth_id, nome_completo, instagram, empresa, logomarca_url, video_url_padrao')
          .eq('auth_id', pacienteAtual.id_avaliador)
          .maybeSingle();
        avalData = data;
      }

      if (avalData) {
        setAvaliador(avalData);

        // 3. BUSCA AS CONFIGURAÇÕES DE VISIBILIDADE DO AVALIADOR
        if (avalData.auth_id) {
          const { data: configData } = await supabase
            .from('configuracoes_avaliador')
            .select('visibilidade_publica, dark_mode, cor_primaria')
            .eq('auth_id', avalData.auth_id)
            .maybeSingle();

          if (isPublicView && configData) {
            setDarkMode(!!configData.dark_mode);
            if (configData.cor_primaria) setCorPrimaria(configData.cor_primaria);
          }

          if (configData?.visibilidade_publica) {
            setConfigVisibilidade(configData.visibilidade_publica);
          } else {
            setConfigVisibilidade({});
          }
        }
      }

      // 4. Busca Avaliações
      const { data: avaliacoes, error: errAvaliacoes } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('id_paciente', pacienteAtual.id)
        .order('data_avaliacao', { ascending: true })

      if (errAvaliacoes) {
        console.error(errAvaliacoes)
        setLoading(false)
        return
      }

      // 5. Busca Cálculos
      const { data: calculos, error: errCalc } = await supabase
        .from('dados_calculados')
        .select('*')
        .eq('id_paciente', pacienteAtual.id)

      if (errCalc) console.error(errCalc)

      let calcIdade = 25
      if (pacienteAtual?.data_nascimento) {
        const birthDate = new Date(pacienteAtual.data_nascimento + 'T12:00:00')
        const evalDate = new Date()
        calcIdade = evalDate.getFullYear() - birthDate.getFullYear()
        const m = evalDate.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && evalDate.getDate() < birthDate.getDate())) calcIdade--
      }

      // 6. Mescla e Formata os Dados
      const dadosMesclados = (avaliacoes || []).map((aval, index) => {
        const calc = calculos?.find(c => c.id_avaliacao === aval.id) || {}

        // Fallback dinâmico para apVAT
        let apvatCalculado = 0
        if (calc.area_previsao_visceral_apvat && Number(calc.area_previsao_visceral_apvat) > 0) {
          apvatCalculado = Number(calc.area_previsao_visceral_apvat)
        } else {
          const pCintura = Number(aval.perimetro_cintura || 0)
          const pCoxaMax = Number(aval.perimetro_coxa_maxima || 0)
          const pesoVal = Number(aval.peso_paciente || 0)
          const alturaVal = Number(aval.altura_paciente || 0)

          if (pCintura > 0 && pCoxaMax > 0) {
            if (pacienteAtual.sexo === 'M') {
              apvatCalculado = (6 * pCintura) - (4.41 * pCoxaMax) + (1.19 * calcIdade) - 213.65
            } else {
              const imcVal = (alturaVal > 0) ? pesoVal / Math.pow(alturaVal / 100, 2) : 0
              apvatCalculado = (2.15 * pCintura) - (3.63 * pCoxaMax) + (1.46 * calcIdade) + (6.22 * imcVal) - 92.713
            }
            apvatCalculado = Math.max(0, apvatCalculado)
          }
        }

        return {
          id: aval.id,
          video_url: aval.video_url,
          nome_avaliacao: `Av. ${index + 1}`,
          dataStr_curta: new Date(aval.data_avaliacao).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }),
          dataStr: new Date(aval.data_avaliacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
          cor: coresAvaliacoes[index % coresAvaliacoes.length],
          token_publico: aval.token_publico,

          estatura: Number(aval.altura_paciente || 0),
          peso: Number(aval.peso_paciente || 0).toFixed(1),
          imc: Number(calc.imc || 0).toFixed(2),
          gordura_perc: Number(aval.percentual_de_gordura || 0).toFixed(1),
          massa_gorda: Number(calc.massa_gorda || 0).toFixed(2),
          massa_magra: Number(calc.massa_magra || 0).toFixed(2),
          massa_muscular: Number(calc.massa_muscular || 0).toFixed(2),

          braco_rel: Number(aval.perimetro_braco_relaxado || 0).toFixed(1),
          braco_cont: Number(aval.perimetro_braco_contraido || 0).toFixed(1),
          antibraco: Number(aval.perimetro_antibraco || 0).toFixed(1),
          cintura: Number(aval.perimetro_cintura || 0).toFixed(1),
          perim_abdominal: Number(aval.perimetro_abdominal || 0).toFixed(1),
          quadril: Number(aval.perimetro_quadril || 0).toFixed(1),
          coxa_max: Number(aval.perimetro_coxa_maxima || 0).toFixed(1),
          coxa_med: Number(aval.perimetro_coxa_media || 0).toFixed(1),
          perim_panturrilha: Number(aval.perimetro_panturrilha || 0).toFixed(1),

          perim_corrigido_braco: Number(calc.perimetro_corrigido_braco || 0).toFixed(1),
          perim_corrigido_coxa: Number(calc.perimetro_corrigido_coxa || 0).toFixed(1),
          perim_corrigido_panturrilha: Number(calc.perimetro_corrigido_panturrilha || 0).toFixed(1),

          cintura_estatura: Number(calc.relacao_cintura_estatura || 0).toFixed(2),
          cintura_quadril: Number(calc.relacao_cintura_quadril || 0).toFixed(2),
          imo: Number(calc.indice_massa_ossea_imo || 0).toFixed(3),
          apvat: Number(apvatCalculado).toFixed(1),
          conicidade: calcularIndiceConicidade(aval.peso_paciente, aval.altura_paciente, aval.perimetro_cintura).toFixed(2),
          iam: Number(calc.indice_adiposo_muscular || 0).toFixed(2),

          triceps: Number(aval.dobra_cutanea_triceps || 0).toFixed(1),
          subescapular: Number(aval.dobra_cutanea_subescapular || 0).toFixed(1),
          biceps: Number(aval.dobra_cutanea_biceps || 0).toFixed(1),
          crista_iliaca: Number(aval.dobra_cutanea_crista_iliaca || 0).toFixed(1),
          supraespinhal: Number(aval.dobra_cutanea_supraespinhal || 0).toFixed(1),
          abdominal: Number(aval.dobra_cutanea_abdominal || 0).toFixed(1),
          coxa: Number(aval.dobra_cutanea_coxa_media || 0).toFixed(1),
          panturrilha: Number(aval.dobra_cutanea_panturrilha || 0).toFixed(1),

          soma_6: Number(calc.somatorio_6_dobras || 0).toFixed(1),
          soma_8: Number(calc.somatorio_8_dobras || 0).toFixed(1),

          endo: Number(calc.somatotipo_endomorfia || 0).toFixed(1),
          meso: Number(calc.somatotipo_mesomorfia || 0).toFixed(1),
          ecto: Number(calc.somatotipo_ectomorfia || 0).toFixed(1),

          grafico_peso: Number(aval.peso_paciente || 0),
          grafico_gordura: Number(aval.percentual_de_gordura || 0),
          grafico_massa_muscular: Number(calc.massa_muscular || 0),
          grafico_massa_gorda: Number(calc.massa_gorda || 0),
          grafico_cintura: Number(aval.perimetro_cintura || 0),
          grafico_quadril: Number(aval.perimetro_quadril || 0),
          grafico_braco_cont: Number(aval.perimetro_braco_contraido || 0),
          grafico_soma_6: Number(calc.somatorio_6_dobras || 0),
          grafico_soma_8: Number(calc.somatorio_8_dobras || 0),
          grafico_perim_corr_braco: Number(calc.perimetro_corrigido_braco || 0),
          grafico_perim_corr_coxa: Number(calc.perimetro_corrigido_coxa || 0),
          grafico_perim_corr_panturrilha: Number(calc.perimetro_corrigido_panturrilha || 0),
          eixo_x: Number(calc.somatocarta_eixo_x || 0),
          eixo_y: Number(calc.somatocarta_eixo_y || 0),

          peso_alvo: calc.peso_alvo ? Number(calc.peso_alvo) : null,
          meta_bf_percentual: calc.meta_bf_percentual ? Number(calc.meta_bf_percentual) : null
        }
      }).filter(item => item.grafico_peso > 0)

      setHistorico(dadosMesclados)
      setLoading(false)
    }

    carregarDados()
  }, [tokenUrl])

  if (loading) return <div className="p-8 text-center text-primary-600 font-bold">Processando evolução...</div>

  if (!pacienteLocal) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">Nenhum paciente selecionado ou Link Inválido</h2>
        {!isPublicView && <button onClick={() => navigate('/pacientes')} className="px-6 py-2 bg-primary-600 text-white rounded-lg">Ir para Pacientes</button>}
      </div>
    )
  }

  if (historico.length < 2) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow border border-gray-100 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-2">Evolução Incompleta</h2>
          <p className="text-gray-500 dark:text-slate-400">O paciente possui apenas {historico.length} avaliação registrada. São necessárias pelo menos 2 avaliações no sistema para gerar o comparativo temporal.</p>
          {!isPublicView && <button onClick={() => navigate('/pacientes')} className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700">Voltar</button>}
        </div>
      </div>
    )
  }

  const ultimaAvaliacao = historico[historico.length - 1]
  const urlVideoRaw = ultimaAvaliacao?.video_url || avaliador?.video_url_padrao
  const videoEmbedUrl = obterUrlEmbedYouTube(urlVideoRaw)

  const podeExibir = (chave) => {
    if (!configVisibilidade) return true;

    const idPaciente = pacienteLocal?.id;

    if (idPaciente && configVisibilidade.pacientes?.[idPaciente]?.[chave] !== undefined) {
      return configVisibilidade.pacientes[idPaciente][chave];
    }

    if (configVisibilidade[chave] !== undefined) {
      return configVisibilidade[chave] !== false;
    }

    return true;
  }

  let idade = '-'
  if (pacienteLocal?.data_nascimento) {
    const birthDate = new Date(pacienteLocal.data_nascimento + 'T12:00:00')
    const evalDate = new Date()
    idade = evalDate.getFullYear() - birthDate.getFullYear()
    const m = evalDate.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && evalDate.getDate() < birthDate.getDate())) idade--
  }
  const ultimaEstatura = historico[historico.length - 1]?.estatura || 0

  const CardEvolucao = ({ titulo, chaveDado, unidade = "", isInverso = false, chaveVisibilidade, casasDecimais = 1 }) => {
    if (!podeExibir(chaveVisibilidade)) return null;

    const totalAvaliacoes = historico.length;
    const primeiraAv = Number(historico[0][chaveDado]);
    const ultimaAv = Number(historico[totalAvaliacoes - 1][chaveDado]);
    const temDeltaTotal = primeiraAv > 0 && ultimaAv > 0;
    const deltaTotal = temDeltaTotal ? (ultimaAv - primeiraAv).toFixed(casasDecimais) : null;

    const isVertical = totalAvaliacoes >= 3;

    const renderBadge = (diferenca, extraClasses = "") => {
      if (Number(diferenca) === 0) return <div className={`text-[11px] text-gray-500 dark:text-slate-300 font-bold bg-gray-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-gray-100 dark:border-slate-700 ${extraClasses}`}>(0)</div>;
      const isPositivo = diferenca > 0;
      const isBom = isInverso ? !isPositivo : isPositivo;
      const corBadge = isBom ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-900/40' : 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 dark:bg-red-900/20 border-red-100 dark:border-red-900/40';
      return (
        <div className={`flex items-center justify-center px-1.5 py-0.5 rounded-md border text-[11px] font-bold ${corBadge} ${extraClasses}`}>
          {isPositivo ? '↑' : '↓'} {Math.abs(diferenca).toFixed(casasDecimais)}
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm flex flex-col min-w-0 w-full overflow-hidden break-inside-avoid">
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-gray-600 dark:text-slate-400 font-black text-xs uppercase tracking-wider truncate">{titulo}</h4>
            {unidade && <span className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold mt-1 inline-block">{unidade}</span>}
          </div>
          {totalAvaliacoes >= 2 && temDeltaTotal && (
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[10px] uppercase text-gray-500 dark:text-slate-300 font-bold mb-0.5">Delta Total</span>
              {renderBadge(deltaTotal)}
            </div>
          )}
        </div>

        {isVertical ? (
          <div className="flex flex-col gap-2 w-full mt-2">
            {historico.map((av, idx) => {
              const valorAtual = Number(av[chaveDado]);
              let deltaUI = null;
              if (idx > 0) {
                const valorAnterior = Number(historico[idx - 1][chaveDado]);
                if (valorAtual > 0 && valorAnterior > 0) {
                  const diferenca = (valorAtual - valorAnterior);
                  deltaUI = renderBadge(diferenca);
                }
              }
              return (
                <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-slate-800/60 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700 p-2.5 rounded-lg w-full">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col min-w-[50px]">
                      <span className="text-[11px] font-bold uppercase" style={{ color: av.cor }}>{av.nome_avaliacao}</span>
                      <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">{av.dataStr_curta}</span>
                    </div>
                    <span className="text-base font-black text-gray-800 dark:text-slate-100">{valorAtual > 0 ? valorAtual.toFixed(casasDecimais) : '-'}</span>
                  </div>
                  {deltaUI && <div>{deltaUI}</div>}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            {historico.map((av, idx) => {
              const valorAtual = Number(av[chaveDado]);
              let deltaUI = null;
              if (idx > 0) {
                const valorAnterior = Number(historico[idx - 1][chaveDado]);
                if (valorAtual > 0 && valorAnterior > 0) {
                  const diferenca = (valorAtual - valorAnterior);
                  deltaUI = renderBadge(diferenca, "ml-1");
                }
              }
              return (
                <div key={idx} className="flex items-center flex-1">
                  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 dark:bg-slate-800/60 dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700 w-full min-w-[70px]">
                    <div className="flex flex-col items-center mb-1">
                      <span className="text-[11px] font-bold uppercase" style={{ color: av.cor }}>{av.nome_avaliacao}</span>
                      <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">{av.dataStr_curta}</span>
                    </div>
                    <span className="text-lg font-black text-gray-800 dark:text-slate-100">{valorAtual > 0 ? valorAtual.toFixed(casasDecimais) : '-'}</span>
                  </div>
                  {deltaUI}
                  {idx < historico.length - 1 && <div className="w-4 h-[1px] bg-gray-200 dark:bg-slate-700 mx-1 shrink-0"></div>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const BarChartSomatotipo = () => {
    const maxVal = 12;

    const renderBlocoBarras = (titulo, chaveDado, corBarra) => (
      <div className="flex flex-col gap-3 mb-6 last:mb-0">
        <h5 className="text-xs font-bold" style={{ color: corBarra }}>{titulo}</h5>
        <div className="space-y-2">
          {historico.map((av, idx) => {
            const val = Number(av[chaveDado]);
            const pct = Math.min((val / maxVal) * 100, 100);

            return (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-8 text-[10px] font-bold text-right" style={{ color: av.cor }}>{av.nome_avaliacao}</span>
                <div className="flex-1 bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex items-center">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: corBarra }}></div>
                </div>
                <span className="w-6 text-right text-xs font-black text-gray-800 dark:text-slate-100">{val.toFixed(1)}</span>
              </div>
            )
          })}
        </div>
      </div>
    )

    return (
      <div className="flex flex-col w-full mt-2">
        {renderBlocoBarras('Endomorfia (Adiposidade)', 'endo', '#f97316')}
        {renderBlocoBarras('Mesomorfia (Musculosidade)', 'meso', '#3b82f6')}
        {renderBlocoBarras('Ectomorfia (Magreza / Linearidade)', 'ecto', '#10b981')}
      </div>
    )
  }

  // Progresso da meta definida numa avaliação, comparado com o resultado real da seguinte.
  const calcularProgressoMeta = (inicial, alvo, atual) => {
    const totalPlanejado = alvo - inicial;
    if (!totalPlanejado) return null;
    const alcancado = atual - inicial;
    return {
      totalPlanejado,
      alcancado,
      progressoPct: (alcancado / totalPlanejado) * 100,
      isGanho: totalPlanejado > 0
    };
  };

  const renderLinhaMeta = (titulo, unidade, inicial, alvo, atual, progresso, casasDecimais = 1, onExcluir = null, excluindo = false) => {
    const superou = progresso.progressoPct > 100;
    const seAfastou = progresso.alcancado !== 0 && Math.sign(progresso.alcancado) !== Math.sign(progresso.totalPlanejado);
    const pctBarra = Math.max(4, Math.min(100, progresso.progressoPct));

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-gray-700 dark:text-slate-300 uppercase tracking-wider">{titulo}</span>
            {onExcluir && (
              <button
                onClick={onExcluir}
                disabled={excluindo}
                title={`Excluir meta de ${titulo}`}
                className="text-gray-300 hover:text-red-600 dark:text-slate-600 dark:hover:text-red-400 transition-colors disabled:opacity-40 shrink-0"
              >
                {excluindo ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                )}
              </button>
            )}
          </div>
          <span className={`text-xs font-bold ${superou ? 'text-emerald-600 dark:text-emerald-400' : seAfastou ? 'text-red-600 dark:text-red-400' : 'text-primary-700 dark:text-primary-400'}`}>
            {superou ? '🎉 Meta superada' : seAfastou ? 'Se afastou da meta' : `${Math.max(0, progresso.progressoPct).toFixed(0)}%`}
          </span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${seAfastou ? 'bg-red-500' : 'bg-primary-600'}`} style={{ width: `${seAfastou ? 4 : pctBarra}%` }}></div>
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 dark:text-slate-400 font-medium">
          <span>Inicial: <strong className="text-gray-800 dark:text-slate-100">{Number(inicial).toFixed(casasDecimais)}{unidade}</strong></span>
          <span>Meta: <strong className="text-gray-800 dark:text-slate-100">{Number(alvo).toFixed(casasDecimais)}{unidade}</strong></span>
          <span>Atual: <strong className="text-gray-800 dark:text-slate-100">{Number(atual).toFixed(casasDecimais)}{unidade}</strong></span>
        </div>
        <p className="text-[11px] text-gray-600 dark:text-slate-300">
          {seAfastou
            ? <>Se afastou <strong>{Math.abs(progresso.alcancado).toFixed(casasDecimais)}{unidade}</strong> da meta (planejado: {Math.abs(progresso.totalPlanejado).toFixed(casasDecimais)}{unidade}).</>
            : <>{progresso.isGanho ? 'Ganhou' : 'Perdeu'} <strong>{Math.abs(progresso.alcancado).toFixed(casasDecimais)}{unidade}</strong> de <strong>{Math.abs(progresso.totalPlanejado).toFixed(casasDecimais)}{unidade}</strong> planejados.</>
          }
        </p>
      </div>
    );
  };

  const handleExcluirMeta = async (idAvaliacaoMeta, campo) => {
    const rotulo = campo === 'peso_alvo' ? 'de Peso' : campo === 'meta_bf_percentual' ? 'de % Gordura' : '';
    if (!window.confirm(`Excluir a meta ${rotulo} definida nesta avaliação? Isso não afeta as medidas registradas.`)) return;

    const excluirId = `${idAvaliacaoMeta}:${campo}`;
    setExcluindoMetaId(excluirId);
    const { error } = await supabase
      .from('dados_calculados')
      .update({ [campo]: null })
      .eq('id_avaliacao', idAvaliacaoMeta);
    setExcluindoMetaId(null);

    if (error) {
      alert('Erro ao excluir a meta: ' + error.message);
      return;
    }

    setHistorico(prev => prev.map(av => av.id === idAvaliacaoMeta ? { ...av, [campo]: null } : av));
  };

  const MetaProgressoCard = ({ avMeta, avAtual }) => {
    const progressoPeso = avMeta.peso_alvo ? calcularProgressoMeta(Number(avMeta.peso), avMeta.peso_alvo, Number(avAtual.peso)) : null;
    const progressoBf = avMeta.meta_bf_percentual ? calcularProgressoMeta(Number(avMeta.gordura_perc), avMeta.meta_bf_percentual, Number(avAtual.gordura_perc)) : null;

    if (!progressoPeso && !progressoBf) return null;

    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-4 shadow-sm flex flex-col gap-4 w-full">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2 flex-wrap gap-1">
          <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">Meta de {avMeta.dataStr_curta}</span>
          <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">→ Avaliação de {avAtual.dataStr_curta}</span>
        </div>
        {progressoPeso && renderLinhaMeta(
          'Peso', ' kg', avMeta.peso, avMeta.peso_alvo, avAtual.peso, progressoPeso, 1,
          isPublicView ? null : () => handleExcluirMeta(avMeta.id, 'peso_alvo'),
          excluindoMetaId === `${avMeta.id}:peso_alvo`
        )}
        {progressoBf && renderLinhaMeta(
          '% Gordura', '%', avMeta.gordura_perc, avMeta.meta_bf_percentual, avAtual.gordura_perc, progressoBf, 1,
          isPublicView ? null : () => handleExcluirMeta(avMeta.id, 'meta_bf_percentual'),
          excluindoMetaId === `${avMeta.id}:meta_bf_percentual`
        )}
      </div>
    );
  };

  const paresComMeta = historico.slice(1).map((av, i) => ({ avMeta: historico[i], avAtual: av }))
    .filter(p => p.avMeta.peso_alvo || p.avMeta.meta_bf_percentual);

  const exibeBlocoComposicao = podeExibir('evo_peso') || podeExibir('evo_gordura_perc') || podeExibir('evo_massa_gorda') || podeExibir('evo_massa_muscular') || podeExibir('evo_massa_magra') || podeExibir('evo_imc');
  const exibeBlocoDobras = podeExibir('evo_dobra_triceps') || podeExibir('evo_dobra_subescapular') || podeExibir('evo_dobra_biceps') || podeExibir('evo_dobra_crista_iliaca') || podeExibir('evo_dobra_supraespinhal') || podeExibir('evo_dobra_abdominal') || podeExibir('evo_dobra_coxa') || podeExibir('evo_dobra_panturrilha');
  const exibeBlocoPerimetros = podeExibir('evo_perim_braco_rel') || podeExibir('evo_perim_braco_cont') || podeExibir('evo_perim_antibraco') || podeExibir('evo_perim_cintura') || podeExibir('evo_perim_abdominal') || podeExibir('evo_perim_quadril') || podeExibir('evo_perim_coxa_max') || podeExibir('evo_perim_coxa_med') || podeExibir('evo_perim_panturrilha');
  const exibeBlocoIndices = podeExibir('evo_idx_cintura_estatura') || podeExibir('evo_idx_rcq') || podeExibir('evo_idx_apvat') || podeExibir('evo_idx_iam') || podeExibir('evo_idx_imo') || podeExibir('evo_idx_conicidade');

  const exibeGraficoPerimetrosCriticos = podeExibir('evo_perim_cintura') || podeExibir('evo_perim_quadril') || podeExibir('evo_perim_braco_cont');
  const exibeGraficoSomatorios = podeExibir('evo_soma_6') || podeExibir('evo_soma_8');

  // Pega dados da última avaliação para o resumo das classificações
  const ultimoSoma6 = Number(historico[historico.length - 1]?.soma_6 || 0);
  const infoArgorefEvolucao = classificarArgoref(ultimoSoma6, pacienteLocal?.sexo);

  const ultimoApVat = Number(historico[historico.length - 1]?.apvat || 0);
  const infoApVatEvolucao = classificarApVat(ultimoApVat, pacienteLocal?.sexo);

  const ultimaConicidade = Number(historico[historico.length - 1]?.conicidade || 0);
  const infoConicidadeEvolucao = classificarConicidade(ultimaConicidade, pacienteLocal?.sexo);

  const ultimoImo = Number(historico[historico.length - 1]?.imo || 0);
  const infoImoEvolucao = classificarImo(ultimoImo, pacienteLocal?.sexo);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-10 pb-12 px-4 sm:px-6 overflow-x-hidden animate-fade-in-up print:m-0 print:p-0 print:overflow-visible">

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: #fff !important; }
          .shadow-sm { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
          .break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      {/* --- CABEÇALHO PROFISSIONAL --- */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col gap-6 w-full min-w-0 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 dark:border-slate-800 pb-4 gap-4 w-full">
          <div className="flex items-center gap-4">
            {avaliador?.logomarca_url ? (
              <img src={avaliador.logomarca_url} alt="Logo" className="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 font-black text-xl shrink-0">
                {avaliador?.nome_completo ? avaliador.nome_completo.charAt(0) : 'A'}
              </div>
            )}
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wide truncate">{avaliador?.empresa || 'Consultório'}</span>
              <span className="text-xs text-gray-500 dark:text-slate-400 truncate">Avaliador(a): <span className="font-bold text-gray-700 dark:text-slate-300">{avaliador?.nome_completo || '-'}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0">
            <span className="text-[10px] text-gray-400 dark:text-slate-400 font-medium tracking-wide">
              Gerado via <a href="https://evaluaos.nutricaocommarco.com.br" target="_blank" rel="noopener noreferrer" className="font-bold text-primary-600 hover:underline">EvaluaOS</a>
            </span>

            {!isPublicView && (
              <button onClick={() => navigate('/pacientes')} className="px-4 py-2 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">
                Voltar
              </button>
            )}
          </div>
        </div>

        <div className="w-full min-w-0">
          <h2 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Evolução Antropométrica de</h2>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100 uppercase tracking-tight break-words break-all sm:break-normal">
            {pacienteLocal?.nome_completo}
          </h2>

          <div className="flex flex-wrap gap-x-6 gap-y-4 mt-5 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-800 w-full">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider">Idade</span>
              <span className="text-sm font-black text-gray-700 dark:text-slate-300">{idade} anos</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider">Sexo</span>
              <span className="text-sm font-black text-gray-700 dark:text-slate-300">{pacienteLocal?.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider">Estatura</span>
              <span className="text-sm font-black text-gray-700 dark:text-slate-300">{ultimaEstatura > 0 ? `${ultimaEstatura} cm` : '-'}</span>
            </div>
            {pacienteLocal?.ocupacao && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider">Ocupação</span>
                <span className="text-sm font-black text-gray-700 dark:text-slate-300">{pacienteLocal.ocupacao}</span>
              </div>
            )}
            {pacienteLocal?.etnia && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider">Etnia</span>
                <span className="text-sm font-black text-gray-700 dark:text-slate-300">{pacienteLocal.etnia}</span>
              </div>
            )}
            {pacienteLocal?.nacionalidade && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-wider">Nação</span>
                <span className="text-sm font-black text-gray-700 dark:text-slate-300 truncate max-w-[120px]">{pacienteLocal.nacionalidade}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BLOCO 1: Composição Corporal Cards */}
      {exibeBlocoComposicao && (
        <div className="break-inside-avoid w-full">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            </div>
            <h3 className="text-lg font-black text-gray-800 dark:text-slate-100">Composição Corporal</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full min-w-0">
            <CardEvolucao titulo="Massa Corporal (Peso)" chaveDado="peso" unidade="kg" isInverso={true} chaveVisibilidade="evo_peso" />
            <CardEvolucao titulo="Gordura Corporal" chaveDado="gordura_perc" unidade="%" isInverso={true} chaveVisibilidade="evo_gordura_perc" />
            <CardEvolucao titulo="Massa de Gordura" chaveDado="massa_gorda" unidade="kg" isInverso={true} chaveVisibilidade="evo_massa_gorda" />
            <CardEvolucao titulo="Massa Muscular" chaveDado="massa_muscular" unidade="kg" isInverso={false} chaveVisibilidade="evo_massa_muscular" />
            <CardEvolucao titulo="Massa Magra" chaveDado="massa_magra" unidade="kg" isInverso={false} chaveVisibilidade="evo_massa_magra" />
            <CardEvolucao titulo="IMC" chaveDado="imc" unidade="kg/m²" isInverso={true} chaveVisibilidade="evo_imc" />
          </div>
        </div>
      )}

      {/* BLOCO 1.5: Metas & Progresso */}
      {podeExibir('evo_metas') && paresComMeta.length > 0 && (
        <div className="break-inside-avoid w-full">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
              <span>🎯</span>
            </div>
            <h3 className="text-lg font-black text-gray-800 dark:text-slate-100">Metas & Progresso</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
            {paresComMeta.map((p, idx) => (
              <MetaProgressoCard key={idx} avMeta={p.avMeta} avAtual={p.avAtual} />
            ))}
          </div>
        </div>
      )}

      {/* BLOCO 2: Gráficos Visuais */}
      {(podeExibir('evo_grafico_massa') || podeExibir('evo_grafico_gordura') || podeExibir('evo_grafico_somatocarta')) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 break-inside-avoid w-full min-w-0">
          {podeExibir('evo_grafico_massa') && (
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col min-w-0 w-full overflow-hidden">
              <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-wider mb-6">Composição (kg)</h3>
              <div className="w-full h-[280px] relative">
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historico} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="nome_avaliacao" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line type="monotone" name="Peso Total" dataKey="grafico_peso" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" name="M. Muscular" dataKey="grafico_massa_muscular" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" name="M. Gorda" dataKey="grafico_massa_gorda" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {podeExibir('evo_grafico_gordura') && (
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col min-w-0 w-full overflow-hidden">
              <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-wider mb-6">Evolução % de Gordura</h3>
              <div className="w-full h-[280px] relative">
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historico} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="nome_avaliacao" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`${value}%`, '% Gordura']} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line type="monotone" name="% Gordura" dataKey="grafico_gordura" stroke="#ef4444" strokeWidth={4} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {podeExibir('evo_grafico_somatocarta') && (
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-between min-w-0 w-full overflow-hidden">
              <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-wider w-full text-left mb-4">Trajetória do Somatotipo</h3>

              <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square bg-[#f8fafc] rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden mt-2">
                <div className="absolute inset-y-0 left-1/2 w-px border-l border-dashed border-gray-300"></div>
                <div className="absolute inset-x-0 top-1/2 h-px border-t border-dashed border-gray-300"></div>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polygon points="50,15 15,85 85,85" fill="none" stroke="#94a3b8" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                </svg>
                <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-black text-blue-600">MESOMORFIA</span>
                <span className="absolute bottom-4 left-4 text-[9px] font-black text-orange-600">ENDOMORFIA</span>
                <span className="absolute bottom-4 right-4 text-[9px] font-black text-primary-600">ECTOMORFIA</span>

                {historico.map((av, idx) => {
                  const leftPos = ((av.eixo_x + 10) / 20) * 100;
                  const topPos = ((10 - av.eixo_y) / 20) * 100;
                  const safeLeft = Math.max(5, Math.min(95, leftPos));
                  const safeTop = Math.max(5, Math.min(95, topPos));

                  return (
                    <div 
                      key={idx} 
                      className="absolute w-4 h-4 rounded-full -ml-2 -mt-2 shadow-sm border-2 border-white transition-transform hover:scale-125 z-10" 
                      style={{ left: `${safeLeft}%`, top: `${safeTop}%`, backgroundColor: av.cor }}
                      title={`${av.nome_avaliacao} - X(${av.eixo_x}) Y(${av.eixo_y})`}
                    />
                  )
                })}
              </div>

              <div className="mt-4 w-full flex flex-wrap justify-center gap-2">
                {historico.map((av, idx) => (
                  <div key={idx} className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-slate-400 font-medium bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded border border-gray-100 dark:border-slate-800">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: av.cor }}></div>
                    <span className="truncate max-w-[60px]">{av.nome_avaliacao}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* BARRAS DO SOMATOTIPO INDIVIDUAL */}
      {podeExibir('evo_grafico_barras_somatotipo') && (
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col break-inside-avoid min-w-0 w-full overflow-hidden">
          <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-wider w-full text-left mb-6">Evolução dos Componentes do Somatotipo</h3>
          <BarChartSomatotipo />
        </div>
      )}

      {/* BLOCO 3: Circunferências / Perímetros */}
      {exibeBlocoPerimetros && (
        <div className="break-inside-avoid w-full space-y-6">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"></path><path d="M2 12h20"></path></svg>
            </div>
            <h3 className="text-lg font-black text-gray-800 dark:text-slate-100">Circunferências (Perímetros)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
            <CardEvolucao titulo="Braço Relaxado" chaveDado="braco_rel" unidade="cm" isInverso={false} chaveVisibilidade="evo_perim_braco_rel" />
            <CardEvolucao titulo="Braço Contraído" chaveDado="braco_cont" unidade="cm" isInverso={false} chaveVisibilidade="evo_perim_braco_cont" />
            <CardEvolucao titulo="Antebraço" chaveDado="antibraco" unidade="cm" isInverso={false} chaveVisibilidade="evo_perim_antibraco" />
            <CardEvolucao titulo="Cintura" chaveDado="cintura" unidade="cm" isInverso={true} chaveVisibilidade="evo_perim_cintura" />
            <CardEvolucao titulo="Abdominal" chaveDado="perim_abdominal" unidade="cm" isInverso={true} chaveVisibilidade="evo_perim_abdominal" />
            <CardEvolucao titulo="Quadril" chaveDado="quadril" unidade="cm" isInverso={true} chaveVisibilidade="evo_perim_quadril" />
            <CardEvolucao titulo="Coxa Máxima" chaveDado="coxa_max" unidade="cm" isInverso={false} chaveVisibilidade="evo_perim_coxa_max" />
            <CardEvolucao titulo="Coxa Média" chaveDado="coxa_med" unidade="cm" isInverso={false} chaveVisibilidade="evo_perim_coxa_med" />
            <CardEvolucao titulo="Panturrilha" chaveDado="perim_panturrilha" unidade="cm" isInverso={false} chaveVisibilidade="evo_perim_panturrilha" />
          </div>

          {exibeGraficoPerimetrosCriticos && (
            <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col min-w-0 w-full overflow-hidden">
              <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-wider mb-6">Comparativo de Perímetros Críticos (cm)</h3>
              <div className="w-full h-[280px] relative">
                <div className="absolute inset-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historico} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="nome_avaliacao" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val) => [`${val} cm`]} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      {podeExibir('evo_perim_cintura') && <Line type="monotone" name="Cintura" dataKey="grafico_cintura" stroke="#e11d48" strokeWidth={3} dot={{ r: 4 }} />}
                      {podeExibir('evo_perim_quadril') && <Line type="monotone" name="Quadril" dataKey="grafico_quadril" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />}
                      {podeExibir('evo_perim_braco_cont') && <Line type="monotone" name="Braço Contraído" dataKey="grafico_braco_cont" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {(podeExibir('evo_perim_braco_rel') || podeExibir('evo_perim_coxa_med') || podeExibir('evo_perim_panturrilha')) && (
            <div className="pt-4 space-y-4 border-t border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-base">💪</span>
                <h4 className="text-xs font-black text-gray-700 dark:text-slate-300 uppercase tracking-wider">Massa Muscular Regional (Perímetros Corrigidos por Dobras)</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full min-w-0">
                <CardEvolucao titulo="Braço Corrigido" chaveDado="perim_corrigido_braco" unidade="cm" isInverso={false} chaveVisibilidade="evo_perim_braco_rel" />
                <CardEvolucao titulo="Coxa Corrigida" chaveDado="perim_corrigido_coxa" unidade="cm" isInverso={false} chaveVisibilidade="evo_perim_coxa_med" />
                <CardEvolucao titulo="Panturrilha Corrigida" chaveDado="perim_corrigido_panturrilha" unidade="cm" isInverso={false} chaveVisibilidade="evo_perim_panturrilha" />
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col min-w-0 w-full overflow-hidden">
                <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-wider mb-6">Evolução do Perímetro Corrigido / Muscular (cm)</h3>
                <div className="w-full h-[280px] relative">
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historico} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="nome_avaliacao" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val) => [`${val} cm`]} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        {podeExibir('evo_perim_braco_rel') && <Line type="monotone" name="Braço Corrigido" dataKey="grafico_perim_corr_braco" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />}
                        {podeExibir('evo_perim_coxa_med') && <Line type="monotone" name="Coxa Corrigida" dataKey="grafico_perim_corr_coxa" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />}
                        {podeExibir('evo_perim_panturrilha') && <Line type="monotone" name="Panturrilha Corrigida" dataKey="grafico_perim_corr_panturrilha" stroke="#047857" strokeWidth={3} dot={{ r: 4 }} />}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BLOCO 4: Dobras Cutâneas e Somatórios */}
      {(exibeBlocoDobras || exibeGraficoSomatorios) && (
        <div className="break-inside-avoid w-full space-y-6">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h3 className="text-lg font-black text-gray-800 dark:text-slate-100">Dobras Cutâneas e Somatórios</h3>
          </div>

          {exibeBlocoDobras && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full min-w-0">
              <CardEvolucao titulo="Tríceps" chaveDado="triceps" unidade="mm" isInverso={true} chaveVisibilidade="evo_dobra_triceps" />
              <CardEvolucao titulo="Subescapular" chaveDado="subescapular" unidade="mm" isInverso={true} chaveVisibilidade="evo_dobra_subescapular" />
              <CardEvolucao titulo="Bíceps" chaveDado="biceps" unidade="mm" isInverso={true} chaveVisibilidade="evo_dobra_biceps" />
              <CardEvolucao titulo="Crista Ilíaca" chaveDado="crista_iliaca" unidade="mm" isInverso={true} chaveVisibilidade="evo_dobra_crista_iliaca" />
              <CardEvolucao titulo="Supraespinhal" chaveDado="supraespinhal" unidade="mm" isInverso={true} chaveVisibilidade="evo_dobra_supraespinhal" />
              <CardEvolucao titulo="Abdominal" chaveDado="abdominal" unidade="mm" isInverso={true} chaveVisibilidade="evo_dobra_abdominal" />
              <CardEvolucao titulo="Coxa Média" chaveDado="coxa" unidade="mm" isInverso={true} chaveVisibilidade="evo_dobra_coxa" />
              <CardEvolucao titulo="Panturrilha" chaveDado="panturrilha" unidade="mm" isInverso={true} chaveVisibilidade="evo_dobra_panturrilha" />
            </div>
          )}

          {exibeGraficoSomatorios && (
            <>
              <div className="flex items-center gap-4 my-8">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider text-center px-2">Somatórios Gerais</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
                <div className="space-y-3">
                  <CardEvolucao titulo="Somatório 6 Dobras" chaveDado="soma_6" unidade="mm" isInverso={true} chaveVisibilidade="evo_soma_6" />
                  
                  {/* ESCALA ARGOREF (COMPONENTE DE RESUMO NA EVOLUÇÃO) */}
                  {ultimoSoma6 > 0 && (
                    <div className="bg-emerald-50/60 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-gray-800 dark:text-slate-100">Classificação ARGOREF (Holway, 2025)</span>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400">Último somatório de 6 dobras registrado ({ultimoSoma6} mm).</p>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        infoArgorefEvolucao.cor === 'red' ? 'bg-red-100 dark:bg-red-900/30 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                        infoArgorefEvolucao.cor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                        infoArgorefEvolucao.cor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {infoArgorefEvolucao.classificacao}
                      </span>
                    </div>
                  )}
                </div>

                <CardEvolucao titulo="Somatório 8 Dobras" chaveDado="soma_8" unidade="mm" isInverso={true} chaveVisibilidade="evo_soma_8" />
              </div>

              <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col min-w-0 w-full overflow-hidden">
                <h3 className="text-sm font-black text-gray-800 dark:text-slate-100 uppercase tracking-wider mb-6">Evolução do Somatório de Dobras (mm)</h3>
                <div className="w-full h-[280px] relative">
                  <div className="absolute inset-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historico} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="nome_avaliacao" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(val) => [`${val} mm`]} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        {podeExibir('evo_soma_6') && <Line type="monotone" name="Σ 6 Dobras" dataKey="grafico_soma_6" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />}
                        {podeExibir('evo_soma_8') && <Line type="monotone" name="Σ 8 Dobras" dataKey="grafico_soma_8" stroke="#d97706" strokeWidth={3} dot={{ r: 4 }} />}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* BLOCO 5: Relações e Índices de Risco */}
      {exibeBlocoIndices && (
        <div className="break-inside-avoid w-full space-y-4">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            </div>
            <h3 className="text-lg font-black text-gray-800 dark:text-slate-100">Risco Cardiometabólico e Índices</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full min-w-0">
            <CardEvolucao titulo="Cintura / Estatura" chaveDado="cintura_estatura" isInverso={true} chaveVisibilidade="evo_idx_cintura_estatura" />
            <CardEvolucao titulo="Cintura / Quadril (RCQ)" chaveDado="cintura_quadril" isInverso={true} chaveVisibilidade="evo_idx_rcq" />
            
            <div className="space-y-3">
              <CardEvolucao titulo="Área Visceral (apVAT)" chaveDado="apvat" unidade="cm²" isInverso={true} chaveVisibilidade="evo_idx_apvat" casasDecimais={1} />
              
              {/* CLASSIFICAÇÃO APVAT DA ÚLTIMA CONSULTA */}
              {ultimoApVat > 0 && (
                <div className="bg-emerald-50/60 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-100">Risco apVAT (Samouda, 2013)</span>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">Última avaliação ({ultimoApVat} cm²).</p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                    infoApVatEvolucao.cor === 'red' ? 'bg-red-100 dark:bg-red-900/30 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                    infoApVatEvolucao.cor === 'orange' ? 'bg-orange-100 dark:bg-orange-900/30 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' :
                    infoApVatEvolucao.cor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {infoApVatEvolucao.classificacao}
                  </span>
                </div>
              )}
            </div>

            <CardEvolucao titulo="Índice Adiposo Muscular" chaveDado="iam" isInverso={true} chaveVisibilidade="evo_idx_iam" />
            <div className="space-y-3">
              <CardEvolucao titulo="Índice Massa Óssea (IMO)" chaveDado="imo" isInverso={false} chaveVisibilidade="evo_idx_imo" casasDecimais={3} />

              {ultimoImo > 0 && (
                <div className="bg-emerald-50/60 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-100">Classificação IMO (Holway)</span>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">Última avaliação ({ultimoImo.toFixed(3)}).</p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                    infoImoEvolucao.cor === 'red' ? 'bg-red-100 dark:bg-red-900/30 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                    infoImoEvolucao.cor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                    infoImoEvolucao.cor === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' :
                    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {infoImoEvolucao.classificacao}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <CardEvolucao titulo="Índice de Conicidade" chaveDado="conicidade" isInverso={true} chaveVisibilidade="evo_idx_conicidade" casasDecimais={2} />

              {ultimaConicidade > 0 && (
                <div className="bg-emerald-50/60 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-100">Risco Conicidade (Valdez, 1991)</span>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400">Última avaliação ({ultimaConicidade.toFixed(2)}).</p>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                    infoConicidadeEvolucao.cor === 'red' ? 'bg-red-100 dark:bg-red-900/30 dark:bg-red-900/20 text-red-800 dark:text-red-300' :
                    infoConicidadeEvolucao.cor === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300' :
                    'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {infoConicidadeEvolucao.classificacao}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🎥 PLAYER DE VÍDEO DO LAUDO (ÚLTIMA AVALIAÇÃO OU VÍDEO PADRÃO) */}
      {videoEmbedUrl && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3 my-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 text-primary-600 rounded-xl flex items-center justify-center font-bold text-base">
              📹
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Mensagem & Orientações em Vídeo</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Assista às explicações do seu avaliador sobre os seus resultados.</p>
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

      <div className="flex justify-end gap-2 w-full mt-6 no-print">
        <BotaoExportarEvolucaoPDF
          historico={historico}
          paciente={pacienteLocal}
          avaliador={avaliador}
          idade={idade}
          isPublicView={isPublicView}
          configVisibilidade={configVisibilidade}
        />
      </div>
    </div>
  )
}