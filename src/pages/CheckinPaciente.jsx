import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useTheme } from '../contexts/ThemeContext'
import CabecalhoPortalPaciente from '../components/CabecalhoPortalPaciente'
import NavegacaoPortalPaciente from '../components/NavegacaoPortalPaciente'
import RelatorioCheckinPaciente from '../components/questionarios/RelatorioCheckinPaciente'

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

// Tela dedicada de Check-in, separada de Questionários — os pendentes
// (status aguardando, ligados a algum check-in ativo) ficam no topo, com
// "Responder" levando pro formulário; ao voltar aqui depois de responder,
// o pendente já não existe mais (o status virou 'respondido' no envio,
// então a query nem traz ele de volta) — some sozinho, sem precisar de
// nenhuma lógica extra. Os gráficos ficam sempre embaixo dos pendentes.
export default function CheckinPaciente() {
  const { tokenUrl } = useParams()
  const navigate = useNavigate()
  const { setDarkMode, setCorPrimaria } = useTheme()

  const [loading, setLoading] = useState(true)
  const [paciente, setPaciente] = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [nomeAvaliador, setNomeAvaliador] = useState('')
  const [logomarcaUrl, setLogomarcaUrl] = useState('')
  const [pendentes, setPendentes] = useState([])
  const [checkinsVisiveis, setCheckinsVisiveis] = useState([])
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
            setDarkMode(pacData.tema_dark_mode != null ? pacData.tema_dark_mode : !!configData.dark_mode)
            if (configData.cor_primaria) setCorPrimaria(configData.cor_primaria)
          }
        }
      }

      const [checkinsAtivosRes, avalRes] = await Promise.all([
        supabase
          .from('checkins_semanais_pacientes')
          .select('id_questionario, mostrar_grafico_paciente, questionarios(titulo)')
          .eq('id_paciente', pacData.id),
        supabase
          .from('avaliacoes')
          .select('token_publico')
          .eq('id_paciente', pacData.id)
          .order('data_avaliacao', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      const checkinsAtivos = checkinsAtivosRes.data || []
      const idsCheckin = checkinsAtivos.map((c) => c.id_questionario)

      if (idsCheckin.length > 0) {
        const { data: enviosPendentes } = await supabase
          .from('questionario_envios')
          .select('id, id_questionario, token_publico, created_at, questionarios(titulo)')
          .eq('id_paciente', pacData.id)
          .eq('status', 'aguardando')
          .in('id_questionario', idsCheckin)
          .order('created_at', { ascending: false })

        // Um check-in recorrente pode acumular mais de um envio "aguardando"
        // (ex: reenvios manuais de teste) — só o mais recente de cada
        // questionário importa pro paciente, os outros ficam obsoletos.
        const vistos = new Set()
        const unicos = (enviosPendentes || []).filter((e) => {
          if (vistos.has(e.id_questionario)) return false
          vistos.add(e.id_questionario)
          return true
        })
        setPendentes(unicos)
      } else {
        setPendentes([])
      }

      setCheckinsVisiveis(checkinsAtivos.filter((c) => c.mostrar_grafico_paciente))
      setTokenLaudo(avalRes.data?.token_publico || '')
      setLoading(false)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenUrl])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-primary-600 font-bold animate-pulse">Carregando check-in...</p>
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
          <NavegacaoPortalPaciente tokenPaciente={tokenUrl} tokenLaudo={tokenLaudo} ativo="checkin" />
        )}

        <div>
          <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">Check-in</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{paciente.nome_completo}</p>
        </div>

        {pendentes.length > 0 && (
          <div className="space-y-3">
            {pendentes.map((envio) => (
              <div key={envio.id} className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-800 dark:text-slate-100 truncate">{envio.questionarios?.titulo}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500">Recebido em {formatarData(envio.created_at)}</p>
                </div>
                <button
                  onClick={() => navigate(`/questionario/${envio.token_publico}`)}
                  className="px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 shadow shrink-0"
                >
                  Responder
                </button>
              </div>
            ))}
          </div>
        )}

        {checkinsVisiveis.map((c) => (
          <RelatorioCheckinPaciente
            key={c.id_questionario}
            pacienteId={paciente.id}
            idQuestionario={c.id_questionario}
            titulo={c.questionarios?.titulo || 'Seu Check-in'}
          />
        ))}

        {pendentes.length === 0 && checkinsVisiveis.length === 0 && (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhum check-in por aqui no momento.</p>
          </div>
        )}
      </div>
    </div>
  )
}
