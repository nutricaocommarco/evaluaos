import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useTheme } from '../contexts/ThemeContext'
import CabecalhoPortalPaciente from '../components/CabecalhoPortalPaciente'
import NavegacaoPortalPaciente from '../components/NavegacaoPortalPaciente'
import BotaoInstalarPWA from '../components/BotaoInstalarPWA'
import { TrendingUp, FileText, ClipboardList, MessageSquare, Utensils } from 'lucide-react'

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
  const [temPlanoAtivo, setTemPlanoAtivo] = useState(false)
  const [qtdOrientacoes, setQtdOrientacoes] = useState(0)
  const [qtdQuestionariosPendentes, setQtdQuestionariosPendentes] = useState(0)
  const [sessaoAtiva, setSessaoAtiva] = useState(false)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)

      const { data: authData } = await supabase.auth.getUser()
      setSessaoAtiva(!!authData?.user)

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
            setDarkMode(!!configData.dark_mode)
            if (configData.cor_primaria) setCorPrimaria(configData.cor_primaria)
          }
        }
      }

      const [avalRes, planoRes, orientRes, questRes] = await Promise.all([
        supabase
          .from('avaliacoes')
          .select('id, token_publico, data_avaliacao')
          .eq('id_paciente', pacData.id)
          .order('data_avaliacao', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('planos_alimentares')
          .select('id')
          .eq('id_paciente', pacData.id)
          .eq('ativo', true)
          .maybeSingle(),
        supabase
          .from('orientacoes_nutricionais')
          .select('id', { count: 'exact', head: true })
          .eq('id_paciente', pacData.id),
        supabase
          .from('questionario_envios')
          .select('id', { count: 'exact', head: true })
          .eq('id_paciente', pacData.id)
          .eq('status', 'aguardando'),
      ])

      setAvaliacaoRecente(avalRes.data || null)
      setTemPlanoAtivo(!!planoRes.data)
      setQtdOrientacoes(orientRes.count || 0)
      setQtdQuestionariosPendentes(questRes.count || 0)

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
          <NavegacaoPortalPaciente tokenPaciente={tokenUrl} tokenLaudo={avaliacaoRecente?.token_publico} ativo="inicio" />
        )}

        {!sessaoAtiva && <BotaoInstalarPWA />}

        <div>
          <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">Olá, {paciente.nome_completo?.split(' ')[0]}!</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Aqui você acompanha tudo do seu acompanhamento nutricional.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CardAcao
            icone={TrendingUp}
            cor="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
            titulo="Evolução"
            subtitulo="Gráficos e comparativos"
            onClick={() => navigate(`/evolucao/${tokenUrl}`)}
          />
          <CardAcao
            icone={FileText}
            cor="bg-primary-50 dark:bg-primary-900/20 text-primary-600"
            titulo="Laudo Antropométrico"
            subtitulo={avaliacaoRecente ? 'Ver relatório mais recente' : 'Nenhuma avaliação ainda'}
            desabilitado={!avaliacaoRecente}
            onClick={() => avaliacaoRecente && navigate(`/laudo/${avaliacaoRecente.token_publico}`)}
          />
          <CardAcao
            icone={Utensils}
            cor="bg-amber-50 dark:bg-amber-900/20 text-amber-600"
            titulo="Plano Alimentar"
            subtitulo={temPlanoAtivo ? 'Ver plano atual' : 'Nenhum plano ativo ainda'}
            desabilitado={!temPlanoAtivo}
            onClick={() => navigate(`/area/${tokenUrl}/plano`)}
          />
          <CardAcao
            icone={MessageSquare}
            cor="bg-violet-50 dark:bg-violet-900/20 text-violet-600"
            titulo="Orientações"
            subtitulo={qtdOrientacoes > 0 ? `${qtdOrientacoes} orientação(ões)` : 'Nenhuma orientação ainda'}
            desabilitado={qtdOrientacoes === 0}
            onClick={() => navigate(`/area/${tokenUrl}/orientacoes`)}
          />
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
