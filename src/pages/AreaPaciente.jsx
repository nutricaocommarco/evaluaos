import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../supabaseClient'
import { useTheme } from '../contexts/ThemeContext'
import CabecalhoPortalPaciente from '../components/CabecalhoPortalPaciente'
import NavegacaoPortalPaciente from '../components/NavegacaoPortalPaciente'
import BotaoInstalarPWA from '../components/BotaoInstalarPWA'
import RelatorioCheckinPaciente from '../components/questionarios/RelatorioCheckinPaciente'
import { Utensils, TrendingUp } from 'lucide-react'
import { CHAVE_ULTIMA_AREA_PACIENTE } from '../utils/pwaAreaPaciente'

function formatarDataCurta(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// Mini-gráfico de peso — versão compacta da Evolução completa (que já tem
// gráfico próprio em EvolucaoPaciente.jsx) só pra dar um resumo visual
// aqui na home, com link pra abrir o relatório completo se quiser mais
// detalhe (dobras, perímetros, composição corporal etc).
function CardEvolucaoPeso({ historico, darkMode, onAbrirCompleto }) {
  const pesos = historico.filter((h) => h.peso_paciente != null)
  if (pesos.length < 2) return null

  const primeiro = pesos[0].peso_paciente
  const ultimo = pesos[pesos.length - 1].peso_paciente
  const delta = ultimo - primeiro

  return (
    <button
      onClick={onAbrirCompleto}
      className="w-full text-left bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={15} />
          </div>
          <p className="text-sm font-bold text-gray-800 dark:text-slate-100">Sua Evolução de Peso</p>
        </div>
        <span className={`text-xs font-bold shrink-0 ${delta < 0 ? 'text-emerald-600' : delta > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}kg
        </span>
      </div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={pesos} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#f1f5f9'} vertical={false} />
            <XAxis dataKey="data_avaliacao" tickFormatter={formatarDataCurta} tick={{ fontSize: 10, fill: darkMode ? '#64748b' : '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: darkMode ? '#64748b' : '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
            <Tooltip
              labelFormatter={formatarDataCurta}
              formatter={(v) => [`${v} kg`, 'Peso']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            />
            <Line type="monotone" dataKey="peso_paciente" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1 text-right">Ver evolução completa →</p>
    </button>
  )
}

export default function AreaPaciente() {
  const { tokenUrl } = useParams()
  const navigate = useNavigate()
  const { setDarkMode, setCorPrimaria, darkMode } = useTheme()

  const [loading, setLoading] = useState(true)
  const [paciente, setPaciente] = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [nomeAvaliador, setNomeAvaliador] = useState('')
  const [logomarcaUrl, setLogomarcaUrl] = useState('')
  const [avaliacaoRecente, setAvaliacaoRecente] = useState(null)
  const [historicoPeso, setHistoricoPeso] = useState([])
  const [qtdPlanosVisiveis, setQtdPlanosVisiveis] = useState(0)
  const [checkinsVisiveis, setCheckinsVisiveis] = useState([])
  const [qtdAgendamentosFuturos, setQtdAgendamentosFuturos] = useState(0)
  const [sessaoAtiva, setSessaoAtiva] = useState(false)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)

      const { data: authData } = await supabase.auth.getUser()
      setSessaoAtiva(!!authData?.user)

      if (!authData?.user) {
        localStorage.setItem(CHAVE_ULTIMA_AREA_PACIENTE, tokenUrl)
        const link = document.querySelector('link[rel="manifest"]')
        if (link) link.setAttribute('href', `/api/manifest?token=${tokenUrl}`)
      }

      const { data: pacData } = await supabase
        .from('pacientes')
        .select('*')
        .eq('token_publico', tokenUrl)
        .maybeSingle()

      if (!pacData) { setLoading(false); return }
      setPaciente(pacData)

      if (pacData.id_avaliador) {
        const { data: avalData } = await supabase
          .from('avaliadores')
          .select('auth_id, empresa, nome_completo, logomarca_url')
          .eq('auth_id', pacData.id_avaliador)
          .maybeSingle()

        if (avalData) {
          setNomeEmpresa(avalData.empresa || '')
          setNomeAvaliador(avalData.nome_completo || '')
          setLogomarcaUrl(avalData.logomarca_url || '')

          const { data: configData } = await supabase
            .from('configuracoes_avaliador')
            .select('dark_mode, cor_primaria')
            .eq('auth_id', avalData.auth_id)
            .maybeSingle()

          if (configData) {
            setDarkMode(pacData.tema_dark_mode != null ? pacData.tema_dark_mode : !!configData.dark_mode)
            if (configData.cor_primaria) setCorPrimaria(configData.cor_primaria)
          }
        }
      }

      const [avaliacoesRes, planoRes, checkinsRes, agendamentosRes] = await Promise.all([
        supabase
          .from('avaliacoes')
          .select('id, token_publico, data_avaliacao, peso_paciente')
          .eq('id_paciente', pacData.id)
          .eq('visivel_paciente', true)
          .order('data_avaliacao', { ascending: true }),
        supabase
          .from('planos_alimentares')
          .select('id', { count: 'exact', head: true })
          .eq('id_paciente', pacData.id)
          .eq('ativo', true),
        supabase
          .from('checkins_semanais_pacientes')
          .select('id_questionario, mostrar_grafico_paciente, questionarios(titulo)')
          .eq('id_paciente', pacData.id),
        supabase
          .from('agendamentos')
          .select('id', { count: 'exact', head: true })
          .eq('id_paciente', pacData.id)
          .eq('status', 'confirmado')
          .eq('visivel_paciente', true)
          .gte('data_inicio', new Date().toISOString()),
      ])

      const listaAvaliacoes = avaliacoesRes.data || []
      setHistoricoPeso(listaAvaliacoes)
      setAvaliacaoRecente(listaAvaliacoes[listaAvaliacoes.length - 1] || null)
      setQtdPlanosVisiveis(planoRes.count || 0)
      setCheckinsVisiveis((checkinsRes.data || []).filter((c) => c.mostrar_grafico_paciente))
      setQtdAgendamentosFuturos(agendamentosRes.count || 0)

      setLoading(false)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenUrl])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-primary-600 font-bold animate-pulse">Carregando sua área...</p>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-gray-700 dark:text-slate-300 font-semibold">Link inválido.</p>
        </div>
      </div>
    )
  }

  const nadaAindaLiberado = !avaliacaoRecente && qtdPlanosVisiveis === 0 && checkinsVisiveis.length === 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <CabecalhoPortalPaciente logomarcaUrl={logomarcaUrl} nomeEmpresa={nomeEmpresa} nomeAvaliador={nomeAvaliador} />

        {/* Sempre visível, esteja o paciente de verdade sem sessão ou o
            nutri vendo o próprio link logado — sem isso, tirar os cards
            de atalho abaixo deixaria a tela sem nenhuma navegação pro
            nutri nesse segundo caso. */}
        <NavegacaoPortalPaciente tokenPaciente={tokenUrl} tokenLaudo={avaliacaoRecente?.token_publico} temAgendamentos={qtdAgendamentosFuturos > 0} ativo="inicio" />

        {!sessaoAtiva && <BotaoInstalarPWA />}

        <div>
          <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">Olá, {paciente.nome_completo?.split(' ')[0]}!</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Aqui você acompanha tudo do seu acompanhamento nutricional.</p>
        </div>

        {nadaAindaLiberado && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm">Ainda não há nada liberado aqui — assim que seu nutricionista registrar sua primeira avaliação, plano ou orientação, aparece nesta tela.</p>
          </div>
        )}

        {qtdPlanosVisiveis > 0 && (
          <button
            onClick={() => navigate(`/area/${tokenUrl}/plano`)}
            className="w-full flex items-center gap-3 bg-primary-600 hover:bg-primary-700 transition-colors text-white p-5 rounded-xl shadow-sm text-left"
          >
            <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Utensils size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-base font-black">Plano Alimentar</p>
              <p className="text-xs text-primary-100">Ver o que você deve comer hoje</p>
            </div>
          </button>
        )}

        <CardEvolucaoPeso historico={historicoPeso} darkMode={darkMode} onAbrirCompleto={() => navigate(`/evolucao/${tokenUrl}`)} />

        {checkinsVisiveis.map((c) => (
          <RelatorioCheckinPaciente
            key={c.id_questionario}
            pacienteId={paciente.id}
            idQuestionario={c.id_questionario}
            titulo={c.questionarios?.titulo || 'Seu Check-in'}
          />
        ))}
      </div>
    </div>
  )
}
