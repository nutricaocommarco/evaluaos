import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu as MenuIcon, X } from 'lucide-react'
import { usePlano } from '../contexts/PlanoContext'
import { supabase } from '../supabaseClient'

// tipo determina a navegação: os "vivos" navegam de verdade. Cada destino
// espera um formato de state diferente (não é uniforme!) — confirmado lendo
// cada página antes de ligar o item aqui:
//   AvaliacaoForm.jsx        -> { paciente, avaliacaoIdParaEditar }
//   EscolhaPercGordura.jsx   -> { pacienteInicial, avaliacaoIdInicial }
//   ResultadoAvaliacao.jsx   -> { avaliacaoId } (não recebe paciente, só o
//                                id de UMA avaliação específica — por isso
//                                'laudo' busca a mais recente antes de navegar)
//   EvolucaoPaciente.jsx     -> { paciente }
//   CalculadoraGastoCalorico.jsx -> nada (paciente é escolhido dentro da
//                                própria tela, não lê state nenhum)
// 'pacientes' volta pro fallback atual (perfil ainda vive como modal em
// Pacientes.jsx).
const GRUPOS_TODOS = [
  {
    titulo: 'Geral',
    beta: false,
    itens: [
      { key: 'perfil', label: 'Perfil do Paciente', tipo: 'pacientes' },
      { key: 'prontuario', label: 'Prontuário', tipo: 'prontuario' },
    ]
  },
  {
    titulo: 'Avaliação Antropométrica',
    beta: false,
    itens: [
      { key: 'nova_avaliacao', label: 'Nova Avaliação', tipo: 'nova_avaliacao' },
      { key: 'equacoes', label: 'Equações de Regressão', tipo: 'equacoes' },
      { key: 'laudo', label: 'Laudo', tipo: 'laudo' },
      { key: 'gasto_energetico', label: 'Gasto Calórico', tipo: 'gasto_calorico' },
      { key: 'evolucao', label: 'Evolução', tipo: 'evolucao' },
    ]
  },
  {
    titulo: 'Nutrição',
    beta: true,
    itens: [
      { key: 'anamneses', label: 'Anamneses', tipo: 'anamnese' },
      { key: 'linha_tempo', label: 'Linha do Tempo', tipo: 'linha_tempo' },
      { key: 'planos', label: 'Planos Alimentares', tipo: 'plano_alimentar' },
      { key: 'listas', label: 'Listas de Recomendações', tipo: 'listas' },
      { key: 'orientacoes', label: 'Orientações Nutricionais', tipo: 'orientacoes' },
    ]
  },
]

export default function SidebarPaciente({ paciente, itemAtivo, onSelecionarItem }) {
  const navigate = useNavigate()
  const { isBeta } = usePlano()
  const [mobileOpen, setMobileOpen] = useState(false)

  const grupos = GRUPOS_TODOS.filter((g) => !g.beta || isBeta)
  const itemAtivoLabel = grupos.flatMap((g) => g.itens).find((i) => i.key === itemAtivo)?.label

  const handleClick = async (item) => {
    setMobileOpen(false)
    if (item.tipo === 'prontuario') {
      onSelecionarItem?.(item.key)
      navigate(`/pacientes/${paciente.id}/prontuario`)
    } else if (item.tipo === 'plano_alimentar') {
      onSelecionarItem?.(item.key)
      navigate(`/pacientes/${paciente.id}/plano-alimentar`)
    } else if (item.tipo === 'anamnese') {
      onSelecionarItem?.(item.key)
      navigate(`/pacientes/${paciente.id}/anamnese`)
    } else if (item.tipo === 'orientacoes') {
      onSelecionarItem?.(item.key)
      navigate(`/pacientes/${paciente.id}/orientacoes-nutricionais`)
    } else if (item.tipo === 'linha_tempo') {
      onSelecionarItem?.(item.key)
      navigate(`/pacientes/${paciente.id}/linha-do-tempo`)
    } else if (item.tipo === 'listas') {
      onSelecionarItem?.(item.key)
      navigate(`/pacientes/${paciente.id}/listas-recomendacoes`)
    } else if (item.tipo === 'evolucao') {
      navigate('/evolucao', { state: { paciente } })
    } else if (item.tipo === 'gasto_calorico') {
      navigate('/planejamento-calorico', { state: { paciente } })
    } else if (item.tipo === 'nova_avaliacao') {
      navigate('/nova-avaliacao', { state: { paciente } })
    } else if (item.tipo === 'equacoes') {
      navigate('/equacoes-de-regressao', { state: { pacienteInicial: paciente } })
    } else if (item.tipo === 'laudo') {
      const { data } = await supabase
        .from('avaliacoes')
        .select('id')
        .eq('id_paciente', paciente.id)
        .order('data_avaliacao', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!data) { alert('Este paciente ainda não tem nenhuma avaliação registrada.'); return }
      navigate('/laudo-antropometrico', { state: { avaliacaoId: data.id, paciente } })
    } else if (item.tipo === 'pacientes') {
      navigate('/pacientes')
    } else {
      onSelecionarItem?.(item.key)
    }
  }

  const listaGrupos = (fecharAoClicar) => (
    <nav className={fecharAoClicar ? 'flex-1 overflow-y-auto py-3 px-2 space-y-5' : 'flex-1 py-3 px-2 space-y-5'}>
      {grupos.map(grupo => (
        <div key={grupo.titulo}>
          <p className="px-3 mb-1 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
            {grupo.titulo}
          </p>
          <div className="space-y-0.5">
            {grupo.itens.map(item => (
              <button
                key={item.key}
                onClick={() => handleClick(item)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  itemAtivo === item.key
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )

  return (
    <>
      {/* Mobile: barra compacta + drawer full-screen (mesmo padrão de overlay do menu principal em App.jsx) */}
      <div className="md:hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-full flex items-center justify-between gap-2 p-4"
        >
          <div className="text-left min-w-0">
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              {paciente?.nome_completo || '-'}
            </p>
            <p className="text-sm font-black text-gray-800 dark:text-slate-100 truncate">
              {itemAtivoLabel || 'Menu'}
            </p>
          </div>
          <MenuIcon size={20} className="text-gray-400 dark:text-slate-500 shrink-0" />
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-slate-900 shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Paciente</p>
                <p className="text-sm font-black text-gray-800 dark:text-slate-100 truncate">{paciente?.nome_completo || '-'}</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
                <X size={20} />
              </button>
            </div>
            {listaGrupos(true)}
          </div>
        </div>
      )}

      {/* Desktop: coluna lateral sticky, como já era */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm flex-col overflow-hidden md:sticky md:top-4 md:self-start">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800">
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Paciente</p>
          <p className="text-sm font-black text-gray-800 dark:text-slate-100 truncate">{paciente?.nome_completo || '-'}</p>
        </div>
        {listaGrupos(false)}
      </aside>
    </>
  )
}
