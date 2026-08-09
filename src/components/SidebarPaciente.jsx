import React from 'react'
import { useNavigate } from 'react-router-dom'

// tipo determina a navegação: os "vivos" (prontuario/plano_alimentar/
// anamnese/orientacoes/linha_tempo/listas/evolucao/gasto_calorico) navegam
// de verdade; 'pacientes' aponta pro
// fallback atual (perfil/histórico ainda vivem como modal em
// Pacientes.jsx); os demais chamam onSelecionarItem pra trocar só o
// conteúdo principal por <EmConstrucao/>, sem sair da rota.
const GRUPOS = [
  {
    titulo: 'Geral',
    itens: [
      { key: 'perfil', label: 'Perfil do Paciente', tipo: 'pacientes' },
      { key: 'prontuario', label: 'Prontuário', tipo: 'prontuario' },
      { key: 'linha_tempo', label: 'Linha do Tempo', tipo: 'linha_tempo' },
    ]
  },
  {
    titulo: 'Avaliação',
    itens: [
      { key: 'anamneses', label: 'Anamneses', tipo: 'anamnese' },
      { key: 'exames_lab', label: 'Exames Laboratoriais', tipo: 'construcao' },
      { key: 'avaliacoes', label: 'Avaliações Antropométricas', tipo: 'pacientes' },
      { key: 'bioimpedancia', label: 'Exames de Bioimpedância', tipo: 'construcao' },
      { key: 'gestante', label: 'Acompanhamento Gestacional', tipo: 'construcao' },
      { key: 'infantil', label: 'Acompanhamento Infantil', tipo: 'construcao' },
      { key: 'fotos', label: 'Fotos Comparativas', tipo: 'construcao' },
      { key: 'gasto_energetico', label: 'Cálculos de Gasto Energético', tipo: 'gasto_calorico' },
    ]
  },
  {
    titulo: 'Prescrição',
    itens: [
      { key: 'planos', label: 'Planos Alimentares', tipo: 'plano_alimentar' },
      { key: 'listas', label: 'Listas de Recomendações', tipo: 'listas' },
      { key: 'orientacoes', label: 'Orientações Nutricionais', tipo: 'orientacoes' },
      { key: 'receitas', label: 'Receitas', tipo: 'construcao' },
      { key: 'materiais', label: 'Materiais de Apoio', tipo: 'construcao' },
      { key: 'formulas', label: 'Fórmulas Manipuladas', tipo: 'construcao' },
    ]
  },
  {
    titulo: 'Acompanhamento',
    itens: [
      { key: 'diario', label: 'Diário Alimentício', tipo: 'construcao' },
      { key: 'evolucao', label: 'Evolução', tipo: 'evolucao' },
    ]
  },
  {
    titulo: 'Outros',
    itens: [
      { key: 'pasta', label: 'Pasta do Paciente', tipo: 'construcao' },
      { key: 'config_paciente', label: 'Configurações do Paciente', tipo: 'construcao' },
    ]
  }
]

export default function SidebarPaciente({ paciente, itemAtivo, onSelecionarItem }) {
  const navigate = useNavigate()

  const handleClick = (item) => {
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
      navigate('/planejamento-calorico')
    } else if (item.tipo === 'pacientes') {
      navigate('/pacientes')
    } else {
      onSelecionarItem?.(item.key)
    }
  }

  return (
    <aside className="w-full md:w-64 shrink-0 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm flex flex-col overflow-hidden md:sticky md:top-4 md:self-start">
      <div className="p-4 border-b border-gray-100 dark:border-slate-800">
        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Paciente</p>
        <p className="text-sm font-black text-gray-800 dark:text-slate-100 truncate">{paciente?.nome_completo || '-'}</p>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-5">
        {GRUPOS.map(grupo => (
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
    </aside>
  )
}
