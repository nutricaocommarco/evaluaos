import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from '../components/SidebarPaciente'
import RichTextEditor, { sanitizarHtmlEditor } from '../components/RichTextEditor'
import GeradorPdfNutricional from '../components/GeradorPdfNutricional'
import InterruptorVisibilidade from '../components/InterruptorVisibilidade'
import { ChevronDown, ChevronRight, FileDown } from 'lucide-react'

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
  const [abertos, setAbertos] = useState(new Set())

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(CAMPOS_VAZIOS)
  const [saving, setSaving] = useState(false)
  const [showGeradorPdf, setShowGeradorPdf] = useState(false)

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

  const toggleAberto = (orientacaoId) => {
    setAbertos((prev) => {
      const novo = new Set(prev)
      if (novo.has(orientacaoId)) novo.delete(orientacaoId)
      else novo.add(orientacaoId)
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
      titulo: form.titulo || 'Orientação',
      conteudo: conteudoLimpo,
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
        .insert({ id_avaliador: userId, titulo: form.titulo || 'Modelo', conteudo: conteudoLimpo })
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

  const toggleVisivel = async (orientacao) => {
    const novoValor = !orientacao.visivel_paciente
    const { error } = await supabase.from('orientacoes_nutricionais').update({ visivel_paciente: novoValor }).eq('id', orientacao.id)
    if (error) { alert('Erro ao atualizar visibilidade: ' + error.message); return }
    setOrientacoes((prev) => prev.map((o) => (o.id === orientacao.id ? { ...o, visivel_paciente: novoValor } : o)))
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
        <>
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Orientações Nutricionais — {paciente.nome_completo}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Um ou mais documentos de texto — tudo num só ou separados por assunto, como preferir
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setShowGeradorPdf(true)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <FileDown size={15} /> Gerar PDF
                </button>
                <button
                  onClick={abrirNovaOrientacao}
                  className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors"
                >
                  + Nova Orientação
                </button>
              </div>
            </div>

            {orientacoes.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhuma orientação registrada ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orientacoes.map((o) => {
                  const aberto = abertos.has(o.id)
                  return (
                    <div key={o.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="flex justify-between items-center gap-3 p-4">
                        <button
                          type="button"
                          onClick={() => toggleAberto(o.id)}
                          className="flex-1 flex items-center gap-2 text-left min-w-0"
                        >
                          {aberto ? (
                            <ChevronDown size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span className="text-sm font-black text-gray-800 dark:text-slate-100 truncate block">{o.titulo}</span>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500">Criada em {formatarDataHora(o.created_at)}</p>
                          </div>
                        </button>
                        <div className="flex items-center gap-3 shrink-0">
                          <InterruptorVisibilidade ativo={o.visivel_paciente} onToggle={() => toggleVisivel(o)} />
                          <button onClick={() => abrirEdicaoOrientacao(o)} className="text-xs font-semibold text-primary-600 hover:underline">Editar</button>
                          <button onClick={() => handleExcluir(o.id)} className="text-xs font-semibold text-red-600 hover:underline">Excluir</button>
                        </div>
                      </div>
                      {aberto && (
                        <div className="px-4 pb-4">
                          {o.conteudo ? (
                            <div className="rte-html text-sm text-gray-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: o.conteudo }} />
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
                {editingId ? 'Editar Orientação' : 'Nova Orientação'}
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

      {showGeradorPdf && (
        <GeradorPdfNutricional
          paciente={paciente}
          avaliadorUserId={userId}
          aoFechar={() => setShowGeradorPdf(false)}
        />
      )}
    </div>
  )
}
