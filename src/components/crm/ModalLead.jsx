import React, { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { X, UserPlus } from 'lucide-react'

// Catálogo completo de etapas possíveis — cobre desde a captação (Lead)
// até o acompanhamento do paciente já ativo (Checkin Semanal). Cada
// nutricionista liga/desliga quais quer ver no board (CRM.jsx), pra não
// poluir quem só quer um funil simples. "Lead" nunca pode ser desligada —
// é onde todo card novo entra.
export const ETAPAS = [
  { id: 'lead', label: 'Lead', obrigatoria: true },
  { id: 'contato', label: 'Contatar Paciente' },
  { id: 'agendado', label: 'Consulta Agendada' },
  { id: 'realizado', label: 'Consulta Realizada' },
  { id: 'ativo', label: 'Cliente Ativo' },
  { id: 'checkin', label: 'Aguardando Checkin Semanal' },
  { id: 'perdido', label: 'Perdido' },
]

export const ETAPAS_PADRAO = ['lead', 'agendado', 'realizado', 'ativo', 'perdido']

// Cria/edita um card do funil (leads_funil). A conversão em Paciente de
// verdade (insert em `pacientes`) fica por conta de `aoConverter`, passada
// pelo CRM.jsx — ele já sabe checar a cota de 7 pacientes do plano grátis.
export default function ModalLead({ userId, lead, etapasVisiveis, aoFechar, aoSalvar, aoConverter }) {
  const editando = !!lead
  const [nome, setNome] = useState(lead?.nome || '')
  const [telefone, setTelefone] = useState(lead?.telefone || '')
  const [email, setEmail] = useState(lead?.email || '')
  const [etapa, setEtapa] = useState(lead?.etapa || 'lead')
  const [observacoes, setObservacoes] = useState(lead?.observacoes || '')
  const [saving, setSaving] = useState(false)
  const [convertendo, setConvertendo] = useState(false)

  const handleSalvar = async (e) => {
    e.preventDefault()
    if (!nome.trim()) return alert('Digite o nome do lead.')

    setSaving(true)
    const payload = {
      id_avaliador: userId,
      nome: nome.trim(),
      telefone: telefone.trim() || null,
      email: email.trim() || null,
      etapa,
      observacoes: observacoes.trim() || null,
    }

    const res = editando
      ? await supabase.from('leads_funil').update(payload).eq('id', lead.id).select().single()
      : await supabase.from('leads_funil').insert(payload).select().single()

    setSaving(false)

    if (res.error) {
      alert('Erro ao salvar lead: ' + res.error.message)
    } else {
      aoSalvar(res.data)
    }
  }

  const handleConverter = async () => {
    if (!nome.trim()) return alert('Digite o nome do lead.')
    setConvertendo(true)
    await aoConverter({ ...lead, nome: nome.trim(), telefone: telefone.trim(), email: email.trim() })
    setConvertendo(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">{editando ? 'Editar Lead' : 'Novo Lead'}</h3>
          <button onClick={aoFechar} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSalvar} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nome</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do lead"
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">WhatsApp</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Com DDD"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="opcional"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          {editando && (
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Etapa</label>
              <select
                value={etapa}
                onChange={(e) => setEtapa(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {ETAPAS.filter((et) => !etapasVisiveis || etapasVisiveis.includes(et.id) || et.id === lead.etapa).map((et) => (
                  <option key={et.id} value={et.id}>{et.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              placeholder="Origem do contato, interesses, o que já foi conversado..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          {editando && !lead.id_paciente && (
            <button
              type="button"
              onClick={handleConverter}
              disabled={convertendo}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 shadow-sm disabled:opacity-50 transition-colors"
            >
              <UserPlus size={16} />
              {convertendo ? 'Convertendo...' : 'Converter em Paciente'}
            </button>
          )}
          {editando && lead.id_paciente && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2 text-center font-semibold">
              Já é um paciente cadastrado ✓
            </p>
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
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
