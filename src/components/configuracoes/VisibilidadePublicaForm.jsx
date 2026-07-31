import React from 'react'

export default function VisibilidadePublicaForm({ config, setConfig, onSave, saving }) {
  const visibilidade = config.visibilidade_publica || {
    exibir_somatocarta: true,
    exibir_dobras_brutas: true,
    exibir_perimetros: true,
    exibir_indices_risco: true,
    exibir_composicao_kg: true
  }

  const handleToggle = (chave) => {
    setConfig(prev => ({
      ...prev,
      visibilidade_publica: {
        ...visibilidade,
        [chave]: !visibilidade[chave]
      }
    }))
  }

  const opcoes = [
    { key: 'exibir_somatocarta', label: 'Somatocarta (Trajetória Somatotípica)', desc: 'Mostra a rosa-dos-ventos somatotípica (Endo, Meso, Ecto)' },
    { key: 'exibir_composicao_kg', label: 'Cards de Composição Corporal (KG e %)', desc: 'Exibe peso, massa muscular e gordura corporal' },
    { key: 'exibir_perimetros', label: 'Lista de Perímetros / Circunferências', desc: 'Permite ao paciente acompanhar evolução de braço, cintura, quadril' },
    { key: 'exibir_dobras_brutas', label: 'Valores de Dobras Cutâneas (mm)', desc: 'Mostra os milímetros brutos das dobras' },
    { key: 'exibir_indices_risco', label: 'Índices Cardiometabólicos (RCQ, RCE, APVAT)', desc: 'Apresenta indicadores de risco para a saúde' }
  ]

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Privacidade dos Links Públicos</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure o que o seu aluno/paciente conseguirá visualizar quando abrir o link da evolução ou laudo via WhatsApp.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {opcoes.map(opt => {
          const isChecked = visibilidade[opt.key] !== false
          return (
            <div key={opt.key} className="flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="pr-4">
                <span className="text-xs font-bold text-gray-800 block">{opt.label}</span>
                <span className="text-[11px] text-gray-400 block">{opt.desc}</span>
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
        })}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? 'Salvando...' : 'Salvar Preferências Públicas'}
        </button>
      </div>
    </div>
  )
}