import React from 'react'

export default function VisibilidadePublicaForm({ config, setConfig, onSave, saving }) {
  // Configuração padrão com todos os itens habilitados por padrão (true)
  const visibilidade = config.visibilidade_publica || {
    // --- PÁGINA DE EVOLUÇÃO (EvolucaoPaciente.jsx) ---
    evo_composicao_cards: true,
    evo_grafico_massa: true,
    evo_grafico_gordura: true,
    evo_grafico_somatocarta: true,
    evo_grafico_componentes_somatotipo: true,
    evo_perimetros: true,
    evo_dobras: true,
    evo_somatorios: true,
    evo_indices_risco: true,

    // --- PÁGINA DE LAUDO / RESULTADO (ResultadoAvaliacao.jsx) ---
    laudo_medidas_basicas: true,
    laudo_composicao: true,
    laudo_dobras: true,
    laudo_indicadores_saude: true,
    laudo_perimetros: true,
    laudo_perimetros_corrigidos: true,
    laudo_diametros: true,
    laudo_somatotipo: true,
    laudo_somatocarta: true,
    laudo_outros_indicadores: true
  }

  const handleToggle = (chave) => {
    setConfig(prev => ({
      ...prev,
      visibilidade_publica: {
        ...visibilidade,
        [chave]: visibilidade[chave] === undefined ? false : !visibilidade[chave]
      }
    }))
  }

  // Mapeamento completo dos itens divididos por tela
  const secoesEvolucao = [
    { key: 'evo_composicao_cards', label: 'Cards de Composição Corporal (Peso, %, Massas)', desc: 'Exibe os cartões comparativos de peso, gordura, massa magra, muscular e IMC.' },
    { key: 'evo_grafico_massa', label: 'Gráfico 1: Composição Corporal em KG (Linhas)', desc: 'Mostra o gráfico visual da evolução do Peso, Músculo e Gordura em kg.' },
    { key: 'evo_grafico_gordura', label: 'Gráfico 2: Evolução % de Gordura (Linha)', desc: 'Mostra o gráfico exclusivo com a oscilação do percentual de gordura.' },
    { key: 'evo_grafico_somatocarta', label: 'Gráfico 3: Trajetória na Somatocarta', desc: 'Exibe o triângulo cartesiano com a trajetória somatotípica (Endo/Meso/Ecto).' },
    { key: 'evo_grafico_componentes_somatotipo', label: 'Gráfico 4: Barras de Componentes do Somatotipo', desc: 'Mostra as barras de evolução individual de Endomorfia, Mesomorfia e Ectomorfia.' },
    { key: 'evo_perimetros', label: 'Circunferências (Perímetros)', desc: 'Cards com a evolução temporal de braço, cintura, quadril, coxa, etc.' },
    { key: 'evo_dobras', label: 'Dobras Cutâneas', desc: 'Cards de evolução dos milímetros brutos de cada dobra cutânea aferida.' },
    { key: 'evo_somatorios', label: 'Somatórios de Dobras (Σ 6 e Σ 8)', desc: 'Exibe os quadros de evolução dos somatórios gerais de dobras.' },
    { key: 'evo_indices_risco', label: 'Risco Cardiometabólico e Índices (RCQ, RCE, APVAT, IAM, IMO)', desc: 'Cards de evolução das relações de risco e proporções corporais.' }
  ]

  const secoesLaudo = [
    { key: 'laudo_medidas_basicas', label: '1. Medidas Básicas', desc: 'Peso, Estatura, Altura Sentado e Envergadura.' },
    { key: 'laudo_composicao', label: '2. Composição Corporal (Resultados Principais)', desc: 'Quadros destaques de IMC, % Gordura, Massa Gorda, Magra e Muscular.' },
    { key: 'laudo_dobras', label: '3. Dobras Cutâneas', desc: 'Valores individuais de cada dobra medida no protocolo.' },
    { key: 'laudo_indicadores_saude', label: '4. Indicadores de Saúde e Somatórios', desc: 'Relação Cintura-Quadril, Cintura-Estatura, Status da Cintura, Σ 6 e Σ 8 dobras.' },
    { key: 'laudo_perimetros', label: '5. Perímetros (Circunferências)', desc: 'Tabela de perímetros de braço, antebraço, cintura, abdominal, quadril, coxa, panturrilha.' },
    { key: 'laudo_perimetros_corrigidos', label: '6. Perímetros Corrigidos (Massa Muscular Regional)', desc: 'Perímetros descontados da dobra cutânea (Braço, Coxa e Panturrilha).' },
    { key: 'laudo_diametros', label: '7. Diâmetros Ósseos', desc: 'Medidas de Úmero, Fêmur, Punho e Tornozelo.' },
    { key: 'laudo_somatotipo', label: '8. Somatotipo (Valores e Barras)', desc: 'Classificação numérica e barras de Endomorfia, Mesomorfia e Ectomorfia.' },
    { key: 'laudo_somatocarta', label: '9. Gráfico da Somatocarta', desc: 'Plotagem visual do ponto do paciente no plano cartesiano da Somatocarta.' },
    { key: 'laudo_outros_indicadores', label: '10. Outros Indicadores e Classificações (IAM, IMO)', desc: 'Exibe o Índice Adiposo Muscular e o Índice de Músculo Ósseo.' }
  ]

  const renderChaveToggle = (opt) => {
    const isChecked = visibilidade[opt.key] !== false
    return (
      <div key={opt.key} className="flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
        <div className="pr-4 min-w-0">
          <span className="text-xs font-bold text-gray-800 block truncate">{opt.label}</span>
          <span className="text-[11px] text-gray-400 block leading-tight mt-0.5">{opt.desc}</span>
        </div>

        <button
          type="button"
          onClick={() => handleToggle(opt.key)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isChecked ? 'bg-emerald-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isChecked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Privacidade dos Links Públicos (WhatsApp)</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Escolha exatamente o que o seu aluno/paciente poderá visualizar quando abrir o link da **Evolução** ou do **Laudo Antropométrico**.
        </p>
      </div>

      {/* SEÇÃO 1: EVOLUÇÃO PACIENTE */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <span className="text-base">📈</span>
          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">Visibilidade na Tela de Evolução (EvolucaoPaciente)</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {secoesEvolucao.map(opt => renderChaveToggle(opt))}
        </div>
      </div>

      {/* SEÇÃO 2: RESULTADO DA AVALIAÇÃO / LAUDO */}
      <div className="space-y-3 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
          <span className="text-base">📋</span>
          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider">Visibilidade no Laudo Antropométrico (ResultadoAvaliacao)</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {secoesLaudo.map(opt => renderChaveToggle(opt))}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? 'Salvando...' : 'Salvar Preferências Públicas'}
        </button>
      </div>
    </div>
  )
}