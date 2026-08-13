import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { CheckCircle2, Calendar, MapPin } from 'lucide-react'

function formatarDataHora(dataIso) {
  return new Date(dataIso).toLocaleString('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

// Página pública (/confirmar/:token) linkada no lembrete do WhatsApp —
// mostra os dados do agendamento e um botão "Confirmar presença". A
// confirmação em si só acontece no clique (nunca ao só abrir a página),
// pra não confirmar sozinha quando o WhatsApp gera o preview do link.
export default function ConfirmarAgendamento() {
  const { token } = useParams()
  const [loading, setLoading] = useState(true)
  const [agendamento, setAgendamento] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('agendamentos')
        .select('data_inicio, local, confirmado_pelo_paciente, pacientes(nome_completo)')
        .eq('token_confirmacao', token)
        .maybeSingle()

      setAgendamento(data || null)
      setLoading(false)
    }
    carregar()
  }, [token])

  const handleConfirmar = async () => {
    setConfirmando(true)
    setErro('')
    try {
      const res = await fetch('/api/agendamentos/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha ao confirmar')
      setAgendamento((prev) => ({ ...prev, confirmado_pelo_paciente: true }))
    } catch (err) {
      setErro(err.message)
    } finally {
      setConfirmando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-primary-600 font-bold animate-pulse">Carregando...</p>
      </div>
    )
  }

  if (!agendamento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-gray-700 dark:text-slate-300 font-semibold">Link inválido.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
        {agendamento.confirmado_pelo_paciente ? (
          <>
            <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
            <p className="text-lg font-bold text-gray-800 dark:text-slate-100">Presença confirmada!</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">Te esperamos lá. Até breve!</p>
          </>
        ) : (
          <>
            <Calendar size={32} className="mx-auto text-primary-600" />
            <p className="text-lg font-bold text-gray-800 dark:text-slate-100">Confirmar presença?</p>
            <p className="text-sm text-gray-600 dark:text-slate-300 capitalize">{formatarDataHora(agendamento.data_inicio)}</p>
            {agendamento.local && (
              <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                <MapPin size={12} /> {agendamento.local}
              </p>
            )}
            {erro && <p className="text-xs text-red-600">{erro}</p>}
            <button
              onClick={handleConfirmar}
              disabled={confirmando}
              className="w-full px-4 py-3 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
            >
              {confirmando ? 'Confirmando...' : 'Confirmar presença'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
