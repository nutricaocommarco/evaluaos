import React from 'react'

const listaFemininaNomes = [
  'Durnin et al. (1974) - 4skf',
  'Jackson et al. (1980) - 3skf',
  'Petroski (1995) - 4skf',
  'Guedes (1985) - 3skf',
  'Withers et al. (1987) - 4skf',
  'Slaughter et al. (1988) - 2skf',
  'Woolcott & Bergman 2018',
  'Mitchell et al. 2020 7skd ISAK'
]

const listaMasculinaNomes = [
  'Mitchell et al. (2020) - 7skf ISAK',
  'Jackson et al. (1980) - 3skf',
  'Petroski (1995) - 4skf',
  'Guedes (1985) - 3skf',
  'Faulkner (1968) - 4skf',
  'Durnin et al. (1974) - 4skf (17 a 72 anos)',
  'Woolcott & Bergman (2018) - RFM'
]

export default function EquacaoPadraoForm({ config, setConfig, onSave, saving }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Equações de Regressão Favoritas</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Defina quais protocolos serão sugeridos por padrão na etapa de cálculo de % de Gordura.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Protocolo Padrão - Masculino
          </label>
          <select
            value={config.equacao_padrao_masculina || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, equacao_padrao_masculina: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {listaMasculinaNomes.map((eq, i) => (
              <option key={i} value={eq}>{eq}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Protocolo Padrão - Feminino
          </label>
          <select
            value={config.equacao_padrao_feminina || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, equacao_padrao_feminina: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {listaFemininaNomes.map((eq, i) => (
              <option key={i} value={eq}>{eq}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? 'Salvando...' : 'Salvar Equações Favoritas'}
        </button>
      </div>
    </div>
  )
}