import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { usePlano } from '../contexts/PlanoContext'
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Plus, MessageCircle, UserCheck, Settings2 } from 'lucide-react'
import ModalLead, { ETAPAS, ETAPAS_PADRAO } from '../components/crm/ModalLead'
import ModalEtapas from '../components/crm/ModalEtapas'

const COR_TOPO_ETAPA = {
  lead: 'border-t-gray-400',
  contato: 'border-t-sky-400',
  agendado: 'border-t-amber-400',
  realizado: 'border-t-primary-500',
  ativo: 'border-t-emerald-500',
  checkin: 'border-t-purple-400',
  perdido: 'border-t-red-400',
}

function linkWhatsApp(lead) {
  const limpo = lead.telefone?.replace(/\D/g, '')
  if (!limpo) return null
  return `https://wa.me/${limpo.startsWith('55') ? limpo : '55' + limpo}`
}

function Card({ lead, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: String(lead.id) })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  const wa = linkWhatsApp(lead)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onClick(lead)}
      className={`bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800 p-3 shadow-sm cursor-grab active:cursor-grabbing space-y-1.5 touch-none ${
        isDragging ? 'opacity-40 relative z-50' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate">{lead.nome}</p>
        {lead.id_paciente && <UserCheck size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
      </div>
      {lead.telefone && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{lead.telefone}</p>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 shrink-0"
            >
              <MessageCircle size={14} />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function Coluna({ etapa, leads, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.id })

  return (
    <div className="flex flex-col w-full sm:w-72 sm:shrink-0">
      <div
        className={`flex items-center justify-between px-3 py-2 rounded-t-xl border-t-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 ${COR_TOPO_ETAPA[etapa.id]}`}
      >
        <h3 className="text-xs font-bold text-gray-700 dark:text-slate-200">{etapa.label}</h3>
        <span className="text-[10px] font-bold bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-full px-2 py-0.5">
          {leads.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[140px] p-2 space-y-2 rounded-b-xl border border-t-0 border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-950/40 transition-colors ${
          isOver ? 'bg-primary-50 dark:bg-primary-900/10' : ''
        }`}
      >
        {leads.map((lead) => (
          <Card key={lead.id} lead={lead} onClick={onCardClick} />
        ))}
        {leads.length === 0 && (
          <p className="text-[11px] text-gray-300 dark:text-slate-700 text-center py-6">Arraste um card aqui</p>
        )}
      </div>
    </div>
  )
}

// CRM — funil visual de atendimento (Roadmap "CRM para Nutricionistas").
// Cards vivem em leads_funil, separado de pacientes, pra um lead frio não
// contar na cota de 7 pacientes do plano grátis. Só vira paciente de
// verdade quando o nutricionista converte manualmente (ver ModalLead).
export default function CRM({ userId }) {
  const { isPro } = usePlano()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [leadEditando, setLeadEditando] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [etapasAtivas, setEtapasAtivas] = useState(ETAPAS_PADRAO)
  const [showModalEtapas, setShowModalEtapas] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const carregar = async () => {
    setLoading(true)
    const { data } = await supabase.from('leads_funil').select('*').order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  useEffect(() => {
    const carregarEtapasAtivas = async () => {
      if (!userId) return
      const { data } = await supabase
        .from('configuracoes_avaliador')
        .select('etapas_funil_ativas')
        .eq('auth_id', userId)
        .maybeSingle()
      if (data?.etapas_funil_ativas?.length) setEtapasAtivas(data.etapas_funil_ativas)
    }
    carregarEtapasAtivas()
  }, [userId])

  const leadsPorEtapa = useMemo(() => {
    const grupos = {}
    ETAPAS.forEach((et) => {
      grupos[et.id] = []
    })
    leads.forEach((l) => {
      ;(grupos[l.etapa] || grupos.lead).push(l)
    })
    return grupos
  }, [leads])

  // Uma etapa desligada some do board, mas só se estiver vazia — se
  // ainda tem card lá dentro ela continua aparecendo até o nutricionista
  // mover ou converter todos (evita "perder" um lead de vista).
  const etapasVisiveis = useMemo(
    () => ETAPAS.filter((et) => etapasAtivas.includes(et.id) || (leadsPorEtapa[et.id]?.length || 0) > 0),
    [etapasAtivas, leadsPorEtapa]
  )

  const abrirNovo = () => {
    setLeadEditando(null)
    setShowModal(true)
  }

  const abrirEdicao = (lead) => {
    setLeadEditando(lead)
    setShowModal(true)
  }

  const fecharModal = () => {
    setShowModal(false)
    setLeadEditando(null)
  }

  const aoSalvarLead = (salvo) => {
    setLeads((prev) => {
      const existe = prev.some((l) => l.id === salvo.id)
      return existe ? prev.map((l) => (l.id === salvo.id ? salvo : l)) : [salvo, ...prev]
    })
    fecharModal()
  }

  // Mesma trava de 7 pacientes do plano grátis que Pacientes.jsx já usa —
  // sem filtro por id_avaliador na query porque a RLS de `pacientes` já
  // restringe às linhas do próprio nutricionista (mesmo padrão do
  // fetchPacientes original).
  const handleConverter = async (lead) => {
    if (!isPro) {
      const { count } = await supabase.from('pacientes').select('id', { count: 'exact', head: true })
      if ((count || 0) >= 7) {
        alert('Você atingiu o limite de 7 pacientes do plano grátis. Faça upgrade pra Pro pra converter mais leads em pacientes.')
        return
      }
    }

    const { data: paciente, error } = await supabase
      .from('pacientes')
      .insert({
        id_avaliador: userId,
        nome_completo: lead.nome,
        email: lead.email || '',
        telefone: lead.telefone || '',
        sexo: 'M',
        nacionalidade: 'Brasileira',
        pratica_esporte: false,
      })
      .select()
      .single()

    if (error) return alert('Erro ao converter em paciente: ' + error.message)

    const { data: leadAtualizado, error: errLead } = await supabase
      .from('leads_funil')
      .update({ id_paciente: paciente.id })
      .eq('id', lead.id)
      .select()
      .single()

    if (errLead) return alert('Paciente criado, mas houve erro ao atualizar o card do funil: ' + errLead.message)

    setLeads((prev) => prev.map((l) => (l.id === lead.id ? leadAtualizado : l)))
    fecharModal()
    alert(`${paciente.nome_completo} agora é seu paciente! Complete a ficha em Pacientes quando puder.`)
  }

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null)
    if (!over) return
    const leadId = Number(active.id)
    const novaEtapa = over.id
    const leadAtual = leads.find((l) => l.id === leadId)
    if (!leadAtual || leadAtual.etapa === novaEtapa) return

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, etapa: novaEtapa } : l)))
    const { error } = await supabase.from('leads_funil').update({ etapa: novaEtapa }).eq('id', leadId)
    if (error) {
      alert('Erro ao mover o card: ' + error.message)
      carregar()
    }
  }

  const leadArrastando = leads.find((l) => String(l.id) === activeId)

  return (
    <div className="space-y-4 max-w-full min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">CRM — Funil de Atendimento</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Arraste os cards entre as etapas conforme o contato avança.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowModalEtapas(true)}
            title="Configurar etapas do funil"
            className="p-2.5 text-gray-400 hover:text-primary-600 bg-gray-100 dark:bg-slate-800 rounded-lg transition-colors"
          >
            <Settings2 size={16} />
          </button>
          <button
            onClick={abrirNovo}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors flex items-center gap-1.5"
          >
            <Plus size={16} /> Novo Lead
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-primary-600 font-semibold text-center py-8 animate-pulse">Carregando...</p>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:overflow-x-auto pb-3 -mx-1 px-1">
            {etapasVisiveis.map((etapa) => (
              <Coluna key={etapa.id} etapa={etapa} leads={leadsPorEtapa[etapa.id] || []} onCardClick={abrirEdicao} />
            ))}
          </div>
          <DragOverlay>{leadArrastando ? <Card lead={leadArrastando} onClick={() => {}} /> : null}</DragOverlay>
        </DndContext>
      )}

      {showModal && (
        <ModalLead
          userId={userId}
          lead={leadEditando}
          etapasVisiveis={etapasAtivas}
          aoFechar={fecharModal}
          aoSalvar={aoSalvarLead}
          aoConverter={handleConverter}
        />
      )}

      {showModalEtapas && (
        <ModalEtapas
          userId={userId}
          etapasAtivas={etapasAtivas}
          aoFechar={() => setShowModalEtapas(false)}
          aoSalvar={(novas) => {
            setEtapasAtivas(novas)
            setShowModalEtapas(false)
          }}
        />
      )}
    </div>
  )
}
