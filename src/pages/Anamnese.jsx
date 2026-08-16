import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from '../components/SidebarPaciente'
import RichTextEditor, { sanitizarHtmlEditor } from '../components/RichTextEditor'
import CampoImagem from '../components/imagens/CampoImagem'

const CAMPOS_VAZIOS = {
  id_prontuario: '',
  conteudo: '',
  salvarComoModelo: false,
  tituloModelo: '',
  imagem_url: null,
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR')
}

function formatarDataHora(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleString('pt-BR')
}

function rotuloConsulta(prontuario) {
  if (!prontuario) return 'Consulta removida'
  const data = formatarData(prontuario.data_consulta)
  return prontuario.queixa_principal ? `${data} — ${prontuario.queixa_principal}` : data
}

export default function Anamnese({ userId }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [itemAtivo, setItemAtivo] = useState('anamneses')
  const [loading, setLoading] = useState(true)

  const [anamneses, setAnamneses] = useState([])
  const [prontuarios, setProntuarios] = useState([])
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
      const { data: listaProntuarios } = await supabase
        .from('prontuarios')
        .select('id, data_consulta, queixa_principal')
        .eq('id_paciente', id)
        .order('data_consulta', { ascending: false })
      setProntuarios(listaProntuarios || [])

      const { data: listaAnamneses } = await supabase
        .from('anamneses')
        .select('*, prontuarios(id, data_consulta, queixa_principal)')
        .eq('id_paciente', id)
        .order('created_at', { ascending: false })
      setAnamneses(listaAnamneses || [])

      const { data: listaModelos } = await supabase
        .from('modelos_anamneses')
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

  const abrirNovaAnamnese = () => {
    setEditingId(null)
    setForm({ id_prontuario: prontuarios[0]?.id ?? '', conteudo: '', salvarComoModelo: false, tituloModelo: '', imagem_url: null })
    setShowModal(true)
  }

  const abrirEdicaoAnamnese = (a) => {
    setEditingId(a.id)
    setForm({ id_prontuario: a.id_prontuario ?? '', conteudo: a.conteudo || '', salvarComoModelo: false, tituloModelo: '', imagem_url: a.imagem_url || null })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.id_prontuario) return
    setSaving(true)

    const conteudoLimpo = sanitizarHtmlEditor(form.conteudo)
    const payload = {
      id_prontuario: form.id_prontuario,
      conteudo: conteudoLimpo,
      imagem_url: form.imagem_url || null,
      updated_at: new Date().toISOString(),
    }

    if (editingId) {
      const { error } = await supabase.from('anamneses').update(payload).eq('id', editingId)
      if (error) { setSaving(false); alert('Erro ao atualizar anamnese: ' + error.message); return }
    } else {
      const { error } = await supabase
        .from('anamneses')
        .insert({ ...payload, id_paciente: id, id_avaliador: userId })
      if (error) { setSaving(false); alert('Erro ao salvar anamnese: ' + error.message); return }
    }

    if (form.salvarComoModelo && form.tituloModelo.trim()) {
      await supabase
        .from('modelos_anamneses')
        .insert({ id_avaliador: userId, titulo: form.tituloModelo.trim(), conteudo: conteudoLimpo })
    }

    setSaving(false)
    setShowModal(false)
    carregarDados()
  }

  const handleExcluir = async (anamneseId) => {
    if (!window.confirm('Excluir esta anamnese? Essa ação não pode ser desfeita.')) return
    const { error } = await supabase.from('anamneses').delete().eq('id', anamneseId)
    if (error) { alert('Erro ao excluir anamnese: ' + error.message); return }
    setAnamneses((prev) => prev.filter((a) => a.id !== anamneseId))
  }

  const handleExcluirModelo = async (modeloId) => {
    if (!window.confirm('Excluir este modelo? Isso não afeta anamneses já criadas a partir dele.')) return
    const { error } = await supabase.from('modelos_anamneses').delete().eq('id', modeloId)
    if (error) { alert('Erro ao excluir modelo: ' + error.message); return }
    setModelos((prev) => prev.filter((m) => m.id !== modeloId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-primary-600 font-bold animate-pulse">Carregando anamneses...</p>
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
                <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Anamnese — {paciente.nome_completo}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Histórico de anamneses, cada uma vinculada a uma consulta do Prontuário</p>
              </div>
              <button
                onClick={abrirNovaAnamnese}
                disabled={prontuarios.length === 0}
                title={prontuarios.length === 0 ? 'Registre uma consulta no Prontuário primeiro' : ''}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Nova Anamnese
              </button>
            </div>

            {prontuarios.length === 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl text-sm text-amber-700 dark:text-amber-400">
                Toda anamnese precisa estar vinculada a uma consulta. Registre a primeira consulta no{' '}
                <button onClick={() => navigate(`/pacientes/${id}/prontuario`)} className="font-semibold underline">
                  Prontuário
                </button>{' '}
                pra poder criar uma anamnese.
              </div>
            )}

            {anamneses.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhuma anamnese registrada ainda.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200 dark:bg-slate-700"></div>

                {anamneses.map((a) => (
                  <div key={a.id} className="relative">
                    <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-primary-600 border-2 border-white dark:border-slate-950"></div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-2">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-sm font-black text-gray-800 dark:text-slate-100">{rotuloConsulta(a.prontuarios)}</span>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500">Registrada em {formatarDataHora(a.created_at)}</p>
                        </div>
                        <div className="flex gap-3 shrink-0">
                          <button onClick={() => abrirEdicaoAnamnese(a)} className="text-xs font-semibold text-primary-600 hover:underline">Editar</button>
                          <button onClick={() => handleExcluir(a.id)} className="text-xs font-semibold text-red-600 hover:underline">Excluir</button>
                        </div>
                      </div>
                      {a.imagem_url && (
                        <img src={a.imagem_url} alt="" className="w-full max-w-xs rounded-xl border border-gray-100 dark:border-slate-800 object-cover" />
                      )}
                      {a.conteudo ? (
                        <div className="rte-html text-sm text-gray-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: a.conteudo }} />
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-slate-500">-</p>
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
                {editingId ? 'Editar Anamnese' : 'Nova Anamnese'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Consulta vinculada *
                </label>
                <select
                  required
                  value={form.id_prontuario}
                  onChange={(e) => setForm({ ...form, id_prontuario: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-gray-50/50 dark:bg-slate-800/70 focus:bg-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="" disabled>Selecione a consulta...</option>
                  {prontuarios.map((p) => (
                    <option key={p.id} value={p.id}>{rotuloConsulta(p)}</option>
                  ))}
                </select>
              </div>

              <CampoImagem valor={form.imagem_url} onChange={(url) => setForm((f) => ({ ...f, imagem_url: url }))} />

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Anamnese
                </label>
                <RichTextEditor
                  initialHtml={form.conteudo}
                  onChange={(html) => setForm((f) => ({ ...f, conteudo: html }))}
                  modelos={modelos}
                  onExcluirModelo={handleExcluirModelo}
                  placeholder="Histórico de saúde, hábitos alimentares, rotina, queixas, contexto familiar e social, expectativas do paciente..."
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={form.salvarComoModelo}
                    onChange={(e) => setForm({ ...form, salvarComoModelo: e.target.checked })}
                    className="w-4 h-4 accent-primary-600"
                  />
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Salvar também como modelo (reutilizável em outros pacientes)</span>
                </label>
                {form.salvarComoModelo && (
                  <input
                    type="text"
                    required
                    value={form.tituloModelo}
                    onChange={(e) => setForm({ ...form, tituloModelo: e.target.value })}
                    placeholder="Nome do modelo..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}
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
                  disabled={saving || !form.id_prontuario}
                  className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingId ? 'Atualizar Anamnese' : 'Salvar Anamnese'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
