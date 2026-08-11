import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from '../components/SidebarPaciente'

const CAMPOS_VAZIOS = {
  data_consulta: new Date().toISOString().slice(0, 10),
  queixa_principal: '',
  historico_doencas: '',
  historico_familiar: '',
  medicamentos: '',
  suplementos_em_uso: '',
  observacoes: ''
}

export default function ProntuarioPaciente({ userId }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [paciente, setPaciente] = useState(null)
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [itemAtivo, setItemAtivo] = useState('prontuario')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(CAMPOS_VAZIOS)
  const [saving, setSaving] = useState(false)

  const carregarDados = async () => {
    setLoading(true)

    const { data: pac } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    setPaciente(pac || null)

    if (pac) {
      const { data: lista } = await supabase
        .from('prontuarios')
        .select('*')
        .eq('id_paciente', id)
        .order('data_consulta', { ascending: false })

      setConsultas(lista || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const abrirNovaConsulta = () => {
    setEditingId(null)
    setForm(CAMPOS_VAZIOS)
    setShowModal(true)
  }

  useEffect(() => {
    if (location.state?.abrirNovaConsulta) {
      abrirNovaConsulta()
      navigate(location.pathname, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  const abrirEdicaoConsulta = (consulta) => {
    setEditingId(consulta.id)
    setForm({
      data_consulta: consulta.data_consulta,
      queixa_principal: consulta.queixa_principal || '',
      historico_doencas: consulta.historico_doencas || '',
      historico_familiar: consulta.historico_familiar || '',
      medicamentos: consulta.medicamentos || '',
      suplementos_em_uso: consulta.suplementos_em_uso || '',
      observacoes: consulta.observacoes || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    if (editingId) {
      const { error } = await supabase
        .from('prontuarios')
        .update(form)
        .eq('id', editingId)

      if (error) {
        alert('Erro ao atualizar consulta: ' + error.message)
      } else {
        setShowModal(false)
        carregarDados()
      }
    } else {
      const { error } = await supabase
        .from('prontuarios')
        .insert({ ...form, id_paciente: id, id_avaliador: userId })

      if (error) {
        alert('Erro ao salvar consulta: ' + error.message)
      } else {
        setShowModal(false)
        carregarDados()
      }
    }

    setSaving(false)
  }

  const handleExcluir = async (consultaId) => {
    if (!window.confirm('Excluir esta consulta do prontuário? Essa ação não pode ser desfeita.')) return

    const { error } = await supabase.from('prontuarios').delete().eq('id', consultaId)
    if (error) {
      alert('Erro ao excluir consulta: ' + error.message)
    } else {
      setConsultas(prev => prev.filter(c => c.id !== consultaId))
    }
  }

  const formatarData = (dataStr) => {
    if (!dataStr) return '-'
    return new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-primary-600 font-bold animate-pulse">Carregando prontuário...</p>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <p className="text-gray-600 dark:text-slate-300 font-semibold">Paciente não encontrado.</p>
        <button
          onClick={() => navigate('/pacientes')}
          className="text-primary-600 font-semibold text-sm hover:underline"
        >
          ← Voltar para Pacientes
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
      <SidebarPaciente paciente={paciente} itemAtivo={itemAtivo} onSelecionarItem={setItemAtivo} />

      <div className="flex-1 min-w-0 space-y-4">
        <>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Prontuário — {paciente.nome_completo}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Histórico clínico de consultas e observações</p>
              </div>
              <button
                onClick={abrirNovaConsulta}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors shrink-0"
              >
                + Nova Consulta
              </button>
            </div>

            {consultas.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhuma consulta registrada ainda.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200 dark:bg-slate-700"></div>

                {consultas.map((c) => (
                  <div key={c.id} className="relative">
                    <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-primary-600 border-2 border-white dark:border-slate-950"></div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                      <div className="flex justify-between items-start gap-3">
                        <span className="text-sm font-black text-gray-800 dark:text-slate-100">{formatarData(c.data_consulta)}</span>
                        <div className="flex gap-3 shrink-0">
                          <button onClick={() => abrirEdicaoConsulta(c)} className="text-xs font-semibold text-primary-600 hover:underline">Editar</button>
                          <button onClick={() => handleExcluir(c.id)} className="text-xs font-semibold text-red-600 hover:underline">Excluir</button>
                        </div>
                      </div>

                      {c.queixa_principal && (
                        <p className="text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Queixa principal:</span> {c.queixa_principal}</p>
                      )}
                      {c.historico_doencas && (
                        <p className="text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Histórico de doenças:</span> {c.historico_doencas}</p>
                      )}
                      {c.historico_familiar && (
                        <p className="text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Histórico familiar:</span> {c.historico_familiar}</p>
                      )}
                      {c.medicamentos && (
                        <p className="text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Medicamentos:</span> {c.medicamentos}</p>
                      )}
                      {c.suplementos_em_uso && (
                        <p className="text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Suplementos em uso:</span> {c.suplementos_em_uso}</p>
                      )}
                      {c.observacoes && (
                        <p className="text-sm text-gray-700 dark:text-slate-300"><span className="font-semibold">Observações:</span> {c.observacoes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                {editingId ? 'Editar Consulta' : 'Nova Consulta'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Data da Consulta *
                </label>
                <input
                  type="date"
                  required
                  value={form.data_consulta}
                  onChange={(e) => setForm({ ...form, data_consulta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-gray-50/50 dark:bg-slate-800/70 focus:bg-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Queixa Principal
                </label>
                <textarea
                  value={form.queixa_principal}
                  onChange={(e) => setForm({ ...form, queixa_principal: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Histórico de Doenças
                </label>
                <textarea
                  value={form.historico_doencas}
                  onChange={(e) => setForm({ ...form, historico_doencas: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Histórico Familiar
                </label>
                <textarea
                  value={form.historico_familiar}
                  onChange={(e) => setForm({ ...form, historico_familiar: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Medicamentos
                </label>
                <textarea
                  value={form.medicamentos}
                  onChange={(e) => setForm({ ...form, medicamentos: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Suplementos em Uso
                </label>
                <textarea
                  value={form.suplementos_em_uso}
                  onChange={(e) => setForm({ ...form, suplementos_em_uso: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Observações
                </label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingId ? 'Atualizar Consulta' : 'Salvar Consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
