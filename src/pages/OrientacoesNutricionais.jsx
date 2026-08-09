import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from '../components/SidebarPaciente'
import EmConstrucao from '../components/EmConstrucao'

const CAMPOS_VAZIOS = { titulo: 'Orientação', conteudo: '', salvarComoModelo: false }

function formatarDataHora(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleString('pt-BR')
}

export default function OrientacoesNutricionais({ userId }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [itemAtivo, setItemAtivo] = useState('orientacoes')
  const [loading, setLoading] = useState(true)

  const [orientacoes, setOrientacoes] = useState([])
  const [modelos, setModelos] = useState([])

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(CAMPOS_VAZIOS)
  const [saving, setSaving] = useState(false)

  const carregarDados = async () => {
    setLoading(true)

    const { data: pac } = await supabase.from('pacientes').select('*').eq('id', id).maybeSingle()
    setPaciente(pac || null)

    if (pac) {
      const { data: lista } = await supabase
        .from('orientacoes_nutricionais')
        .select('*')
        .eq('id_paciente', id)
        .order('created_at', { ascending: false })
      setOrientacoes(lista || [])

      const { data: listaModelos } = await supabase
        .from('modelos_orientacoes')
        .select('*')
        .order('titulo')
      setModelos(listaModelos || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const abrirNovaOrientacao = () => {
    setEditingId(null)
    setForm(CAMPOS_VAZIOS)
    setShowModal(true)
  }

  const abrirEdicaoOrientacao = (o) => {
    setEditingId(o.id)
    setForm({ titulo: o.titulo || 'Orientação', conteudo: o.conteudo || '', salvarComoModelo: false })
    setShowModal(true)
  }

  const handleEscolherModelo = (modeloId) => {
    const modelo = modelos.find((m) => String(m.id) === String(modeloId))
    if (!modelo) return
    setForm((prev) => ({ ...prev, titulo: modelo.titulo, conteudo: modelo.conteudo || '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const payload = {
      titulo: form.titulo || 'Orientação',
      conteudo: form.conteudo,
      updated_at: new Date().toISOString(),
    }

    if (editingId) {
      const { error } = await supabase.from('orientacoes_nutricionais').update(payload).eq('id', editingId)
      if (error) { setSaving(false); alert('Erro ao atualizar orientação: ' + error.message); return }
    } else {
      const { error } = await supabase
        .from('orientacoes_nutricionais')
        .insert({ ...payload, id_paciente: id, id_avaliador: userId })
      if (error) { setSaving(false); alert('Erro ao salvar orientação: ' + error.message); return }
    }

    if (form.salvarComoModelo) {
      await supabase
        .from('modelos_orientacoes')
        .insert({ id_avaliador: userId, titulo: form.titulo || 'Modelo', conteudo: form.conteudo })
    }

    setSaving(false)
    setShowModal(false)
    carregarDados()
  }

  const handleExcluir = async (orientacaoId) => {
    if (!window.confirm('Excluir esta orientação? Essa ação não pode ser desfeita.')) return
    const { error } = await supabase.from('orientacoes_nutricionais').delete().eq('id', orientacaoId)
    if (error) { alert('Erro ao excluir orientação: ' + error.message); return }
    setOrientacoes((prev) => prev.filter((o) => o.id !== orientacaoId))
  }

  const handleExcluirModelo = async (modeloId) => {
    if (!window.confirm('Excluir este modelo? Isso não afeta orientações já criadas a partir dele.')) return
    const { error } = await supabase.from('modelos_orientacoes').delete().eq('id', modeloId)
    if (error) { alert('Erro ao excluir modelo: ' + error.message); return }
    setModelos((prev) => prev.filter((m) => m.id !== modeloId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-primary-600 font-bold animate-pulse">Carregando orientações...</p>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <p className="text-gray-600 dark:text-slate-300 font-semibold">Paciente não encontrado.</p>
        <button onClick={() => navigate('/pacientes')} className="text-primary-600 font-semibold text-sm hover:underline">
          ← Voltar para Pacientes
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
      <SidebarPaciente paciente={paciente} itemAtivo={itemAtivo} onSelecionarItem={setItemAtivo} />

      <div className="flex-1 min-w-0 space-y-4">
        {itemAtivo !== 'orientacoes' ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm min-h-[400px]">
            <EmConstrucao />
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Orientações Nutricionais — {paciente.nome_completo}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Um ou mais documentos de texto — tudo num só ou separados por assunto, como preferir
                </p>
              </div>
              <button
                onClick={abrirNovaOrientacao}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors shrink-0"
              >
                + Nova Orientação
              </button>
            </div>

            {orientacoes.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhuma orientação registrada ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orientacoes.map((o) => (
                  <div key={o.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="text-sm font-black text-gray-800 dark:text-slate-100">{o.titulo}</span>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500">Criada em {formatarDataHora(o.created_at)}</p>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button onClick={() => abrirEdicaoOrientacao(o)} className="text-xs font-semibold text-primary-600 hover:underline">Editar</button>
                        <button onClick={() => handleExcluir(o.id)} className="text-xs font-semibold text-red-600 hover:underline">Excluir</button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{o.conteudo || '-'}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                {editingId ? 'Editar Orientação' : 'Nova Orientação'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {!editingId && modelos.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Começar de um modelo (opcional)
                  </label>
                  <select
                    defaultValue=""
                    onChange={(e) => handleEscolherModelo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-gray-50/50 dark:bg-slate-800/70 focus:bg-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Começar em branco</option>
                    {modelos.map((m) => (
                      <option key={m.id} value={m.id}>{m.titulo}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                    {modelos.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleExcluirModelo(m.id)}
                        className="text-[10px] text-gray-400 dark:text-slate-500 hover:text-red-600"
                      >
                        remover modelo "{m.titulo}"
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Texto
                </label>
                <textarea
                  value={form.conteudo}
                  onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                  rows={14}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 resize-y"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={form.salvarComoModelo}
                  onChange={(e) => setForm({ ...form, salvarComoModelo: e.target.checked })}
                  className="w-4 h-4 accent-primary-600"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Salvar também como modelo (reutilizável em outros pacientes)</span>
              </label>

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
                  {saving ? 'Salvando...' : editingId ? 'Atualizar Orientação' : 'Salvar Orientação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
