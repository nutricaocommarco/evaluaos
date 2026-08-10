import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { sanitizarHtmlEditor } from '../RichTextEditor'
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react'

function formatarDataHora(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleString('pt-BR')
}

function formatarResposta(pergunta, resposta) {
  if (!resposta) return '-'
  if (pergunta.tipo === 'caixas_selecao') {
    const lista = resposta.resposta_multipla || []
    return lista.length > 0 ? lista.join(', ') : '-'
  }
  return resposta.resposta || '-'
}

function rotuloConsulta(p) {
  const data = p.data_consulta ? new Date(p.data_consulta).toLocaleDateString('pt-BR') : '-'
  return `${data}${p.queixa_principal ? ` — ${p.queixa_principal}` : ''}`
}

// Mostra as respostas de um envio já respondido: expandir pergunta a
// pergunta, copiar tudo como texto, marcar como revisado, ou transformar em
// anamnese (formato Pergunta/Resposta, reaproveitando o mesmo fluxo de
// escolha de prontuário de Anamnese.jsx).
export default function ModalRespostas({ envio, userId, aoFechar, aoAtualizado }) {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [perguntas, setPerguntas] = useState([])
  const [respostasPorPergunta, setRespostasPorPergunta] = useState({})
  const [abertas, setAbertas] = useState(new Set())
  const [copiado, setCopiado] = useState(false)
  const [marcandoRevisado, setMarcandoRevisado] = useState(false)

  const [mostrarAnamnese, setMostrarAnamnese] = useState(false)
  const [prontuarios, setProntuarios] = useState([])
  const [prontuarioId, setProntuarioId] = useState('')
  const [salvandoAnamnese, setSalvandoAnamnese] = useState(false)
  const [anamneseCriadaId, setAnamneseCriadaId] = useState(null)

  useEffect(() => {
    const carregar = async () => {
      setCarregando(true)
      const { data: etapas } = await supabase
        .from('questionario_etapas')
        .select('*, questionario_perguntas(*)')
        .eq('id_questionario', envio.id_questionario)
        .order('ordem')

      const listaPerguntas = (etapas || [])
        .flatMap((et) => [...(et.questionario_perguntas || [])].sort((a, b) => a.ordem - b.ordem))
      setPerguntas(listaPerguntas)

      const { data: respostas } = await supabase
        .from('questionario_respostas')
        .select('*')
        .eq('id_envio', envio.id)
      const mapa = {}
      ;(respostas || []).forEach((r) => { mapa[r.id_pergunta] = r })
      setRespostasPorPergunta(mapa)

      if (envio.id_paciente) {
        const { data: pront } = await supabase
          .from('prontuarios')
          .select('id, data_consulta, queixa_principal')
          .eq('id_paciente', envio.id_paciente)
          .order('data_consulta', { ascending: false })
        setProntuarios(pront || [])
        setProntuarioId(pront?.[0]?.id ?? '')
      }

      setCarregando(false)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envio.id])

  const toggleAberta = (id) => {
    setAbertas((prev) => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  const expandirTodas = () => setAbertas(new Set(perguntas.map((p) => p.id)))

  const textoCompleto = () =>
    perguntas
      .map((p, i) => `${i + 1}. ${p.texto}\n${formatarResposta(p, respostasPorPergunta[p.id])}`)
      .join('\n\n')

  const handleCopiar = async () => {
    await navigator.clipboard.writeText(textoCompleto())
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const handleMarcarRevisado = async () => {
    setMarcandoRevisado(true)
    const { error } = await supabase
      .from('questionario_envios')
      .update({ status: 'revisado', revisado_em: new Date().toISOString() })
      .eq('id', envio.id)
    setMarcandoRevisado(false)
    if (error) { alert('Erro ao marcar como revisado: ' + error.message); return }
    aoAtualizado({ ...envio, status: 'revisado', revisado_em: new Date().toISOString() })
  }

  const handleTransformarEmAnamnese = async () => {
    if (!prontuarioId) return
    setSalvandoAnamnese(true)

    const htmlBruto = perguntas
      .map((p, i) => `<p><strong>${i + 1}. ${p.texto}</strong></p><p>${formatarResposta(p, respostasPorPergunta[p.id])}</p>`)
      .join('')
    const conteudo = sanitizarHtmlEditor(htmlBruto)

    const { data, error } = await supabase
      .from('anamneses')
      .insert({
        id_paciente: envio.id_paciente,
        id_prontuario: prontuarioId,
        id_avaliador: userId,
        conteudo,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    setSalvandoAnamnese(false)
    if (error) { alert('Erro ao transformar em anamnese: ' + error.message); return }
    setAnamneseCriadaId(data.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Respostas do questionário</h3>
          <button onClick={aoFechar} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400 dark:text-slate-500">Status: </span>{envio.status === 'revisado' ? 'Revisado' : 'Respondido'}</div>
            <div><span className="text-gray-400 dark:text-slate-500">Paciente: </span>{envio.pacientes?.nome_completo || <span className="italic">Sem paciente associado</span>}</div>
            <div><span className="text-gray-400 dark:text-slate-500">Questionário: </span>{envio.questionarios?.titulo}</div>
            <div><span className="text-gray-400 dark:text-slate-500">Respondido em: </span>{formatarDataHora(envio.respondido_em)}</div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleCopiar}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiado' : 'Copiar respostas'}
            </button>
            <button
              onClick={() => setMostrarAnamnese((v) => !v)}
              title={!envio.id_paciente ? 'Vincule um paciente a este envio pra transformar em anamnese' : ''}
              disabled={!envio.id_paciente}
              className="px-3 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40"
            >
              Transformar em anamnese
            </button>
            {envio.status !== 'revisado' && (
              <button
                onClick={handleMarcarRevisado}
                disabled={marcandoRevisado}
                className="px-3 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {marcandoRevisado ? 'Marcando...' : 'Marcar como revisado'}
              </button>
            )}
          </div>

          {mostrarAnamnese && envio.id_paciente && (
            <div className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              {anamneseCriadaId ? (
                <>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 font-semibold">Anamnese criada com sucesso.</p>
                  <button
                    onClick={() => navigate(`/pacientes/${envio.id_paciente}/anamnese`)}
                    className="text-xs font-semibold text-primary-600 hover:underline"
                  >
                    Ver anamnese →
                  </button>
                </>
              ) : prontuarios.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Este paciente ainda não tem nenhuma consulta no Prontuário — registre uma consulta primeiro.
                </p>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Vincular à consulta
                    </label>
                    <select
                      value={prontuarioId}
                      onChange={(e) => setProntuarioId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {prontuarios.map((p) => (
                        <option key={p.id} value={p.id}>{rotuloConsulta(p)}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleTransformarEmAnamnese}
                    disabled={salvandoAnamnese}
                    className="px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
                  >
                    {salvandoAnamnese ? 'Criando...' : 'Criar anamnese'}
                  </button>
                </>
              )}
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-bold text-gray-700 dark:text-slate-300">Respostas</p>
              <button onClick={expandirTodas} className="text-xs font-semibold text-primary-600 hover:underline">Expandir todas</button>
            </div>

            {carregando ? (
              <p className="text-sm text-primary-600 font-semibold text-center py-6 animate-pulse">Carregando respostas...</p>
            ) : (
              <div className="space-y-2">
                {perguntas.map((p, i) => {
                  const aberta = abertas.has(p.id)
                  return (
                    <div key={p.id} className="border border-gray-100 dark:border-slate-800 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleAberta(p.id)}
                        className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                      >
                        {aberta ? <ChevronDown size={15} className="shrink-0 text-gray-400" /> : <ChevronRight size={15} className="shrink-0 text-gray-400" />}
                        {i + 1}. {p.texto}
                      </button>
                      {aberta && (
                        <div className="px-3 pb-3 pl-9 text-sm text-gray-600 dark:text-slate-400">
                          {formatarResposta(p, respostasPorPergunta[p.id])}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-100 dark:border-slate-800">
          <button onClick={aoFechar} className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
