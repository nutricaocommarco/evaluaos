import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useTheme } from '../contexts/ThemeContext'
import CabecalhoPortalPaciente from '../components/CabecalhoPortalPaciente'
import NavegacaoPortalPaciente from '../components/NavegacaoPortalPaciente'
import { Calendar, MapPin, Video, CheckCircle2 } from 'lucide-react'

function formatarDataHora(dataIso) {
  return new Date(dataIso).toLocaleString('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

// Botão de confirmar só aparece depois que o lembrete do WhatsApp já foi
// mandado, ou (se por algum motivo o lembrete ainda não saiu) no máximo
// 48h antes da consulta — evita o paciente confirmar presença dias
// antes, quando ainda pode mudar de ideia.
function podeConfirmar(agendamento) {
  if (agendamento.whatsapp_lembrete_enviado_em) return true
  const horasAteConsulta = (new Date(agendamento.data_inicio) - new Date()) / 3600000
  return horasAteConsulta <= 48
}

// Portal do paciente — lista somente-leitura dos próximos horários
// (data/hora/local/link do Meet se houver). Sem cancelar/reagendar
// nesta leva. Mesmo esqueleto de ExamesLaboratoriaisPaciente.jsx.
export default function AgendaPaciente() {
  const { tokenUrl } = useParams()
  const navigate = useNavigate()
  const { setDarkMode, setCorPrimaria } = useTheme()

  const [loading, setLoading] = useState(true)
  const [paciente, setPaciente] = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [nomeAvaliador, setNomeAvaliador] = useState('')
  const [logomarcaUrl, setLogomarcaUrl] = useState('')
  const [sessaoAtiva, setSessaoAtiva] = useState(false)
  const [tokenLaudo, setTokenLaudo] = useState('')
  const [agendamentos, setAgendamentos] = useState([])
  const [confirmandoId, setConfirmandoId] = useState(null)

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

      const [agRes, avalRes] = await Promise.all([
        supabase
          .from('agendamentos')
          .select('*')
          .eq('id_paciente', pacData.id)
          .eq('status', 'confirmado')
          .eq('visivel_paciente', true)
          .gte('data_inicio', new Date().toISOString())
          .order('data_inicio'),
        supabase
          .from('avaliacoes')
          .select('token_publico')
          .eq('id_paciente', pacData.id)
          .eq('visivel_paciente', true)
          .order('data_avaliacao', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      setAgendamentos(agRes.data || [])
      setTokenLaudo(avalRes.data?.token_publico || '')
      setLoading(false)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenUrl])

  const handleConfirmar = async (agendamento) => {
    setConfirmandoId(agendamento.id)
    try {
      const res = await fetch('/api/agendamentos/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: agendamento.token_confirmacao }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao confirmar')
      setAgendamentos((prev) => prev.map((a) => (a.id === agendamento.id ? { ...a, confirmado_pelo_paciente: true } : a)))
    } catch (err) {
      alert('Erro ao confirmar presença: ' + err.message)
    } finally {
      setConfirmandoId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-primary-600 font-bold animate-pulse">Carregando agenda...</p>
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
          <NavegacaoPortalPaciente tokenPaciente={tokenUrl} tokenLaudo={tokenLaudo} temAgendamentos={agendamentos.length > 0} ativo="agenda" />
        )}

        <div>
          <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">Meus horários</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{paciente.nome_completo}</p>
        </div>

        {agendamentos.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhum horário marcado no momento.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm divide-y divide-gray-100 dark:divide-slate-800">
            {agendamentos.map((ag) => (
              <div key={ag.id} className="flex items-start gap-3 p-4">
                <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center shrink-0">
                  <Calendar size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-slate-100 capitalize">{formatarDataHora(ag.data_inicio)}</p>
                  {ag.local && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={12} /> {ag.local}
                    </p>
                  )}
                  {ag.google_meet_link && (
                    <a
                      href={ag.google_meet_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary-600 hover:underline flex items-center gap-1 mt-1 font-semibold"
                    >
                      <Video size={12} /> Entrar no Google Meet
                    </a>
                  )}

                  {ag.confirmado_pelo_paciente ? (
                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-2">
                      <CheckCircle2 size={14} /> Presença confirmada
                    </p>
                  ) : podeConfirmar(ag) ? (
                    <button
                      onClick={() => handleConfirmar(ag)}
                      disabled={confirmandoId === ag.id}
                      className="mt-2 px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
                    >
                      {confirmandoId === ag.id ? 'Confirmando...' : 'Confirmar presença'}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
