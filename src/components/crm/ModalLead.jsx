import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabaseClient'
import { X, UserPlus, Trash2 } from 'lucide-react'

// Catálogo completo de etapas possíveis — cobre desde a captação (Lead)
// até o acompanhamento do paciente já ativo (Checkin Semanal). Cada
// nutricionista liga/desliga e reordena quais quer ver no board
// (CRM.jsx/ModalEtapas.jsx), pra não poluir quem só quer um funil
// simples. "Lead" nunca pode ser desligada — é onde todo card novo entra.
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

function normalizarTexto(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Cria/edita um card do funil (leads_funil). Um card novo pode ser um
// lead avulso (só nome/telefone) ou puxado de um paciente já cadastrado
// (busca por nome, mesmo padrão de ModalOrcamento.jsx) — nesse caso já
// nasce linkado (id_paciente preenchido), sem precisar converter depois.
// A conversão de lead avulso em Paciente de verdade (insert em
// `pacientes`) fica por conta de `aoConverter`, passada pelo CRM.jsx —
// ele já sabe checar a cota de 7 pacientes do plano grátis.
export default function ModalLead({ userId, lead, etapasVisiveis, aoFechar, aoSalvar, aoExcluir, aoConverter }) {
  const editando = !!lead
  const dropdownRef = useRef(null)

  const [vinculo, setVinculo] = useState('novo') // 'novo' | 'existente' — só relevante na criação
  const [busca, setBusca] = useState('')
  const [pacientesTodos, setPacientesTodos] = useState([])
  const [pacientesFiltrados, setPacientesFiltrados] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null)

  const [nome, setNome] = useState(lead?.nome || '')
  const [telefone, setTelefone] = useState(lead?.telefone || '')
  const [email, setEmail] = useState(lead?.email || '')
  const [etapa, setEtapa] = useState(lead?.etapa || 'lead')
  const [observacoes, setObservacoes] = useState(lead?.observacoes || '')
  const [saving, setSaving] = useState(false)
  const [convertendo, setConvertendo] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  useEffect(() => {
    if (editando) return
    const carregarPacientes = async () => {
      const { data } = await supabase.from('pacientes').select('id, nome_completo, telefone, email').order('nome_completo')
      setPacientesTodos(data || [])
    }
    carregarPacientes()
  }, [editando])

  useEffect(() => {
    if (busca.length < 1) {
      setPacientesFiltrados([])
      return
    }
    const termo = normalizarTexto(busca)
    setPacientesFiltrados(pacientesTodos.filter((p) => normalizarTexto(p.nome_completo).includes(termo)).slice(0, 5))
  }, [busca, pacientesTodos])

  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  const selecionarPaciente = (p) => {
    setPacienteSelecionado(p)
    setNome(p.nome_completo)
    setTelefone(p.telefone || '')
    setEmail(p.email || '')
    setBusca('')
    setShowDropdown(false)
  }

  const handleSalvar = async (e) => {
    e.preventDefault()
    if (!nome.trim()) return alert('Digite o nome do lead.')
    if (!editando && vinculo === 'existente' && !pacienteSelecionado) {
      return alert('Selecione um paciente ou troque para "Lead novo".')
    }

    setSaving(true)

    if (!editando && vinculo === 'existente') {
      const { data: existente } = await supabase
        .from('leads_funil')
        .select('id')
        .eq('id_paciente', pacienteSelecionado.id)
        .maybeSingle()
      if (existente) {
        setSaving(false)
        return alert('Esse paciente já tem um card no funil.')
      }
    }

    const payload = {
      id_avaliador: userId,
      nome: nome.trim(),
      telefone: telefone.trim() || null,
      email: email.trim() || null,
      etapa,
      observacoes: observacoes.trim() || null,
      ...(!editando && vinculo === 'existente' ? { id_paciente: pacienteSelecionado.id } : {}),
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

  const handleExcluir = async () => {
    if (!window.confirm(`Excluir o card de "${lead.nome}" do funil? Isso não apaga o paciente, se já tiver sido convertido.`)) return
    setExcluindo(true)
    const { error } = await supabase.from('leads_funil').delete().eq('id', lead.id)
    setExcluindo(false)
    if (error) return alert('Erro ao excluir: ' + error.message)
    aoExcluir(lead.id)
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
          {!editando && (
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">De onde vem?</label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setVinculo('novo')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    vinculo === 'novo'
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-700'
                  }`}
                >
                  Lead novo
                </button>
                <button
                  type="button"
                  onClick={() => setVinculo('existente')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    vinculo === 'existente'
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-700'
                  }`}
                >
                  Paciente existente
                </button>
              </div>

              {vinculo === 'existente' &&
                (pacienteSelecionado ? (
                  <div className="flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{pacienteSelecionado.nome_completo}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{pacienteSelecionado.telefone || 'sem telefone cadastrado'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPacienteSelecionado(null)
                        setNome('')
                        setTelefone('')
                        setEmail('')
                      }}
                      className="text-xs text-primary-600 hover:underline font-semibold"
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <div className="relative" ref={dropdownRef}>
                    <input
                      type="text"
                      value={busca}
                      onChange={(e) => {
                        setBusca(e.target.value)
                        setShowDropdown(true)
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Digite o nome do paciente..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                    {showDropdown && pacientesFiltrados.length > 0 && (
                      <ul className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {pacientesFiltrados.map((p) => (
                          <li
                            key={p.id}
                            onClick={() => selecionarPaciente(p)}
                            className="px-3 py-2 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm font-medium border-b border-gray-100 dark:border-slate-800 last:border-0"
                          >
                            {p.nome_completo}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
            </div>
          )}

          {(editando || vinculo === 'novo') && (
            <>
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
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Etapa</label>
            <select
              value={etapa}
              onChange={(e) => setEtapa(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {ETAPAS.filter((et) => !etapasVisiveis || etapasVisiveis.includes(et.id) || et.id === lead?.etapa).map((et) => (
                <option key={et.id} value={et.id}>{et.label}</option>
              ))}
            </select>
          </div>

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

          <div className="flex items-center justify-between gap-3 pt-2">
            {editando ? (
              <button
                type="button"
                onClick={handleExcluir}
                disabled={excluindo}
                title="Excluir card do funil"
                className="p-2 text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            ) : (
              <span />
            )}
            <div className="flex justify-end gap-3">
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
          </div>
        </form>
      </div>
    </div>
  )
}
