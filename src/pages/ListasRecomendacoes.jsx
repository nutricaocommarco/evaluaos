import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from '../components/SidebarPaciente'
import RichTextEditor, { sanitizarHtmlEditor } from '../components/RichTextEditor'
import { ChevronDown, ChevronRight } from 'lucide-react'

const CAMPOS_VAZIOS = { titulo: 'Lista', conteudo: '', salvarComoModelo: false }

function formatarDataHora(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleString('pt-BR')
}

export default function ListasRecomendacoes({ userId }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [itemAtivo, setItemAtivo] = useState('listas')
  const [loading, setLoading] = useState(true)

  const [listas, setListas] = useState([])
  const [modelos, setModelos] = useState([])
  const [abertos, setAbertos] = useState(new Set())

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
        .from('listas_recomendacoes')
        .select('*')
        .eq('id_paciente', id)
        .order('created_at', { ascending: false })
      setListas(lista || [])

      const { data: listaModelos } = await supabase
        .from('modelos_listas_recomendacoes')
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

  const abrirNovaLista = () => {
    setEditingId(null)
    setForm(CAMPOS_VAZIOS)
    setShowModal(true)
  }

  const abrirEdicaoLista = (l) => {
    setEditingId(l.id)
    setForm({ titulo: l.titulo || 'Lista', conteudo: l.conteudo || '', salvarComoModelo: false })
    setShowModal(true)
  }

  const toggleAberto = (listaId) => {
    setAbertos((prev) => {
      const novo = new Set(prev)
      if (novo.has(listaId)) novo.delete(listaId)
      else novo.add(listaId)
      return novo
    })
  }

  const handleEscolherModelo = (modelo) => {
    setForm((prev) => ({ ...prev, titulo: modelo.titulo }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const conteudoLimpo = sanitizarHtmlEditor(form.conteudo)
    const payload = {
      titulo: form.titulo || 'Lista',
      conteudo: conteudoLimpo,
      updated_at: new Date().toISOString(),
    }

    if (editingId) {
      const { error } = await supabase.from('listas_recomendacoes').update(payload).eq('id', editingId)
      if (error) { setSaving(false); alert('Erro ao atualizar lista: ' + error.message); return }
    } else {
      const { error } = await supabase
        .from('listas_recomendacoes')
        .insert({ ...payload, id_paciente: id, id_avaliador: userId })
      if (error) { setSaving(false); alert('Erro ao salvar lista: ' + error.message); return }
    }

    if (form.salvarComoModelo) {
      await supabase
        .from('modelos_listas_recomendacoes')
        .insert({ id_avaliador: userId, titulo: form.titulo || 'Modelo', conteudo: conteudoLimpo })
    }

    setSaving(false)
    setShowModal(false)
    carregarDados()
  }

  const handleExcluir = async (listaId) => {
    if (!window.confirm('Excluir esta lista? Essa ação não pode ser desfeita.')) return
    const { error } = await supabase.from('listas_recomendacoes').delete().eq('id', listaId)
    if (error) { alert('Erro ao excluir lista: ' + error.message); return }
    setListas((prev) => prev.filter((l) => l.id !== listaId))
  }

  const handleExcluirModelo = async (modeloId) => {
    if (!window.confirm('Excluir este modelo? Isso não afeta listas já criadas a partir dele.')) return
    const { error } = await supabase.from('modelos_listas_recomendacoes').delete().eq('id', modeloId)
    if (error) { alert('Erro ao excluir modelo: ' + error.message); return }
    setModelos((prev) => prev.filter((m) => m.id !== modeloId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-primary-600 font-bold animate-pulse">Carregando listas...</p>
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
        <>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Listas de Recomendações — {paciente.nome_completo}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Uma ou mais listas de recomendações — tudo numa só ou separadas por assunto, como preferir
                </p>
              </div>
              <button
                onClick={abrirNovaLista}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors shrink-0"
              >
                + Nova Lista
              </button>
            </div>

            {listas.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhuma lista registrada ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {listas.map((l) => {
                  const aberto = abertos.has(l.id)
                  return (
                    <div key={l.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="flex justify-between items-center gap-3 p-4">
                        <button
                          type="button"
                          onClick={() => toggleAberto(l.id)}
                          className="flex-1 flex items-center gap-2 text-left min-w-0"
                        >
                          {aberto ? (
                            <ChevronDown size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span className="text-sm font-black text-gray-800 dark:text-slate-100 truncate block">{l.titulo}</span>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500">Criada em {formatarDataHora(l.created_at)}</p>
                          </div>
                        </button>
                        <div className="flex gap-3 shrink-0">
                          <button onClick={() => abrirEdicaoLista(l)} className="text-xs font-semibold text-primary-600 hover:underline">Editar</button>
                          <button onClick={() => handleExcluir(l.id)} className="text-xs font-semibold text-red-600 hover:underline">Excluir</button>
                        </div>
                      </div>
                      {aberto && (
                        <div className="px-4 pb-4">
                          {l.conteudo ? (
                            <div className="rte-html text-sm text-gray-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: l.conteudo }} />
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-slate-500">-</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
        </>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                {editingId ? 'Editar Lista' : 'Nova Lista'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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
                <RichTextEditor
                  initialHtml={form.conteudo}
                  onChange={(html) => setForm((f) => ({ ...f, conteudo: html }))}
                  modelos={modelos}
                  onEscolherModelo={handleEscolherModelo}
                  onExcluirModelo={handleExcluirModelo}
                  placeholder="Ex.: liste os itens permitidos, evitados, horários sugeridos..."
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
                  {saving ? 'Salvando...' : editingId ? 'Atualizar Lista' : 'Salvar Lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
