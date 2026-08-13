import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'

const FUSOS = [
  { value: 'America/Sao_Paulo', label: '(GMT-03:00) Horário de Brasília' },
  { value: 'America/Manaus', label: '(GMT-04:00) Manaus' },
  { value: 'America/Rio_Branco', label: '(GMT-05:00) Rio Branco' },
  { value: 'America/Noronha', label: '(GMT-02:00) Fernando de Noronha' },
]

function combinarDataHora(data, hora) {
  return new Date(`${data}T${hora}:00`).toISOString()
}

// fetch() do navegador não tem timeout — se a gateway do WhatsApp (ou
// qualquer chamada externa) travar sem responder, a tela ficava presa
// em "Criando..." pra sempre. Com AbortController, desiste depois de
// 20s e cai no catch normal, como qualquer outra falha.
async function fetchComTimeout(url, opcoes, timeoutMs = 20000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...opcoes, signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

// Modal "Criar agendamento" — campos iguais à referência (Paciente,
// Data, Hora início/término, Fuso horário, Local). Ao salvar: insere em
// `agendamentos`; se o Google estiver conectado, chama
// api/google/create-event.js pra gerar o evento com Meet; se o WhatsApp
// estiver conectado e o paciente tiver telefone, chama
// api/whatsapp/send.js pra mandar a confirmação (Trigger A). As duas
// integrações falham de forma graciosa — um aviso, não trava o
// agendamento em si, que já foi salvo antes delas rodarem.
export default function ModalCriarAgendamento({ pacientes, userId, googleConectado, whatsappConectado, aoFechar, aoCriado }) {
  const [pacienteId, setPacienteId] = useState('')
  const [data, setData] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [fuso, setFuso] = useState('America/Sao_Paulo')
  const [local, setLocal] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [avisos, setAvisos] = useState([])

  const handleSalvar = async (e) => {
    e.preventDefault()
    if (!pacienteId || !data || !horaInicio || !horaFim) {
      alert('Preencha paciente, data e horários.')
      return
    }

    setSalvando(true)
    const avisosLocais = []

    const { data: agendamento, error } = await supabase
      .from('agendamentos')
      .insert({
        id_paciente: pacienteId,
        id_avaliador: userId,
        data_inicio: combinarDataHora(data, horaInicio),
        data_fim: combinarDataHora(data, horaFim),
        fuso_horario: fuso,
        local: local || null,
      })
      .select('*, pacientes(id, nome_completo, telefone)')
      .single()

    if (error) {
      setSalvando(false)
      alert('Erro ao criar agendamento: ' + error.message)
      return
    }

    let agendamentoFinal = agendamento

    if (googleConectado) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetchComTimeout('/api/google/create-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ agendamento_id: agendamento.id }),
        })
        const eventoData = await res.json()
        if (res.ok) {
          agendamentoFinal = { ...agendamentoFinal, google_event_id: eventoData.google_event_id, google_meet_link: eventoData.google_meet_link }
        } else {
          avisosLocais.push(`Evento não criado no Google Calendar: ${eventoData.error}`)
        }
      } catch (err) {
        avisosLocais.push('Evento não criado no Google Calendar: falha de conexão.')
      }
    }

    if (whatsappConectado && agendamento.pacientes?.telefone) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetchComTimeout('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ agendamento_id: agendamento.id }),
        })
        if (!res.ok) {
          const errData = await res.json()
          avisosLocais.push(`Confirmação por WhatsApp não enviada: ${errData.error}`)
        }
      } catch (err) {
        avisosLocais.push('Confirmação por WhatsApp não enviada: falha de conexão.')
      }
    }

    setSalvando(false)

    if (avisosLocais.length > 0) {
      setAvisos(avisosLocais)
      aoCriado(agendamentoFinal)
    } else {
      aoCriado(agendamentoFinal)
      aoFechar()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Criar agendamento</h3>
          <button onClick={aoFechar} className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300">✕</button>
        </div>

        {avisos.length > 0 ? (
          <>
            <p className="text-sm text-gray-700 dark:text-slate-300">Agendamento criado, mas com avisos:</p>
            <ul className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-1">
              {avisos.map((a, i) => <li key={i}>⚠️ {a}</li>)}
            </ul>
            <div className="flex justify-end pt-2">
              <button onClick={aoFechar} className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow">Fechar</button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSalvar} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Paciente *</label>
              <select
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecione...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome_completo}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Data *</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Hora de início *</label>
                <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Hora de término *</label>
                <input type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Fuso horário *</label>
              <select value={fuso} onChange={(e) => setFuso(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500">
                {FUSOS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Local</label>
              <input type="text" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Endereço físico ou link de reunião" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
              {!googleConectado && (
                <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Conecte o Google Calendar em Nutricionista &gt; Integrações pra gerar o link do Meet automaticamente.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={aoFechar} className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50">
                {salvando ? 'Criando...' : 'Criar agendamento'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
