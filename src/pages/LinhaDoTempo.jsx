import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from '../components/SidebarPaciente'

// Datas de colunas `date` puras vêm do Supabase como 'YYYY-MM-DD' (10
// chars) — precisam do truque +T12:00:00 pra não voltar um dia por fuso.
// created_at (timestamptz) já vem completo, formata direto.
function formatarDataEvento(dataStr) {
  if (!dataStr) return '-'
  if (dataStr.length === 10) return new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR')
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

const LABELS = { consulta: 'Consulta', avaliacao: 'Avaliação', plano_alimentar: 'Plano Alimentar' }
const CORES = { consulta: 'bg-blue-500', avaliacao: 'bg-emerald-500', plano_alimentar: 'bg-primary-600' }

export default function LinhaDoTempo() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [itemAtivo, setItemAtivo] = useState('linha_tempo')
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)

  const carregarDados = async () => {
    setLoading(true)

    const { data: pac } = await supabase.from('pacientes').select('*').eq('id', id).maybeSingle()
    setPaciente(pac || null)

    if (pac) {
      const [{ data: consultas }, { data: avaliacoes }, { data: planos }] = await Promise.all([
        supabase.from('prontuarios').select('id, data_consulta, queixa_principal').eq('id_paciente', id),
        supabase.from('avaliacoes').select('id, data_avaliacao, equacao_de_regressao_escolhida, peso_paciente').eq('id_paciente', id),
        supabase.from('planos_alimentares').select('id, titulo, created_at, ativo').eq('id_paciente', id),
      ])

      // Agregação ao vivo direto das 3 tabelas — não depende de manter uma
      // tabela denormalizada em sincronia toda vez que algo é criado/editado
      // em Prontuário, Avaliação ou Plano Alimentar.
      const lista = [
        ...(consultas || []).map((c) => ({
          tipo: 'consulta',
          data: c.data_consulta,
          titulo: 'Consulta',
          subtitulo: c.queixa_principal || 'Sem queixa principal registrada',
          onClick: () => navigate(`/pacientes/${id}/prontuario`),
        })),
        ...(avaliacoes || []).map((a) => ({
          tipo: 'avaliacao',
          data: a.data_avaliacao,
          titulo: 'Avaliação Antropométrica',
          subtitulo: `${a.equacao_de_regressao_escolhida || 'Sem equação'} · ${a.peso_paciente ?? '-'}kg`,
          onClick: () => navigate('/nova-avaliacao', { state: { paciente: pac, avaliacaoIdParaEditar: a.id } }),
        })),
        ...(planos || []).map((p) => ({
          tipo: 'plano_alimentar',
          data: p.created_at,
          titulo: p.titulo || 'Plano Alimentar',
          subtitulo: p.ativo ? 'Ativo' : 'Inativo',
          onClick: () => navigate(`/pacientes/${id}/plano-alimentar`),
        })),
      ].sort((x, y) => new Date(y.data) - new Date(x.data))

      setEventos(lista)
    }

    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-primary-600 font-bold animate-pulse">Carregando linha do tempo...</p>
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
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Linha do Tempo — {paciente.nome_completo}</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Consultas, avaliações antropométricas e planos alimentares em ordem cronológica
              </p>
            </div>

            {eventos.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhum evento registrado ainda.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-3">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200 dark:bg-slate-700"></div>

                {eventos.map((evento, index) => (
                  <div key={`${evento.tipo}-${index}`} className="relative">
                    <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full ${CORES[evento.tipo]} border-2 border-white dark:border-slate-950`}></div>

                    <button
                      onClick={evento.onClick}
                      className="w-full text-left bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:border-primary-300 dark:hover:border-primary-700 transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded-full ${CORES[evento.tipo]}`}>
                          {LABELS[evento.tipo]}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-slate-500 shrink-0">{formatarDataEvento(evento.data)}</span>
                      </div>
                      <p className="text-sm font-black text-gray-800 dark:text-slate-100">{evento.titulo}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{evento.subtitulo}</p>
                    </button>
                  </div>
                ))}
              </div>
            )}
        </>
      </div>
    </div>
  )
}
