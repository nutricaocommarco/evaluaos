import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { X } from 'lucide-react'
import { ETAPAS } from './ModalLead'

// Liga/desliga quais etapas aparecem no board do CRM — guardado em
// configuracoes_avaliador.etapas_funil_ativas (mesma tabela de
// preferências já usada em Configuracoes.jsx). "Lead" nunca desliga: é
// onde todo card novo entra.
export default function ModalEtapas({ userId, etapasAtivas, aoFechar, aoSalvar }) {
  const [selecionadas, setSelecionadas] = useState(etapasAtivas)
  const [saving, setSaving] = useState(false)

  const alternar = (id) => {
    setSelecionadas((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]))
  }

  const handleSalvar = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('configuracoes_avaliador')
      .upsert({ auth_id: userId, etapas_funil_ativas: selecionadas }, { onConflict: 'auth_id' })
    setSaving(false)
    if (error) return alert('Erro ao salvar etapas: ' + error.message)
    aoSalvar(selecionadas)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Etapas do funil</h3>
          <button onClick={aoFechar} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Escolha quais etapas aparecem no seu board, pra não poluir com colunas que você não usa. Uma etapa com cards continua visível até você mover ou converter todos eles.
        </p>
        <div className="space-y-2">
          {ETAPAS.map((etapa) => (
            <label
              key={etapa.id}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                etapa.obrigatoria ? 'opacity-60' : 'cursor-pointer'
              } ${
                selecionadas.includes(etapa.id)
                  ? 'border-primary-300 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10'
                  : 'border-gray-200 dark:border-slate-700'
              }`}
            >
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{etapa.label}</span>
              <input
                type="checkbox"
                checked={selecionadas.includes(etapa.id)}
                disabled={etapa.obrigatoria}
                onChange={() => alternar(etapa.id)}
                className="w-4 h-4 accent-primary-600"
              />
            </label>
          ))}
        </div>
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
