import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import ListaEnvios from '../components/questionarios/ListaEnvios'
import ModalEnviarQuestionario from '../components/questionarios/ModalEnviarQuestionario'
import ModalRespostas from '../components/questionarios/ModalRespostas'
import { Link2, MoreHorizontal } from 'lucide-react'

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

export default function Questionarios({ userId }) {
  const navigate = useNavigate()
  const [aba, setAba] = useState('questionarios')
  const [loading, setLoading] = useState(true)
  const [questionarios, setQuestionarios] = useState([])
  const [envios, setEnvios] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [menuAbertoId, setMenuAbertoId] = useState(null)

  const [modalEnviarPara, setModalEnviarPara] = useState(null) // { questionarioId } | null
  const [modalRespostasEnvio, setModalRespostasEnvio] = useState(null)

  const carregarTudo = async () => {
    setLoading(true)
    const [qs, es, ps] = await Promise.all([
      supabase.from('questionarios').select('*').order('created_at', { ascending: false }),
      supabase
        .from('questionario_envios')
        .select('*, questionarios(titulo), pacientes(id, nome_completo)')
        .order('created_at', { ascending: false }),
      supabase.from('pacientes').select('id, nome_completo, telefone').order('nome_completo'),
    ])
    setQuestionarios(qs.data || [])
    setEnvios(es.data || [])
    setPacientes(ps.data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  const handleCriarQuestionario = async () => {
    const { data, error } = await supabase
      .from('questionarios')
      .insert({ id_avaliador: userId, titulo: 'Questionário sem título' })
      .select()
      .single()
    if (error) { alert('Erro ao criar questionário: ' + error.message); return }
    navigate(`/questionarios/${data.id}/editar`)
  }

  const handleExcluirQuestionario = async (id) => {
    if (!window.confirm('Excluir este questionário? Os envios já respondidos continuam guardados, mas não será mais possível gerar novos links dele.')) return
    const { error } = await supabase.from('questionarios').delete().eq('id', id)
    if (error) { alert('Erro ao excluir questionário: ' + error.message); return }
    setQuestionarios((prev) => prev.filter((q) => q.id !== id))
  }

  const handleExcluirEnvio = async (id) => {
    if (!window.confirm('Excluir este envio e as respostas dele? Não pode ser desfeito.')) return
    const { error } = await supabase.from('questionario_envios').delete().eq('id', id)
    if (error) { alert('Erro ao excluir envio: ' + error.message); return }
    setEnvios((prev) => prev.filter((e) => e.id !== id))
  }

  const handleEnvioCriado = (novoEnvio) => {
    const questionario = questionarios.find((q) => q.id === novoEnvio.id_questionario)
    const paciente = pacientes.find((p) => p.id === novoEnvio.id_paciente)
    setEnvios((prev) => [{ ...novoEnvio, questionarios: { titulo: questionario?.titulo }, pacientes: paciente ? { id: paciente.id, nome_completo: paciente.nome_completo } : null }, ...prev])
  }

  const handleRespostaAtualizada = (envioAtualizado) => {
    setEnvios((prev) => prev.map((e) => (e.id === envioAtualizado.id ? { ...e, ...envioAtualizado } : e)))
    setModalRespostasEnvio(null)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Questionários</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Crie e envie questionários personalizados para seus pacientes.</p>
        </div>
        <button
          onClick={handleCriarQuestionario}
          className="px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors shrink-0"
        >
          Criar questionário
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-100 dark:border-slate-800">
        <button
          onClick={() => setAba('questionarios')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${aba === 'questionarios' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
        >
          Questionários
        </button>
        <button
          onClick={() => setAba('envios')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${aba === 'envios' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}
        >
          Envios {envios.length > 0 && <span className="opacity-75">({envios.length})</span>}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-primary-600 font-semibold text-center py-10 animate-pulse">Carregando...</p>
      ) : aba === 'questionarios' ? (
        questionarios.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhum questionário criado ainda.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm divide-y divide-gray-100 dark:divide-slate-800">
            {questionarios.map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-3 p-4">
                <button onClick={() => navigate(`/questionarios/${q.id}/editar`)} className="text-left min-w-0">
                  <p className="text-sm font-black text-gray-800 dark:text-slate-100 truncate">{q.titulo}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">Criado em {formatarData(q.created_at)}</p>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setModalEnviarPara(q.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:underline"
                  >
                    <Link2 size={14} /> Gerar link
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setMenuAbertoId((v) => (v === q.id ? null : q.id))}
                      className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 p-1"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {menuAbertoId === q.id && (
                      <ul className="absolute right-0 z-20 mt-1 w-40 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
                        <li>
                          <button
                            onClick={() => { setMenuAbertoId(null); navigate(`/questionarios/${q.id}/editar`) }}
                            className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                          >
                            Editar
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => { setMenuAbertoId(null); handleExcluirQuestionario(q.id) }}
                            className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Excluir
                          </button>
                        </li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          <div className="flex justify-end -mt-2">
            <button
              onClick={() => setModalEnviarPara(questionarios[0]?.id ?? null)}
              disabled={questionarios.length === 0}
              className="px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
            >
              + Enviar questionário
            </button>
          </div>
          <ListaEnvios envios={envios} onVerRespostas={setModalRespostasEnvio} onExcluir={handleExcluirEnvio} />
        </>
      )}

      {modalEnviarPara !== null && (
        <ModalEnviarQuestionario
          questionarios={aba === 'questionarios' ? questionarios.filter((q) => q.id === modalEnviarPara) : questionarios}
          pacientes={pacientes}
          userId={userId}
          aoFechar={() => setModalEnviarPara(null)}
          aoCriado={handleEnvioCriado}
        />
      )}

      {modalRespostasEnvio && (
        <ModalRespostas
          envio={modalRespostasEnvio}
          userId={userId}
          aoFechar={() => setModalRespostasEnvio(null)}
          aoAtualizado={handleRespostaAtualizada}
        />
      )}
    </div>
  )
}
