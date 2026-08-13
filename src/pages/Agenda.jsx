import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import { ChevronLeft, ChevronRight, Video } from 'lucide-react'
import ModalCriarAgendamento from '../components/agenda/ModalCriarAgendamento'

const DIAS_SEMANA = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.']
const ALTURA_HORA = 56 // px por hora na grade

function inicioDaSemana(data) {
  const d = new Date(data)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

function formatarMesAno(data) {
  return data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '')
}

// Agenda semanal, visão de todos os pacientes (não fica dentro do
// SidebarPaciente — mesmo padrão top-level de Questionarios.jsx). Grade
// customizada com CSS grid/Tailwind, sem lib de calendário (nenhuma
// existe no projeto ainda).
export default function Agenda({ userId }) {
  const [semanaBase, setSemanaBase] = useState(() => inicioDaSemana(new Date()))
  const [agendamentos, setAgendamentos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [googleConectado, setGoogleConectado] = useState(false)
  const [whatsappConectado, setWhatsappConectado] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const dias = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(semanaBase)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [semanaBase])

  const carregar = async () => {
    setLoading(true)
    const fimSemana = new Date(semanaBase)
    fimSemana.setDate(fimSemana.getDate() + 7)

    const [agRes, pacRes, avalRes] = await Promise.all([
      supabase
        .from('agendamentos')
        .select('*, pacientes(id, nome_completo, telefone)')
        .eq('status', 'confirmado')
        .gte('data_inicio', semanaBase.toISOString())
        .lt('data_inicio', fimSemana.toISOString())
        .order('data_inicio'),
      supabase.from('pacientes').select('id, nome_completo, telefone').order('nome_completo'),
      supabase.from('avaliadores').select('google_calendar_conectado, whatsapp_conectado').eq('auth_id', userId).maybeSingle(),
    ])

    setAgendamentos(agRes.data || [])
    setPacientes(pacRes.data || [])
    setGoogleConectado(!!avalRes.data?.google_calendar_conectado)
    setWhatsappConectado(!!avalRes.data?.whatsapp_conectado)
    setLoading(false)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semanaBase])

  const handleCriado = (novo) => {
    setAgendamentos((prev) => [...prev, novo])
  }

  const agendamentosPorDia = (dia) => {
    return agendamentos.filter((a) => new Date(a.data_inicio).toDateString() === dia.toDateString())
  }

  const posicaoBloco = (ag) => {
    const inicio = new Date(ag.data_inicio)
    const fim = new Date(ag.data_fim)
    const topo = (inicio.getHours() + inicio.getMinutes() / 60) * ALTURA_HORA
    const duracaoHoras = Math.max((fim - inicio) / 3600000, 0.5)
    return { top: `${topo}px`, height: `${duracaoHoras * ALTURA_HORA}px` }
  }

  const hoje = new Date()

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSemanaBase(inicioDaSemana(new Date()))}
            className="px-3 py-1.5 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:border-slate-700"
          >
            Hoje
          </button>
          <button onClick={() => setSemanaBase((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })} className="p-1.5 text-gray-500 hover:text-primary-600">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setSemanaBase((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })} className="p-1.5 text-gray-500 hover:text-primary-600">
            <ChevronRight size={20} />
          </button>
          <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100 capitalize">{formatarMesAno(semanaBase)}</h2>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors shrink-0"
        >
          Criar agendamento
        </button>
      </div>

      {!googleConectado && !whatsappConectado && (
        <p className="text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg px-3 py-2">
          Conecte o Google Calendar e o WhatsApp em <span className="font-semibold">Nutricionista &gt; Integrações</span> pra gerar links do Meet automaticamente e avisar seus pacientes.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-primary-600 font-semibold text-center py-10 animate-pulse">Carregando...</p>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-x-auto">
          <div className="grid grid-cols-[48px_repeat(7,minmax(120px,1fr))] min-w-[840px]">
            <div className="border-b border-r border-gray-100 dark:border-slate-800" />
            {dias.map((d) => (
              <div key={d.toISOString()} className={`text-center py-2 border-b border-r border-gray-100 dark:border-slate-800 ${d.toDateString() === hoje.toDateString() ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                <p className="text-xs text-gray-400 dark:text-slate-500">{DIAS_SEMANA[d.getDay()]}</p>
                <p className={`text-sm font-bold ${d.toDateString() === hoje.toDateString() ? 'text-primary-600' : 'text-gray-700 dark:text-slate-300'}`}>{d.getDate()}</p>
              </div>
            ))}

            <div className="relative" style={{ height: 24 * ALTURA_HORA }}>
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} style={{ top: h * ALTURA_HORA - 7 }} className="absolute right-1 text-[10px] text-gray-400 dark:text-slate-500">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
            {dias.map((dia, i) => (
              <div key={dia.toISOString()} className="relative border-r border-gray-100 dark:border-slate-800" style={{ height: 24 * ALTURA_HORA }}>
                {Array.from({ length: 24 }, (_, h) => (
                  <div key={h} style={{ height: ALTURA_HORA }} className="border-b border-gray-50 dark:border-slate-800/60" />
                ))}

                {agendamentosPorDia(dia).map((ag) => (
                  <div
                    key={ag.id}
                    style={posicaoBloco(ag)}
                    className="absolute left-1 right-1 bg-primary-100 dark:bg-primary-900/40 border-l-4 border-primary-600 rounded-md px-2 py-1 overflow-hidden text-primary-900 dark:text-primary-200"
                  >
                    <p className="text-[11px] font-bold truncate">
                      {new Date(ag.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {ag.pacientes?.nome_completo}
                    </p>
                    {ag.google_meet_link && (
                      <a href={ag.google_meet_link} target="_blank" rel="noreferrer" className="text-[10px] flex items-center gap-1 underline">
                        <Video size={10} /> Google Meet
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="text-[10px] text-gray-400 dark:text-slate-500 px-2 pb-2">Role a grade pra ver o dia inteiro.</div>
        </div>
      )}

      {showModal && (
        <ModalCriarAgendamento
          pacientes={pacientes}
          userId={userId}
          googleConectado={googleConectado}
          whatsappConectado={whatsappConectado}
          aoFechar={() => setShowModal(false)}
          aoCriado={handleCriado}
        />
      )}
    </div>
  )
}
