import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useTheme } from '../contexts/ThemeContext'
import CabecalhoPortalPaciente from '../components/CabecalhoPortalPaciente'
import NavegacaoPortalPaciente from '../components/NavegacaoPortalPaciente'
import BotaoInstalarPWA from '../components/BotaoInstalarPWA'
import { TrendingUp, FileText, ClipboardList, MessageSquare, Utensils, ListChecks, FlaskConical, Calendar } from 'lucide-react'
import { CHAVE_ULTIMA_AREA_PACIENTE } from '../utils/pwaAreaPaciente'

function CardAcao({ icone: Icone, cor, titulo, subtitulo, onClick, desabilitado }) {
  return (
    <button
      onClick={onClick}
      disabled={desabilitado}
      className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-3 text-left hover:border-primary-300 dark:hover:border-primary-700 transition-colors disabled:opacity-50 disabled:hover:border-gray-100 dark:disabled:hover:border-slate-800"
    >
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${cor}`}>
        <Icone size={19} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-800 dark:text-slate-100">{titulo}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400">{subtitulo}</p>
      </div>
    </button>
  )
}

export default function AreaPaciente() {
  const { tokenUrl } = useParams()
  const navigate = useNavigate()
  const { setDarkMode, setCorPrimaria } = useTheme()

  const [loading, setLoading] = useState(true)
  const [paciente, setPaciente] = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [nomeAvaliador, setNomeAvaliador] = useState('')
  const [logomarcaUrl, setLogomarcaUrl] = useState('')
  const [avaliacaoRecente, setAvaliacaoRecente] = useState(null)
  const [qtdAvaliacoesVisiveis, setQtdAvaliacoesVisiveis] = useState(0)
  const [qtdPlanosVisiveis, setQtdPlanosVisiveis] = useState(0)
  const [qtdOrientacoes, setQtdOrientacoes] = useState(0)
  const [qtdListas, setQtdListas] = useState(0)
  const [qtdExames, setQtdExames] = useState(0)
  const [qtdAgendamentosFuturos, setQtdAgendamentosFuturos] = useState(0)
  const [qtdQuestionariosPendentes, setQtdQuestionariosPendentes] = useState(0)
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

      const [avalRes, avalCountRes, planoRes, orientRes, listasRes, questRes, solExamesRes, regExamesRes, agendamentosRes] = await Promise.all([
        supabase
          .from('avaliacoes')
          .select('id, token_publico, data_avaliacao')
          .eq('id_paciente', pacData.id)
          .eq('visivel_paciente', true)
          .order('data_avaliacao', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('avaliacoes')
          .select('id', { count: 'exact', head: true })
          .eq('id_paciente', pacData.id)
          .eq('visivel_paciente', true),
        supabase
          .from('planos_alimentares')
          .select('id', { count: 'exact', head: true })
          .eq('id_paciente', pacData.id)
          .eq('ativo', true),
        supabase
          .from('orientacoes_nutricionais')
          .select('id', { count: 'exact', head: true })
          .eq('id_paciente', pacData.id)
          .eq('visivel_paciente', true),
        supabase
          .from('listas_recomendacoes')
          .select('id', { count: 'exact', head: true })
          .eq('id_paciente', pacData.id)
          .eq('visivel_paciente', true),
        supabase
          .from('questionario_envios')
          .select('id', { count: 'exact', head: true })
          .eq('id_paciente', pacData.id)
          .eq('status', 'aguardando'),
        supabase
          .from('exames_solicitacoes')
          .select('id', { count: 'exact', head: true })
          .eq('id_paciente', pacData.id)
          .eq('visivel_paciente', true),
        supabase
          .from('exames_registros')
          .select('id', { count: 'exact', head: true })
          .eq('id_paciente', pacData.id)
          .eq('visivel_paciente', true),
        supabase
          .from('agendamentos')
          .select('id', { count: 'exact', head: true })
          .eq('id_paciente', pacData.id)
          .eq('status', 'confirmado')
          .eq('visivel_paciente', true)
          .gte('data_inicio', new Date().toISOString()),
      ])

      setAvaliacaoRecente(avalRes.data || null)
      setQtdAvaliacoesVisiveis(avalCountRes.count || 0)
      setQtdPlanosVisiveis(planoRes.count || 0)
      setQtdOrientacoes(orientRes.count || 0)
      setQtdListas(listasRes.count || 0)
      setQtdQuestionariosPendentes(questRes.count || 0)
      setQtdExames((solExamesRes.count || 0) + (regExamesRes.count || 0))
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <CabecalhoPortalPaciente logomarcaUrl={logomarcaUrl} nomeEmpresa={nomeEmpresa} nomeAvaliador={nomeAvaliador} />

        {!sessaoAtiva && (
          <NavegacaoPortalPaciente tokenPaciente={tokenUrl} tokenLaudo={avaliacaoRecente?.token_publico} temAgendamentos={qtdAgendamentosFuturos > 0} ativo="inicio" />
        )}

        {!sessaoAtiva && <BotaoInstalarPWA />}

        <div>
          <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">Olá, {paciente.nome_completo?.split(' ')[0]}!</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Aqui você acompanha tudo do seu acompanhamento nutricional.</p>
        </div>

        {!avaliacaoRecente && qtdPlanosVisiveis === 0 && qtdOrientacoes === 0 && qtdListas === 0 && qtdExames === 0 && qtdAgendamentosFuturos === 0 && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm">Ainda não há nada liberado aqui — assim que seu nutricionista registrar sua primeira avaliação, plano ou orientação, aparece nesta tela.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {avaliacaoRecente && (
            <CardAcao
              icone={TrendingUp}
              cor="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
              titulo="Evolução"
              subtitulo={qtdAvaliacoesVisiveis >= 2 ? 'Gráficos e comparativos' : 'Precisa de mais 1 avaliação'}
              desabilitado={qtdAvaliacoesVisiveis < 2}
              onClick={() => navigate(`/evolucao/${tokenUrl}`)}
            />
          )}
          {avaliacaoRecente && (
            <CardAcao
              icone={FileText}
              cor="bg-primary-50 dark:bg-primary-900/20 text-primary-600"
              titulo="Laudo Antropométrico"
              subtitulo="Ver relatório mais recente"
              onClick={() => navigate(`/laudo/${avaliacaoRecente.token_publico}`)}
            />
          )}
          {qtdPlanosVisiveis > 0 && (
            <CardAcao
              icone={Utensils}
              cor="bg-amber-50 dark:bg-amber-900/20 text-amber-600"
              titulo="Plano Alimentar"
              subtitulo={`${qtdPlanosVisiveis} plano(s) disponível(is)`}
              onClick={() => navigate(`/area/${tokenUrl}/plano`)}
            />
          )}
          {qtdOrientacoes > 0 && (
            <CardAcao
              icone={MessageSquare}
              cor="bg-violet-50 dark:bg-violet-900/20 text-violet-600"
              titulo="Orientações"
              subtitulo={`${qtdOrientacoes} orientação(ões)`}
              onClick={() => navigate(`/area/${tokenUrl}/orientacoes`)}
            />
          )}
          {qtdListas > 0 && (
            <CardAcao
              icone={ListChecks}
              cor="bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600"
              titulo="Listas de Recomendações"
              subtitulo={`${qtdListas} lista(s)`}
              onClick={() => navigate(`/area/${tokenUrl}/listas`)}
            />
          )}
          {qtdExames > 0 && (
            <CardAcao
              icone={FlaskConical}
              cor="bg-sky-50 dark:bg-sky-900/20 text-sky-600"
              titulo="Exames Laboratoriais"
              subtitulo="Pedidos e resultados"
              onClick={() => navigate(`/area/${tokenUrl}/exames`)}
            />
          )}
          {qtdAgendamentosFuturos > 0 && (
            <CardAcao
              icone={Calendar}
              cor="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600"
              titulo="Agenda"
              subtitulo={`${qtdAgendamentosFuturos} horário(s) marcado(s)`}
              onClick={() => navigate(`/area/${tokenUrl}/agenda`)}
            />
          )}
          <CardAcao
            icone={ClipboardList}
            cor="bg-rose-50 dark:bg-rose-900/20 text-rose-600"
            titulo="Questionários"
            subtitulo={qtdQuestionariosPendentes > 0 ? `${qtdQuestionariosPendentes} pendente(s)` : 'Nenhum pendente'}
            onClick={() => navigate(`/area/${tokenUrl}/questionarios`)}
          />
        </div>
      </div>
    </div>
  )
}
