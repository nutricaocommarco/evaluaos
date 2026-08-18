import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { X, GripVertical } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ETAPAS } from './ModalLead'

function ItemAtivo({ id, label, obrigatoria, onDesativar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: obrigatoria })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border border-primary-300 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10 ${
        isDragging ? 'opacity-50 relative z-10' : ''
      }`}
    >
      <button
        type="button"
        {...(obrigatoria ? {} : { ...attributes, ...listeners })}
        className={obrigatoria ? 'text-gray-300 dark:text-slate-700 cursor-not-allowed' : 'text-gray-400 cursor-grab active:cursor-grabbing touch-none'}
      >
        <GripVertical size={16} />
      </button>
      <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-slate-200">{label}</span>
      <input
        type="checkbox"
        checked
        disabled={obrigatoria}
        onChange={() => onDesativar(id)}
        className="w-4 h-4 accent-primary-600"
      />
    </div>
  )
}

function ItemInativo({ id, label, onAtivar }) {
  return (
    <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 cursor-pointer">
      <span className="w-4 shrink-0" />
      <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-slate-200">{label}</span>
      <input type="checkbox" checked={false} onChange={() => onAtivar(id)} className="w-4 h-4 accent-primary-600" />
    </label>
  )
}

// Liga/desliga e reordena quais etapas aparecem no board do CRM —
// guardado em configuracoes_avaliador.etapas_funil_ativas (mesma tabela
// de preferências já usada em Configuracoes.jsx). A ORDEM do array já É
// a ordem das colunas no board (ver etapasVisiveis em CRM.jsx), então
// arrastar aqui reordena o funil sem precisar de coluna nova no banco.
// "Lead" nunca desliga nem sai do topo: é onde todo card novo entra.
export default function ModalEtapas({ userId, etapasAtivas, aoFechar, aoSalvar }) {
  const [ordem, setOrdem] = useState(etapasAtivas)
  const [saving, setSaving] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const inativas = ETAPAS.filter((et) => !ordem.includes(et.id))

  const ativar = (id) => setOrdem((prev) => [...prev, id])
  const desativar = (id) => setOrdem((prev) => prev.filter((e) => e !== id))

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    setOrdem((prev) => arrayMove(prev, prev.indexOf(active.id), prev.indexOf(over.id)))
  }

  const handleSalvar = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('configuracoes_avaliador')
      .upsert({ auth_id: userId, etapas_funil_ativas: ordem }, { onConflict: 'auth_id' })
    setSaving(false)
    if (error) return alert('Erro ao salvar etapas: ' + error.message)
    aoSalvar(ordem)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Etapas do funil</h3>
          <button onClick={aoFechar} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Arraste pelo ícone pra reordenar as colunas do board. Desmarque as que você não usa.
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ordem} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {ordem.map((id) => {
                const etapa = ETAPAS.find((et) => et.id === id)
                if (!etapa) return null
                return <ItemAtivo key={id} id={id} label={etapa.label} obrigatoria={etapa.obrigatoria} onDesativar={desativar} />
              })}
            </div>
          </SortableContext>
        </DndContext>

        {inativas.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-slate-800">
            <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Desligadas</p>
            {inativas.map((et) => (
              <ItemInativo key={et.id} id={et.id} label={et.label} onAtivar={ativar} />
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={aoFechar}
            className="px-5 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={saving}
            className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
