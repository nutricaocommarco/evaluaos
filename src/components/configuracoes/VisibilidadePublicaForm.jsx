import React, { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

export default function VisibilidadePublicaForm({ config, setConfig, onSave, saving }) {
  const [pacientes, setPacientes] = useState([])
  const [pacienteSelecionado, setPacienteSelecionado] = useState('global')
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingPacientes, setLoadingPacientes] = useState(false)

  useEffect(() => {
    async function carregarPacientes() {
      setLoadingPacientes(true)
      const { data } = await supabase
        .from('pacientes')
        .select('id, nome_completo')
        .order('nome_completo', { ascending: true })

      if (data) setPacientes(data)
      setLoadingPacientes(false)
    }
    carregarPacientes()
  }, [])

  const vis = config.visibilidade_publica || {}

  const getIsChecked = (chave) => {
    if (pacienteSelecionado === 'global') {
      return vis[chave] !== false
    }
    const regraPaciente = vis.pacientes?.[pacienteSelecionado]?.[chave]
    if (regraPaciente !== undefined) return regraPaciente
    return vis[chave] !== false
  }

  const handleToggle = (chave) => {
    const valorAtual = getIsChecked(chave)
    const novoValor = !valorAtual

    setConfig(prev => {
      const visAtual = prev.visibilidade_publica || {}

      if (pacienteSelecionado === 'global') {
        return {
          ...prev,
          visibilidade_publica: {
            ...visAtual,
            [chave]: novoValor
          }
        }
      } else {
        const pacientesObj = visAtual.pacientes || {}
        const pacienteAtualObj = pacientesObj[pacienteSelecionado] || {}

        return {
          ...prev,
          visibilidade_publica: {
            ...visAtual,
            pacientes: {
              ...pacientesObj,
              [pacienteSelecionado]: {
                ...pacienteAtualObj,
                [chave]: novoValor
              }
            }
          }
        }
      }
    })
  }

  const handleToggleGrupo = (chaves, ativar) => {
    setConfig(prev => {
      const visAtual = prev.visibilidade_publica || {}

      if (pacienteSelecionado === 'global') {
        const novavis = { ...visAtual }
        chaves.forEach(k => { novavis[k] = ativar })
        return { ...prev, visibilidade_publica: novavis }
      } else {
        const pacientesObj = visAtual.pacientes || {}
        const pacienteAtualObj = { ...(pacientesObj[pacienteSelecionado] || {}) }
        chaves.forEach(k => { pacienteAtualObj[k] = ativar })

        return {
          ...prev,
          visibilidade_publica: {
            ...visAtual,
            pacientes: {
              ...pacientesObj,
              [pacienteSelecionado]: pacienteAtualObj
            }
          }
        }
      }
    })
  }

  const handleResetarPaciente = () => {
    if (pacienteSelecionado === 'global') return
    setConfig(prev => {
      const visAtual = prev.visibilidade_publica || {}
      const pacientesObj = { ...(visAtual.pacientes || {}) }
      delete pacientesObj[pacienteSelecionado]

      return {
        ...prev,
        visibilidade_publica: {
          ...visAtual,
          pacientes: pacientesObj
        }
      }
    })
  }

  const gruposEvolucao = [
    {
      titulo: 'Composição Corporal & Indicadores',
      chaves: [
        { key: 'evo_peso', label: 'Peso / Massa Corporal' },
        { key: 'evo_gordura_perc', label: '% de Gordura' },
        { key: 'evo_massa_gorda', label: 'Massa de Gordura (kg)' },
        { key: 'evo_massa_muscular', label: 'Massa Muscular (kg)' },
        { key: 'evo_massa_magra', label: 'Massa Magra (kg)' },
        { key: 'evo_imc', label: 'IMC' }
      ]
    },
    {
      titulo: 'Gráficos Visuais',
      chaves: [
        { key: 'evo_grafico_massa', label: 'Gráfico: Composição (kg)' },
        { key: 'evo_grafico_gordura', label: 'Gráfico: % de Gordura' },
        { key: 'evo_grafico_somatocarta', label: 'Gráfico: Trajetória da Somatocarta' },
        { key: 'evo_grafico_barras_somatotipo', label: 'Gráfico: Barras do Somatotipo' }
      ]
    },
    {
      titulo: 'Circunferências (Perímetros)',
      chaves: [
        { key: 'evo_perim_braco_rel', label: 'Braço Relaxado' },
        { key: 'evo_perim_braco_cont', label: 'Braço Contraído' },
        { key: 'evo_perim_antibraco', label: 'Antebraço' },
        { key: 'evo_perim_cintura', label: 'Cintura' },
        { key: 'evo_perim_abdominal', label: 'Abdominal' },
        { key: 'evo_perim_quadril', label: 'Quadril' },
        { key: 'evo_perim_coxa_max', label: 'Coxa Máxima' },
        { key: 'evo_perim_coxa_med', label: 'Coxa Média' },
        { key: 'evo_perim_panturrilha', label: 'Panturrilha' }
      ]
    },
    {
      titulo: 'Dobras Cutâneas & Somatórios',
      chaves: [
        { key: 'evo_dobra_triceps', label: 'Dobra Tríceps' },
        { key: 'evo_dobra_subescapular', label: 'Dobra Subescapular' },
        { key: 'evo_dobra_biceps', label: 'Dobra Bíceps' },
        { key: 'evo_dobra_crista_iliaca', label: 'Dobra Crista Ilíaca' },
        { key: 'evo_dobra_supraespinhal', label: 'Dobra Supraespinhal' },
        { key: 'evo_dobra_abdominal', label: 'Dobra Abdominal' },
        { key: 'evo_dobra_coxa', label: 'Dobra Coxa Média' },
        { key: 'evo_dobra_panturrilha', label: 'Dobra Panturrilha' },
        { key: 'evo_soma_6', label: 'Somatório 6 Dobras' },
        { key: 'evo_soma_8', label: 'Somatório 8 Dobras' }
      ]
    },
    {
      titulo: 'Risco Cardiometabólico e Índices',
      chaves: [
        { key: 'evo_idx_cintura_estatura', label: 'Cintura / Estatura' },
        { key: 'evo_idx_rcq', label: 'Cintura / Quadril (RCQ)' },
        { key: 'evo_idx_apvat', label: 'Área Visceral (apVAT)' },
        { key: 'evo_idx_iam', label: 'Índice Adiposo Muscular (IAM)' },
        { key: 'evo_idx_imo', label: 'Índice Massa Óssea (IMO)' }
      ]
    }
  ]

  const gruposLaudo = [
    {
      titulo: 'Medidas Básicas',
      chaves: [
        { key: 'laudo_peso', label: 'Peso' },
        { key: 'laudo_estatura', label: 'Estatura' },
        { key: 'laudo_altura_sentado', label: 'Altura Sentado' },
        { key: 'laudo_envergadura', label: 'Envergadura' }
      ]
    },
    {
      titulo: 'Composição Corporal & Fracionamentos',
      chaves: [
        { key: 'laudo_imc', label: 'IMC' },
        { key: 'laudo_percentual_gordura', label: '% de Gordura' },
        { key: 'laudo_massa_gorda', label: 'Massa Gorda' },
        { key: 'laudo_massa_magra', label: 'Massa Magra' },
        { key: 'laudo_massa_muscular', label: 'Massa Muscular' },
        { key: 'laudo_fracionamento_2c', label: 'Gráfico: Fracionamento em 2 Componentes (2C)' },
        { key: 'laudo_fracionamento_4c', label: 'Gráfico: Fracionamento em 4 Componentes (De Rose et al.)' }
      ]
    },
    {
      titulo: 'Dobras Cutâneas',
      chaves: [
        { key: 'laudo_dobra_triceps', label: 'Tríceps' },
        { key: 'laudo_dobra_subescapular', label: 'Subescapular' },
        { key: 'laudo_dobra_biceps', label: 'Bíceps' },
        { key: 'laudo_dobra_crista_iliaca', label: 'Crista Ilíaca' },
        { key: 'laudo_dobra_supraespinhal', label: 'Supraespinhal' },
        { key: 'laudo_dobra_abdominal', label: 'Abdominal' },
        { key: 'laudo_dobra_coxa', label: 'Coxa Média' },
        { key: 'laudo_dobra_panturrilha', label: 'Panturrilha' }
      ]
    },
    {
      titulo: 'Indicadores de Saúde & Somatórios',
      chaves: [
        { key: 'laudo_rcq', label: 'Relação Cintura-Quadril (RCQ)' },
        { key: 'laudo_rce', label: 'Relação Cintura-Estatura (RCE)' },
        { key: 'laudo_status_cintura', label: 'Circunferência da Cintura (Status)' },
        { key: 'laudo_soma_6', label: 'Somatório 6 Dobras' },
        { key: 'laudo_soma_8', label: 'Somatório 8 Dobras' }
      ]
    },
    {
      titulo: 'Perímetros (Circunferências)',
      chaves: [
        { key: 'laudo_perim_braco_rel', label: 'Braço Relaxado' },
        { key: 'laudo_perim_braco_cont', label: 'Braço Contraído' },
        { key: 'laudo_perim_antibraco', label: 'Antebraço' },
        { key: 'laudo_perim_cintura', label: 'Cintura' },
        { key: 'laudo_perim_abdominal', label: 'Abdominal' },
        { key: 'laudo_perim_quadril', label: 'Quadril' },
        { key: 'laudo_perim_coxa_max', label: 'Coxa Máxima' },
        { key: 'laudo_perim_coxa_med', label: 'Coxa Média' },
        { key: 'laudo_perim_panturrilha', label: 'Panturrilha' }
      ]
    },
    {
      titulo: 'Perímetros Corrigidos (Massa Regional)',
      chaves: [
        { key: 'laudo_perim_corrigido_braco', label: 'Braço Corrigido' },
        { key: 'laudo_perim_corrigido_coxa', label: 'Coxa Corrigida' },
        { key: 'laudo_perim_corrigido_panturrilha', label: 'Panturrilha Corrigida' }
      ]
    },
    {
      titulo: 'Diâmetros Ósseos',
      chaves: [
        { key: 'laudo_diam_umero', label: 'Úmero' },
        { key: 'laudo_diam_femur', label: 'Fêmur' },
        { key: 'laudo_diam_punho', label: 'Punho' },
        { key: 'laudo_diam_maleolar', label: 'Tornozelo (Maleolar)' }
      ]
    },
    {
      titulo: 'Somatotipo & Somatocarta',
      chaves: [
        { key: 'laudo_somatotipo_barras', label: 'Barras do Somatotipo (Endo/Meso/Ecto)' },
        { key: 'laudo_somatocarta_grafico', label: 'Gráfico da Somatocarta' }
      ]
    },
    {
      titulo: 'Outros Indicadores & Classificações',
      chaves: [
        { key: 'laudo_apvat', label: 'Área Visceral (apVAT)' },
        { key: 'laudo_morrow', label: 'Gordura (Morrow 2003)' },
        { key: 'laudo_iam', label: 'Índice Adiposo Muscular (IAM)' },
        { key: 'laudo_imo', label: 'Índice Músculo Ósseo (IMO)' }
      ]
    },
    // ---- METAS INDIVIDUALIZADAS ----
    {
      titulo: 'Dietética & Metas (Predição Metabólica)',
      chaves: [
        { key: 'laudo_plan_dieta', label: 'Dieta Recomendada (Kcal de Mudança)' },
        { key: 'laudo_plan_manutencao', label: 'Manutenção Futura (Kcal de Manutenção)' },
        { key: 'laudo_plan_peso_alvo', label: 'Peso Alvo Projetado' },
        { key: 'laudo_plan_bf_alvo', label: '% Gordura Projetado' }
      ]
    }
  ]

  const pacientesFiltrados = pacientes.filter(p =>
    p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const temRegraPersonalizada = pacienteSelecionado !== 'global' && vis.pacientes?.[pacienteSelecionado]

  const renderBlocoGrupo = (grupo) => {
    const listaChaves = grupo.chaves.map(item => item.key)
    const todosAtivos = listaChaves.every(k => getIsChecked(k))

    return (
      <div key={grupo.titulo} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-3">
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <span className="text-xs font-black text-gray-700 uppercase tracking-wider">{grupo.titulo}</span>
          <button
            type="button"
            onClick={() => handleToggleGrupo(listaChaves, !todosAtivos)}
            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 transition-colors"
          >
            {todosAtivos ? 'Desmarcar Todos' : 'Marcar Todos'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {grupo.chaves.map(opt => {
            const isChecked = getIsChecked(opt.key)
            const herdaGlobal = pacienteSelecionado !== 'global' && vis.pacientes?.[pacienteSelecionado]?.[opt.key] === undefined

            return (
              <label
                key={opt.key}
                onClick={() => handleToggle(opt.key)}
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                  isChecked
                    ? 'bg-white border-emerald-200 text-gray-800 shadow-2xs'
                    : 'bg-gray-100/50 border-gray-200 text-gray-400 opacity-60'
                }`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs font-semibold truncate">{opt.label}</span>
                  {herdaGlobal && (
                    <span className="text-[9px] text-gray-400 font-normal">(padrão global)</span>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 shrink-0"
                />
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  const nomePacienteAtual = pacientes.find(p => p.id === pacienteSelecionado)?.nome_completo

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Visibilidade e Exibição de Campos</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure a visibilidade padrão para **Todos os Pacientes** ou selecione um paciente específico para aplicar regras personalizadas.
        </p>
      </div>

      <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-3">
        <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
          Configurar Regra de Visibilidade Para:
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={pacienteSelecionado}
            onChange={(e) => setPacienteSelecionado(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs"
          >
            <option value="global">🌐 Todos os Pacientes (Configuração Global)</option>
            {pacientesFiltrados.map(p => (
              <option key={p.id} value={p.id}>
                👤 {p.nome_completo} {vis.pacientes?.[p.id] ? '⚡ (Regra Personalizada)' : ''}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filtrar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sm:w-48 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex justify-between items-center pt-1">
          {pacienteSelecionado === 'global' ? (
            <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
              <span>🌐</span> Editando padrão global para todos os alunos.
            </span>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1">
                <span>👤</span> Editando exceção para: <span className="underline">{nomePacienteAtual}</span>
              </span>
              {temRegraPersonalizada && (
                <button
                  type="button"
                  onClick={handleResetarPaciente}
                  className="text-[10px] font-bold text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded border border-red-100 transition-colors"
                  title="Remove exceções e volta a obedecer a regra Global"
                >
                  Restaurar para Padrão Global
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <span className="text-lg">📈</span>
          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">
            1. PÁGINA DE EVOLUÇÃO
          </h4>
        </div>
        <div className="space-y-4">
          {gruposEvolucao.map(grupo => renderBlocoGrupo(grupo))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <span className="text-lg">📋</span>
          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">
            2. LAUDO ANTROPOMÉTRICO
          </h4>
        </div>
        <div className="space-y-4">
          {gruposLaudo.map(grupo => renderBlocoGrupo(grupo))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? 'Salvando...' : 'Salvar Todas as Preferências'}
        </button>
      </div>
    </div>
  )
}