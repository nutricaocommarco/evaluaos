import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from '../components/SidebarPaciente'
import ListaEnvios from '../components/questionarios/ListaEnvios'
import ModalEnviarQuestionario from '../components/questionarios/ModalEnviarQuestionario'
import ModalRespostas from '../components/questionarios/ModalRespostas'

export default function PacienteQuestionarios({ userId }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [itemAtivo, setItemAtivo] = useState('questionarios')
  const [loading, setLoading] = useState(true)
  const [questionarios, setQuestionarios] = useState([])
  const [envios, setEnvios] = useState([])
  const [modalEnviarAberto, setModalEnviarAberto] = useState(false)
  const [modalRespostasEnvio, setModalRespostasEnvio] = useState(null)

  const carregarDados = async () => {
    setLoading(true)
    const { data: pac } = await supabase.from('pacientes').select('*').eq('id', id).maybeSingle()
    setPaciente(pac || null)

    if (pac) {
      const [qs, es] = await Promise.all([
        supabase.from('questionarios').select('*').order('titulo'),
        supabase
          .from('questionario_envios')
          .select('*, questionarios(titulo), pacientes(id, nome_completo)')
          .eq('id_paciente', id)
          .order('created_at', { ascending: false }),
      ])
      setQuestionarios(qs.data || [])
      setEnvios(es.data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleExcluirEnvio = async (envioId) => {
    if (!window.confirm('Excluir este envio e as respostas dele? Não pode ser desfeito.')) return
    const { error } = await supabase.from('questionario_envios').delete().eq('id', envioId)
    if (error) { alert('Erro ao excluir envio: ' + error.message); return }
    setEnvios((prev) => prev.filter((e) => e.id !== envioId))
  }

  const handleEnvioCriado = (novoEnvio) => {
    const questionario = questionarios.find((q) => q.id === novoEnvio.id_questionario)
    setEnvios((prev) => [{ ...novoEnvio, questionarios: { titulo: questionario?.titulo }, pacientes: { id: paciente.id, nome_completo: paciente.nome_completo } }, ...prev])
  }

  const handleRespostaAtualizada = (envioAtualizado) => {
    setEnvios((prev) => prev.map((e) => (e.id === envioAtualizado.id ? { ...e, ...envioAtualizado } : e)))
    setModalRespostasEnvio(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-primary-600 font-bold animate-pulse">Carregando questionários...</p>
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
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Questionários — {paciente.nome_completo}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Envie questionários e acompanhe as respostas deste paciente</p>
          </div>
          <button
            onClick={() => setModalEnviarAberto(true)}
            disabled={questionarios.length === 0}
            title={questionarios.length === 0 ? 'Crie um questionário em Questionários no menu principal primeiro' : ''}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors disabled:opacity-50 shrink-0"
          >
            Enviar questionário
          </button>
        </div>

        <ListaEnvios envios={envios} onVerRespostas={setModalRespostasEnvio} onExcluir={handleExcluirEnvio} mostrarFiltroPaciente={false} />
      </div>

      {modalEnviarAberto && (
        <ModalEnviarQuestionario
          questionarios={questionarios}
          pacientes={[]}
          pacientePreSelecionado={paciente}
          userId={userId}
          aoFechar={() => setModalEnviarAberto(false)}
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
