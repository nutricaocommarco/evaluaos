import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from '../components/SidebarPaciente'
import EmConstrucao from '../components/EmConstrucao'

export default function Anamnese({ userId }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [itemAtivo, setItemAtivo] = useState('anamneses')
  const [loading, setLoading] = useState(true)

  const [conteudo, setConteudo] = useState('')
  const [conteudoSalvo, setConteudoSalvo] = useState('')
  const [atualizadoEm, setAtualizadoEm] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const carregarDados = async () => {
    setLoading(true)

    const { data: pac } = await supabase.from('pacientes').select('*').eq('id', id).maybeSingle()
    setPaciente(pac || null)

    if (pac) {
      const { data: registro } = await supabase
        .from('anamneses')
        .select('*')
        .eq('id_paciente', id)
        .maybeSingle()

      setConteudo(registro?.conteudo || '')
      setConteudoSalvo(registro?.conteudo || '')
      setAtualizadoEm(registro?.updated_at || null)
    }

    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const alterado = conteudo !== conteudoSalvo

  const handleSalvar = async () => {
    setSalvando(true)
    const { data, error } = await supabase
      .from('anamneses')
      .upsert(
        { id_paciente: id, id_avaliador: userId, conteudo, updated_at: new Date().toISOString() },
        { onConflict: 'id_paciente' }
      )
      .select()
      .single()

    setSalvando(false)
    if (error) { alert('Erro ao salvar anamnese: ' + error.message); return }
    setConteudoSalvo(data.conteudo || '')
    setAtualizadoEm(data.updated_at)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-primary-600 font-bold animate-pulse">Carregando anamnese...</p>
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
        {itemAtivo !== 'anamneses' ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm min-h-[400px]">
            <EmConstrucao />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Anamnese — {paciente.nome_completo}</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  {atualizadoEm
                    ? `Última atualização: ${new Date(atualizadoEm).toLocaleString('pt-BR')}`
                    : 'Ainda não preenchida'}
                </p>
              </div>
              <button
                onClick={handleSalvar}
                disabled={!alterado || salvando}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50 shrink-0"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>

            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Histórico de saúde, hábitos alimentares, rotina, queixas, contexto familiar e social, expectativas do paciente..."
              rows={24}
              className="w-full px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-100 resize-y"
            />

            {alterado && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">Alterações não salvas.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
