import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useTheme } from '../contexts/ThemeContext'
import CabecalhoPortalPaciente from '../components/CabecalhoPortalPaciente'
import NavegacaoPortalPaciente from '../components/NavegacaoPortalPaciente'
import GraficoPesoImcPaciente from '../components/questionarios/GraficoPesoImcPaciente'

const STATUS_LABEL = {
  aguardando: 'Aguardando resposta',
  respondido: 'Respondido',
  revisado: 'Revisado',
}

const STATUS_COR = {
  aguardando: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  respondido: 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300',
  revisado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

export default function QuestionariosPaciente() {
  const { tokenUrl } = useParams()
  const navigate = useNavigate()
  const { setDarkMode, setCorPrimaria } = useTheme()

  const [loading, setLoading] = useState(true)
  const [paciente, setPaciente] = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [nomeAvaliador, setNomeAvaliador] = useState('')
  const [logomarcaUrl, setLogomarcaUrl] = useState('')
  const [envios, setEnvios] = useState([])
  const [sessaoAtiva, setSessaoAtiva] = useState(false)
  const [tokenLaudo, setTokenLaudo] = useState('')

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

      const [enviosRes, avalRes] = await Promise.all([
        supabase
          .from('questionario_envios')
          .select('*, questionarios(titulo)')
          .eq('id_paciente', pacData.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('avaliacoes')
          .select('token_publico')
          .eq('id_paciente', pacData.id)
          .order('data_avaliacao', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      setEnvios(enviosRes.data || [])
      setTokenLaudo(avalRes.data?.token_publico || '')
      setLoading(false)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenUrl])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-primary-600 font-bold animate-pulse">Carregando questionários...</p>
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
        <CabecalhoPortalPaciente
          logomarcaUrl={logomarcaUrl}
          nomeEmpresa={nomeEmpresa}
          nomeAvaliador={nomeAvaliador}
          aoVoltar={() => navigate(`/area/${tokenUrl}`)}
        />

        {!sessaoAtiva && (
          <NavegacaoPortalPaciente tokenPaciente={tokenUrl} tokenLaudo={tokenLaudo} ativo="questionarios" />
        )}

        <div>
          <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">Questionários</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{paciente.nome_completo}</p>
        </div>

        <GraficoPesoImcPaciente pacienteId={paciente.id} />

        {envios.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhum questionário por aqui ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {envios.map((envio) => (
              <div key={envio.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-800 dark:text-slate-100 truncate">{envio.questionarios?.titulo}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500">Recebido em {formatarData(envio.created_at)}</p>
                </div>
                {envio.status === 'aguardando' ? (
                  <button
                    onClick={() => navigate(`/questionario/${envio.token_publico}`)}
                    className="px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 shadow shrink-0"
                  >
                    Responder
                  </button>
                ) : (
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${STATUS_COR[envio.status]}`}>
                    {STATUS_LABEL[envio.status]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
