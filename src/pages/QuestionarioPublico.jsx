import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function CampoResposta({ pergunta, valor, onChange }) {
  switch (pergunta.tipo) {
    case 'resposta_longa':
      return (
        <textarea
          rows={4}
          value={valor || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      )
    case 'numero':
      return (
        <input
          type="number"
          value={valor ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        />
      )
    case 'multipla_escolha':
      return (
        <div className="space-y-2">
          {(pergunta.opcoes || []).filter(Boolean).map((op) => (
            <label key={op} className="flex items-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
              <input type="radio" name={`pergunta_${pergunta.id}`} checked={valor === op} onChange={() => onChange(op)} className="w-4 h-4 accent-emerald-600" />
              <span className="text-sm text-gray-700">{op}</span>
            </label>
          ))}
        </div>
      )
    case 'caixas_selecao': {
      const selecionadas = Array.isArray(valor) ? valor : []
      const alternar = (op) => {
        onChange(selecionadas.includes(op) ? selecionadas.filter((v) => v !== op) : [...selecionadas, op])
      }
      return (
        <div className="space-y-2">
          {(pergunta.opcoes || []).filter(Boolean).map((op) => (
            <label key={op} className="flex items-center gap-2.5 px-4 py-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
              <input type="checkbox" checked={selecionadas.includes(op)} onChange={() => alternar(op)} className="w-4 h-4 accent-emerald-600" />
              <span className="text-sm text-gray-700">{op}</span>
            </label>
          ))}
        </div>
      )
    }
    case 'escala_linear': {
      const min = pergunta.escala_min ?? 1
      const max = pergunta.escala_max ?? 10
      const numeros = Array.from({ length: max - min + 1 }, (_, i) => min + i)
      return (
        <div>
          <div className="flex flex-wrap gap-2">
            {numeros.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(String(n))}
                className={`w-11 h-11 rounded-lg text-sm font-bold border transition-colors ${
                  String(valor) === String(n) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-400'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {(pergunta.escala_label_min || pergunta.escala_label_max) && (
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{pergunta.escala_label_min ? `(${min}) ${pergunta.escala_label_min}` : ''}</span>
              <span>{pergunta.escala_label_max ? `(${max}) ${pergunta.escala_label_max}` : ''}</span>
            </div>
          )}
        </div>
      )
    }
    case 'resposta_curta':
    default:
      return (
        <input
          type="text"
          value={valor || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        />
      )
  }
}

export default function QuestionarioPublico() {
  const { tokenUrl } = useParams()
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [envio, setEnvio] = useState(null)
  const [etapas, setEtapas] = useState([])
  const [etapaIdx, setEtapaIdx] = useState(0)
  const [respostas, setRespostas] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      const { data: envioData } = await supabase
        .from('questionario_envios')
        .select('*, questionarios(id, titulo)')
        .eq('token_publico', tokenUrl)
        .maybeSingle()

      if (!envioData) { setErro('Link inválido ou expirado.'); setLoading(false); return }
      setEnvio(envioData)

      if (envioData.status !== 'aguardando') { setLoading(false); return }

      const { data: et } = await supabase
        .from('questionario_etapas')
        .select('*, questionario_perguntas(*)')
        .eq('id_questionario', envioData.id_questionario)
        .order('ordem')

      setEtapas((et || []).map((e) => ({ ...e, questionario_perguntas: [...(e.questionario_perguntas || [])].sort((a, b) => a.ordem - b.ordem) })))
      setLoading(false)
    }
    carregar()
  }, [tokenUrl])

  const handleChangeResposta = (perguntaId, valor) => {
    setRespostas((prev) => ({ ...prev, [perguntaId]: valor }))
  }

  const etapaAtual = etapas[etapaIdx]
  const faltamObrigatorias = etapaAtual?.questionario_perguntas.filter((p) => {
    if (!p.obrigatoria) return false
    const v = respostas[p.id]
    return v === undefined || v === '' || (Array.isArray(v) && v.length === 0)
  }) || []

  const handleAvancar = () => {
    if (faltamObrigatorias.length > 0) { alert('Responda as perguntas obrigatórias antes de continuar.'); return }
    setEtapaIdx((i) => i + 1)
  }

  const handleEnviar = async () => {
    if (faltamObrigatorias.length > 0) { alert('Responda as perguntas obrigatórias antes de enviar.'); return }
    setEnviando(true)

    const todasPerguntas = etapas.flatMap((e) => e.questionario_perguntas)
    const inserts = todasPerguntas
      .filter((p) => respostas[p.id] !== undefined && respostas[p.id] !== '' && !(Array.isArray(respostas[p.id]) && respostas[p.id].length === 0))
      .map((p) => ({
        id_envio: envio.id,
        id_pergunta: p.id,
        resposta: Array.isArray(respostas[p.id]) ? null : String(respostas[p.id]),
        resposta_multipla: Array.isArray(respostas[p.id]) ? respostas[p.id] : null,
      }))

    if (inserts.length > 0) {
      const { error: errRespostas } = await supabase.from('questionario_respostas').insert(inserts)
      if (errRespostas) { setEnviando(false); alert('Erro ao enviar respostas: ' + errRespostas.message); return }
    }

    const { error: errEnvio } = await supabase
      .from('questionario_envios')
      .update({ status: 'respondido', respondido_em: new Date().toISOString() })
      .eq('id', envio.id)

    setEnviando(false)
    if (errEnvio) { alert('Erro ao concluir envio: ' + errEnvio.message); return }
    setEnviado(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-emerald-600 font-bold animate-pulse">Carregando questionário...</p>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-gray-700 font-semibold">{erro}</p>
        </div>
      </div>
    )
  }

  if (envio.status !== 'aguardando' && !enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center space-y-2">
          <span className="text-3xl">✅</span>
          <p className="text-gray-800 font-bold">Você já respondeu este questionário.</p>
          <p className="text-sm text-gray-500">Obrigado pela participação!</p>
        </div>
      </div>
    )
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center space-y-2">
          <span className="text-3xl">🎉</span>
          <p className="text-gray-800 font-bold">Respostas enviadas com sucesso!</p>
          <p className="text-sm text-gray-500">Obrigado por responder — pode fechar esta página.</p>
        </div>
      </div>
    )
  }

  const ultimaEtapa = etapaIdx === etapas.length - 1

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-black text-gray-800">{envio.questionarios?.titulo}</h1>
          {etapas.length > 1 && (
            <p className="text-xs text-gray-400 mt-1">Etapa {etapaIdx + 1} de {etapas.length}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
          {etapaAtual?.titulo && etapas.length > 1 && (
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{etapaAtual.titulo}</h2>
          )}

          {etapaAtual?.questionario_perguntas.map((pergunta) => (
            <div key={pergunta.id}>
              <label className="block text-sm font-bold text-gray-800 mb-2">
                {pergunta.texto} {pergunta.obrigatoria && <span className="text-red-500">*</span>}
              </label>
              <CampoResposta pergunta={pergunta} valor={respostas[pergunta.id]} onChange={(v) => handleChangeResposta(pergunta.id, v)} />
            </div>
          ))}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setEtapaIdx((i) => i - 1)}
              disabled={etapaIdx === 0}
              className="px-5 py-2.5 text-gray-500 text-sm font-semibold disabled:opacity-0"
            >
              ← Voltar
            </button>
            {ultimaEtapa ? (
              <button
                type="button"
                onClick={handleEnviar}
                disabled={enviando}
                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow hover:bg-emerald-700 disabled:opacity-50"
              >
                {enviando ? 'Enviando...' : 'Enviar respostas'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAvancar}
                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow hover:bg-emerald-700"
              >
                Avançar →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
