import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft, Trash2, ChevronUp, ChevronDown, Plus, X } from 'lucide-react'

const TIPOS = [
  { valor: 'resposta_curta', label: 'Resposta curta' },
  { valor: 'resposta_longa', label: 'Resposta longa' },
  { valor: 'numero', label: 'Número' },
  { valor: 'multipla_escolha', label: 'Múltipla escolha' },
  { valor: 'caixas_selecao', label: 'Caixas de seleção' },
  { valor: 'escala_linear', label: 'Escala linear' },
]

const TIPOS_COM_OPCOES = ['multipla_escolha', 'caixas_selecao']

function OpcoesEditor({ opcoes, onChange }) {
  const lista = opcoes && opcoes.length > 0 ? opcoes : ['', '']

  const handleAlterar = (idx, valor) => {
    const nova = [...lista]
    nova[idx] = valor
    onChange(nova)
  }

  const handleRemover = (idx) => {
    onChange(lista.filter((_, i) => i !== idx))
  }

  const handleAdicionar = () => onChange([...lista, ''])

  return (
    <div className="space-y-1.5">
      {lista.map((op, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            value={op}
            onChange={(e) => handleAlterar(idx, e.target.value)}
            placeholder={`Opção ${idx + 1}`}
            className="flex-1 px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900"
          />
          {lista.length > 1 && (
            <button onClick={() => handleRemover(idx)} className="text-gray-400 hover:text-red-500 shrink-0"><X size={14} /></button>
          )}
        </div>
      ))}
      <button onClick={handleAdicionar} className="text-xs font-semibold text-primary-600 hover:underline">+ Adicionar opção</button>
    </div>
  )
}

function PerguntaCard({ pergunta, onAtualizar, onExcluir, onMover, podeSubir, podeDescer }) {
  return (
    <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex flex-col shrink-0 pt-1.5">
          <button onClick={() => onMover('cima')} disabled={!podeSubir} className="text-gray-300 dark:text-slate-600 hover:text-primary-600 disabled:opacity-30 leading-none"><ChevronUp size={14} /></button>
          <button onClick={() => onMover('baixo')} disabled={!podeDescer} className="text-gray-300 dark:text-slate-600 hover:text-primary-600 disabled:opacity-30 leading-none"><ChevronDown size={14} /></button>
        </div>
        <input
          type="text"
          value={pergunta.texto}
          onChange={(e) => onAtualizar({ texto: e.target.value })}
          placeholder="Digite a pergunta..."
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900"
        />
        <button onClick={onExcluir} className="text-gray-400 hover:text-red-500 shrink-0 p-2"><Trash2 size={15} /></button>
      </div>

      <div className="flex flex-wrap items-center gap-3 pl-6">
        <select
          value={pergunta.tipo}
          onChange={(e) => {
            const novoTipo = e.target.value
            const patch = { tipo: novoTipo }
            if (TIPOS_COM_OPCOES.includes(novoTipo) && !pergunta.opcoes) patch.opcoes = ['', '']
            if (novoTipo === 'escala_linear' && !pergunta.escala_min) {
              patch.escala_min = 1
              patch.escala_max = 10
              patch.escala_label_min = 'Pouco'
              patch.escala_label_max = 'Muito'
            }
            onAtualizar(patch)
          }}
          className="px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900"
        >
          {TIPOS.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
        </select>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={pergunta.obrigatoria}
            onChange={(e) => onAtualizar({ obrigatoria: e.target.checked })}
            className="w-3.5 h-3.5 accent-primary-600"
          />
          <span className="text-xs font-semibold text-gray-600 dark:text-slate-400">Obrigatória</span>
        </label>
      </div>

      {TIPOS_COM_OPCOES.includes(pergunta.tipo) && (
        <div className="pl-6">
          <OpcoesEditor opcoes={pergunta.opcoes} onChange={(opcoes) => onAtualizar({ opcoes })} />
        </div>
      )}

      {pergunta.tipo === 'escala_linear' && (
        <div className="pl-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">De</label>
            <input type="number" value={pergunta.escala_min ?? 1} onChange={(e) => onAtualizar({ escala_min: Number(e.target.value) })} className="w-16 px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Até</label>
            <input type="number" value={pergunta.escala_max ?? 10} onChange={(e) => onAtualizar({ escala_max: Number(e.target.value) })} className="w-16 px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Rótulo do mínimo</label>
            <input type="text" value={pergunta.escala_label_min ?? ''} onChange={(e) => onAtualizar({ escala_label_min: e.target.value })} className="w-28 px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Rótulo do máximo</label>
            <input type="text" value={pergunta.escala_label_max ?? ''} onChange={(e) => onAtualizar({ escala_label_max: e.target.value })} className="w-28 px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900" />
          </div>
        </div>
      )}
    </div>
  )
}

export default function QuestionarioBuilder({ userId }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [questionario, setQuestionario] = useState(null)
  const [etapas, setEtapas] = useState([])
  const [etapaAtivaId, setEtapaAtivaId] = useState(null)
  const [editandoTitulo, setEditandoTitulo] = useState(false)

  const carregar = async () => {
    setLoading(true)
    const { data: q } = await supabase.from('questionarios').select('*').eq('id', id).maybeSingle()
    setQuestionario(q)

    const { data: et } = await supabase
      .from('questionario_etapas')
      .select('*, questionario_perguntas(*)')
      .eq('id_questionario', id)
      .order('ordem')

    const etapasOrdenadas = (et || []).map((e) => ({
      ...e,
      questionario_perguntas: [...(e.questionario_perguntas || [])].sort((a, b) => a.ordem - b.ordem),
    }))
    setEtapas(etapasOrdenadas)
    setEtapaAtivaId((prev) => prev ?? etapasOrdenadas[0]?.id ?? null)
    setLoading(false)
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleRenomearQuestionario = async (titulo) => {
    setQuestionario((prev) => ({ ...prev, titulo }))
    await supabase.from('questionarios').update({ titulo }).eq('id', id)
  }

  const handleAdicionarEtapa = async () => {
    const { data, error } = await supabase
      .from('questionario_etapas')
      .insert({ id_questionario: id, titulo: `Etapa ${etapas.length + 1}`, ordem: etapas.length })
      .select()
      .single()
    if (error) { alert('Erro ao adicionar etapa: ' + error.message); return }
    setEtapas((prev) => [...prev, { ...data, questionario_perguntas: [] }])
    setEtapaAtivaId(data.id)
  }

  const handleRenomearEtapa = async (etapaId, titulo) => {
    setEtapas((prev) => prev.map((e) => (e.id === etapaId ? { ...e, titulo } : e)))
    await supabase.from('questionario_etapas').update({ titulo }).eq('id', etapaId)
  }

  const handleExcluirEtapa = async (etapaId) => {
    if (!window.confirm('Excluir esta etapa e todas as perguntas dela?')) return
    const { error } = await supabase.from('questionario_etapas').delete().eq('id', etapaId)
    if (error) { alert('Erro ao excluir etapa: ' + error.message); return }
    const restantes = etapas.filter((e) => e.id !== etapaId)
    setEtapas(restantes)
    if (etapaAtivaId === etapaId) setEtapaAtivaId(restantes[0]?.id ?? null)
  }

  const handleMoverEtapa = async (etapaId, direcao) => {
    const idx = etapas.findIndex((e) => e.id === etapaId)
    const alvoIdx = direcao === 'cima' ? idx - 1 : idx + 1
    if (alvoIdx < 0 || alvoIdx >= etapas.length) return
    const atual = etapas[idx]
    const alvo = etapas[alvoIdx]

    const novas = [...etapas]
    novas[idx] = { ...alvo, ordem: atual.ordem }
    novas[alvoIdx] = { ...atual, ordem: alvo.ordem }
    setEtapas(novas.sort((a, b) => a.ordem - b.ordem))

    await supabase.from('questionario_etapas').update({ ordem: alvo.ordem }).eq('id', atual.id)
    await supabase.from('questionario_etapas').update({ ordem: atual.ordem }).eq('id', alvo.id)
  }

  const handleAdicionarPergunta = async (etapaId) => {
    const etapa = etapas.find((e) => e.id === etapaId)
    const { data, error } = await supabase
      .from('questionario_perguntas')
      .insert({ id_etapa: etapaId, tipo: 'resposta_curta', texto: '', ordem: etapa.questionario_perguntas.length })
      .select()
      .single()
    if (error) { alert('Erro ao adicionar pergunta: ' + error.message); return }
    setEtapas((prev) => prev.map((e) => (e.id === etapaId ? { ...e, questionario_perguntas: [...e.questionario_perguntas, data] } : e)))
  }

  const handleAtualizarPergunta = async (etapaId, perguntaId, patch) => {
    setEtapas((prev) => prev.map((e) =>
      e.id !== etapaId ? e : { ...e, questionario_perguntas: e.questionario_perguntas.map((p) => (p.id === perguntaId ? { ...p, ...patch } : p)) }
    ))
    await supabase.from('questionario_perguntas').update(patch).eq('id', perguntaId)
  }

  const handleExcluirPergunta = async (etapaId, perguntaId) => {
    if (!window.confirm('Excluir esta pergunta?')) return
    const { error } = await supabase.from('questionario_perguntas').delete().eq('id', perguntaId)
    if (error) { alert('Erro ao excluir pergunta: ' + error.message); return }
    setEtapas((prev) => prev.map((e) =>
      e.id !== etapaId ? e : { ...e, questionario_perguntas: e.questionario_perguntas.filter((p) => p.id !== perguntaId) }
    ))
  }

  const handleMoverPergunta = async (etapaId, perguntaId, direcao) => {
    const etapa = etapas.find((e) => e.id === etapaId)
    const idx = etapa.questionario_perguntas.findIndex((p) => p.id === perguntaId)
    const alvoIdx = direcao === 'cima' ? idx - 1 : idx + 1
    if (alvoIdx < 0 || alvoIdx >= etapa.questionario_perguntas.length) return
    const atual = etapa.questionario_perguntas[idx]
    const alvo = etapa.questionario_perguntas[alvoIdx]

    const novasPerguntas = [...etapa.questionario_perguntas]
    novasPerguntas[idx] = { ...alvo, ordem: atual.ordem }
    novasPerguntas[alvoIdx] = { ...atual, ordem: alvo.ordem }
    novasPerguntas.sort((a, b) => a.ordem - b.ordem)
    setEtapas((prev) => prev.map((e) => (e.id === etapaId ? { ...e, questionario_perguntas: novasPerguntas } : e)))

    await supabase.from('questionario_perguntas').update({ ordem: alvo.ordem }).eq('id', atual.id)
    await supabase.from('questionario_perguntas').update({ ordem: atual.ordem }).eq('id', alvo.id)
  }

  if (loading) {
    return <p className="text-sm text-primary-600 font-semibold text-center py-10 animate-pulse">Carregando questionário...</p>
  }

  if (!questionario) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <p className="text-gray-600 dark:text-slate-300 font-semibold">Questionário não encontrado.</p>
        <button onClick={() => navigate('/questionarios')} className="text-primary-600 font-semibold text-sm hover:underline">← Voltar</button>
      </div>
    )
  }

  const etapaAtiva = etapas.find((e) => e.id === etapaAtivaId)

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/questionarios')} className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 p-1">
          <ArrowLeft size={20} />
        </button>
        {editandoTitulo ? (
          <input
            autoFocus
            type="text"
            value={questionario.titulo}
            onChange={(e) => setQuestionario((prev) => ({ ...prev, titulo: e.target.value }))}
            onBlur={(e) => { setEditandoTitulo(false); handleRenomearQuestionario(e.target.value || 'Questionário sem título') }}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
            className="text-xl font-bold text-gray-800 dark:text-slate-100 bg-transparent border-b-2 border-primary-500 outline-none"
          />
        ) : (
          <button onClick={() => setEditandoTitulo(true)} className="text-xl font-bold text-gray-800 dark:text-slate-100 hover:text-primary-600 flex items-center gap-2">
            {questionario.titulo} <span className="text-sm">✏️</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Etapas</p>
          {etapas.map((etapa, idx) => (
            <div
              key={etapa.id}
              className={`group flex items-center gap-1.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                etapaAtivaId === etapa.id ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
              onClick={() => setEtapaAtivaId(etapa.id)}
            >
              <span className="flex-1 text-sm font-semibold truncate">{etapa.titulo}</span>
              <button onClick={(e) => { e.stopPropagation(); handleMoverEtapa(etapa.id, 'cima') }} disabled={idx === 0} className="opacity-0 group-hover:opacity-100 disabled:opacity-0 shrink-0"><ChevronUp size={13} /></button>
              <button onClick={(e) => { e.stopPropagation(); handleMoverEtapa(etapa.id, 'baixo') }} disabled={idx === etapas.length - 1} className="opacity-0 group-hover:opacity-100 disabled:opacity-0 shrink-0"><ChevronDown size={13} /></button>
              <button onClick={(e) => { e.stopPropagation(); handleExcluirEtapa(etapa.id) }} className="opacity-0 group-hover:opacity-100 shrink-0"><Trash2 size={13} /></button>
            </div>
          ))}
          <button
            onClick={handleAdicionarEtapa}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-500 dark:text-slate-400 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            <Plus size={14} /> Adicionar etapa
          </button>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Configurações da etapa</p>
          {!etapaAtiva ? (
            <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-16 text-center">
              <p className="text-2xl mb-2">-o-</p>
              <p className="text-sm font-bold text-gray-700 dark:text-slate-300">Nenhuma etapa adicionada</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Adicione uma etapa para começar a configurar o questionário.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={etapaAtiva.titulo}
                onChange={(e) => handleRenomearEtapa(etapaAtiva.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900"
              />

              {etapaAtiva.questionario_perguntas.map((pergunta, idx) => (
                <PerguntaCard
                  key={pergunta.id}
                  pergunta={pergunta}
                  onAtualizar={(patch) => handleAtualizarPergunta(etapaAtiva.id, pergunta.id, patch)}
                  onExcluir={() => handleExcluirPergunta(etapaAtiva.id, pergunta.id)}
                  onMover={(direcao) => handleMoverPergunta(etapaAtiva.id, pergunta.id, direcao)}
                  podeSubir={idx > 0}
                  podeDescer={idx < etapaAtiva.questionario_perguntas.length - 1}
                />
              ))}

              <button
                onClick={() => handleAdicionarPergunta(etapaAtiva.id)}
                className="w-full flex items-center justify-center gap-1.5 py-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-500 dark:text-slate-400 hover:border-primary-400 hover:text-primary-600 transition-colors"
              >
                <Plus size={15} /> Adicionar pergunta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
