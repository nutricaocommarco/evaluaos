import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { Video, MapPin, Trash2 } from 'lucide-react'

function formatarDataHora(dataIso) {
  return new Date(dataIso).toLocaleString('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

// Detalhe de um agendamento existente — ver informações e excluir. Se
// o agendamento tiver um evento no Google Calendar, cancela ele também
// (api/google/delete-event.js) antes de apagar a linha — se essa
// chamada falhar (ex: Google desconectado), a exclusão no EvaluaOS
// segue mesmo assim, só avisa que precisa apagar manualmente lá.
export default function ModalDetalheAgendamento({ agendamento, aoFechar, aoExcluido }) {
  const [excluindo, setExcluindo] = useState(false)

  const handleExcluir = async () => {
    if (!window.confirm('Excluir este agendamento?')) return
    setExcluindo(true)

    let avisoGoogle = null
    if (agendamento.google_event_id) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch('/api/google/gerenciar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ acao: 'excluir-evento', agendamento_id: agendamento.id }),
        })
        if (!res.ok) avisoGoogle = 'Não foi possível cancelar o evento no Google Calendar — apague manualmente lá.'
      } catch {
        avisoGoogle = 'Não foi possível cancelar o evento no Google Calendar — apague manualmente lá.'
      }
    }

    const { error } = await supabase.from('agendamentos').delete().eq('id', agendamento.id)
    setExcluindo(false)
    if (error) { alert('Erro ao excluir: ' + error.message); return }
    if (avisoGoogle) alert(avisoGoogle)
    aoExcluido(agendamento.id)
    aoFechar()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-slate-100">{agendamento.pacientes?.nome_completo}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 capitalize mt-0.5">{formatarDataHora(agendamento.data_inicio)}</p>
          </div>
          <button onClick={aoFechar} className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">✕</button>
        </div>

        <p className={`text-xs font-semibold flex items-center gap-1.5 ${agendamento.confirmado_pelo_paciente ? 'text-emerald-600' : 'text-gray-400 dark:text-slate-500'}`}>
          {agendamento.confirmado_pelo_paciente ? '✅ Confirmado pelo paciente' : '⏳ Aguardando confirmação do paciente'}
        </p>

        {agendamento.local && (
          <p className="text-xs text-gray-600 dark:text-slate-300 flex items-center gap-1.5">
            <MapPin size={14} /> {agendamento.local}
          </p>
        )}

        {agendamento.google_meet_link && (
          <a
            href={agendamento.google_meet_link}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary-600 hover:underline flex items-center gap-1.5 font-semibold"
          >
            <Video size={14} /> Entrar no Google Meet
          </a>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={handleExcluir}
            disabled={excluindo}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
          >
            <Trash2 size={14} /> {excluindo ? 'Excluindo...' : 'Excluir agendamento'}
          </button>
          <button onClick={aoFechar} className="px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 shadow">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
