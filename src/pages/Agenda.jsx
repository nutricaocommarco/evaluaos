import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ChevronLeft, ChevronRight, Video, MapPin, CheckCircle2, CalendarDays, List } from 'lucide-react'
import ModalCriarAgendamento from '../components/agenda/ModalCriarAgendamento'
import ModalDetalheAgendamento from '../components/agenda/ModalDetalheAgendamento'

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
  const location = useLocation()
  const navigate = useNavigate()
  // Capturado uma vez do state da navegação (não re-derivado de
  // `location` depois) — o efeito abaixo limpa o state logo em seguida
  // pra um refresh não reabrir o modal sozinho, e isso não pode apagar
  // o paciente já escolhido do modal que já está aberto.
  const [pacientePreSelecionado] = useState(() => location.state?.pacientePreSelecionado || null)

  const [semanaBase, setSemanaBase] = useState(() => inicioDaSemana(new Date()))
  const [agendamentos, setAgendamentos] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [googleConectado, setGoogleConectado] = useState(false)
  const [whatsappConectado, setWhatsappConectado] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null)
  const [modo, setModo] = useState('grade') // 'grade' | 'lista'
  const [listaAgendamentos, setListaAgendamentos] = useState([])
  const [carregandoLista, setCarregandoLista] = useState(false)

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

  // Lista mostra todas as consultas futuras, não só a semana selecionada
  // na grade — carrega só quando o modo "Lista" é aberto, evitando um
  // fetch extra sempre que a Agenda abre no modo Grade (padrão).
  const carregarLista = async () => {
    setCarregandoLista(true)
    const { data } = await supabase
      .from('agendamentos')
      .select('*, pacientes(id, nome_completo, telefone)')
      .eq('status', 'confirmado')
      .gte('data_inicio', new Date().toISOString())
      .order('data_inicio')
    setListaAgendamentos(data || [])
    setCarregandoLista(false)
  }

  useEffect(() => {
    if (modo === 'lista') carregarLista()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo])

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semanaBase])

  // Veio de "Agendar Consulta" no perfil do paciente — já abre o modal
  // de criação com o paciente escolhido, e limpa o state da navegação
  // pra um refresh na página não reabrir o modal sozinho de novo.
  useEffect(() => {
    if (pacientePreSelecionado) {
      setShowModal(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCriado = (novo) => {
    setAgendamentos((prev) => [...prev, novo])
    setListaAgendamentos((prev) => [...prev, novo].sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio)))
  }

  const handleExcluido = (id) => {
    setAgendamentos((prev) => prev.filter((a) => a.id !== id))
    setListaAgendamentos((prev) => prev.filter((a) => a.id !== id))
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
          {modo === 'grade' && (
            <>
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
            </>
          )}
          {modo === 'lista' && (
            <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Próximas consultas</h2>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setModo('grade')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${modo === 'grade' ? 'bg-white dark:bg-slate-900 text-primary-600 shadow' : 'text-gray-500 dark:text-slate-400'}`}
            >
              <CalendarDays size={14} /> Grade
            </button>
            <button
              onClick={() => setModo('lista')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${modo === 'lista' ? 'bg-white dark:bg-slate-900 text-primary-600 shadow' : 'text-gray-500 dark:text-slate-400'}`}
            >
              <List size={14} /> Lista
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors shrink-0"
          >
            Criar agendamento
          </button>
        </div>
      </div>

      {!googleConectado && !whatsappConectado && (
        <p className="text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-lg px-3 py-2">
          Conecte o Google Calendar e o WhatsApp em <span className="font-semibold">Nutricionista &gt; Integrações</span> pra gerar links do Meet automaticamente e avisar seus pacientes.
        </p>
      )}

      {modo === 'lista' ? (
        carregandoLista ? (
          <p className="text-sm text-primary-600 font-semibold text-center py-10 animate-pulse">Carregando...</p>
        ) : listaAgendamentos.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhuma consulta marcada.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm divide-y divide-gray-100 dark:divide-slate-800">
            {listaAgendamentos.map((ag) => (
              <button
                key={ag.id}
                onClick={() => setAgendamentoSelecionado(ag)}
                className="w-full flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="sm:w-40 shrink-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-slate-100 capitalize">
                    {new Date(ag.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · {new Date(ag.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-100 truncate">{ag.pacientes?.nome_completo}</p>
                  {ag.google_meet_link ? (
                    <p className="text-xs text-primary-600 flex items-center gap-1 truncate"><Video size={11} /> Google Meet</p>
                  ) : ag.local ? (
                    <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 truncate"><MapPin size={11} /> {ag.local}</p>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-slate-500">Sem local definido</p>
                  )}
                </div>
                <div className="shrink-0">
                  {ag.confirmado_pelo_paciente ? (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={13} /> Confirmado</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500">Aguardando confirmação</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )
      ) : loading ? (
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
                    onClick={() => setAgendamentoSelecionado(ag)}
                    className="absolute left-1 right-1 bg-primary-100 dark:bg-primary-900/40 border-l-4 border-primary-600 rounded-md px-2 py-1 overflow-hidden text-primary-900 dark:text-primary-200 cursor-pointer hover:brightness-95 dark:hover:brightness-125 transition-[filter]"
                  >
                    <p className="text-[11px] font-bold truncate">
                      {ag.confirmado_pelo_paciente && '✅ '}
                      {new Date(ag.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {ag.pacientes?.nome_completo}
                    </p>
                    {ag.google_meet_link && (
                      <a
                        href={ag.google_meet_link}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] flex items-center gap-1 underline"
                      >
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
          pacientePreSelecionado={pacientePreSelecionado}
          userId={userId}
          googleConectado={googleConectado}
          whatsappConectado={whatsappConectado}
          aoFechar={() => setShowModal(false)}
          aoCriado={handleCriado}
        />
      )}

      {agendamentoSelecionado && (
        <ModalDetalheAgendamento
          agendamento={agendamentoSelecionado}
          aoFechar={() => setAgendamentoSelecionado(null)}
          aoExcluido={handleExcluido}
        />
      )}
    </div>
  )
}
