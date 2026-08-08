import React from 'react'

const listaFemininaNomes = [
  'Durnin et al. (1974) - 4skf',
  'Jackson et al. (1980) - 3skf',
  'Petroski (1995) - 4skf',
  'Guedes (1985) - 3skf',
  'Withers et al. (1987) - 4skf',
  'Withers et al. (1987) - 6skf',
  'Slaughter et al. (1988) - 2skf',
  'Yuhasz (1974) - 6skf',
  'Katch & McArdle (1973) - 3skf',
  'Sloan et al. (1962) - 2skf',
  'Wilmore & Behnke (1970) - 3skf',
  'Thorland et al. (1984) - Generalizada',
  'Lewis et al. (1978) - Dobras e Perímetros',
  'Jackson et al. (1980) - 4skf',
  'Tran & Weltman (1989) - Perímetros',
  'Weltman et al. (1988) - Perímetros',
  'Woolcott & Bergman 2018',
  'Deurenberg et al. (1991) - Por IMC',
  'Mitchell et al. 2020 7skd ISAK',
  'Eston et al. 2005 3skf ISAK',
  'Evans et al. 2005 3skf Brancas',
  'Evans et al. 2005 3skf Negras',
  'Durnin 4skf (menor de 17 anos)',
  'Durnin 4skf (16-19 anos)',
  'Durnin 4skf (20-29 anos)',
  'Durnin 4skf (30-39 anos)',
  'Durnin 4skf (40-49 anos)',
  'Durnin 4skf - Variação F (50+ anos Alt)',
  'Durnin  et al. 1974 1skf',
  'Durnin  et al. 1974 2skf',
  'Nagamine & Suzuki, 1964 2skf',
  'Deurenberg et al. 1990 pré-puberes',
  'Deurenberg et al. 1990 púberes',
  'Deurenberg et al. 1990 pós-puberes',
  'Ortiz-Hernández et al. 2016'
]

const listaMasculinaNomes = [
  'Mitchell et al. (2020) - 7skf ISAK',
  'Woolcott & Bergman (2018) - RFM',
  'Guedes (1985) - 3skf',
  'Deurenberg et al. (1991) - Por IMC',
  'Weltman et al. (1987) - Por Perímetros',
  'Petroski (1995) - 4skf',
  'Stewart & Hannan (2000) - 2skf',
  'Faulkner (1968) - 4skf',
  'Reilly et al. (2009) - 4skf ISAK',
  'Evans et al. (2005) - 3skf (Brancos)',
  'Evans et al. (2005) - 3skf (Negros)',
  'Katch & McArdle (1973) - 3skf',
  'Withers et al. (1987) - 7skf',
  'Slaughter et al. (1988) - 2skf',
  'Yuhasz (1974) - 6skf',
  'Wilmore & Behnke (1969) - 2skf',
  'Boileau et al. (1985) - 2skf',
  'Deurenberg et al. (1990) - Pré-Púberes',
  'Deurenberg et al. (1990) - Púberes',
  'Deurenberg et al. (1990) - Pós-Púberes',
  'Eston et al. (2005) - 2skf ISAK',
  'Eston et al. (2005) - 6skf ISAK',
  'Durnin et al. (1974) - 4skf (17 a 72 anos)',
  'Durnin et al. (1974) - 4skf (17 a 19 anos)',
  'Durnin et al. (1974) - 4skf (20 a 29 anos)',
  'Durnin et al. (1974) - 4skf (30 a 39 anos)',
  'Durnin et al. (1974) - 4skf (40 a 49 anos)',
  'Durnin et al. (1974) - 4skf (50 a 72 anos)',
  'Durnin et al. (1974) - 1skf (Só Tríceps)',
  'Durnin & Rahaman (1967) - 4skf (< 17 anos)',
  'Forsyth & Sinning (1973) - 2skf',
  'Nagamine & Suzuki (1964) - 2skf',
  'Sloan (1967) - 2skf',
  'Hortobagyi et al. (1992) - Massa/Estatura',
  'Ortiz-Hernández et al. (2016) - Mista'
]

export default function EquacaoPadraoForm({ config, setConfig, onSave, saving }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider">Equações de Regressão Favoritas</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          Defina quais protocolos serão sugeridos por padrão na etapa de cálculo de % de Gordura.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Protocolo Padrão - Masculino
          </label>
          <select
            value={config.equacao_padrao_masculina || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, equacao_padrao_masculina: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
          >
            {listaMasculinaNomes.map((eq, i) => (
              <option key={i} value={eq}>{eq}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Protocolo Padrão - Feminino
          </label>
          <select
            value={config.equacao_padrao_feminina || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, equacao_padrao_feminina: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
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
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? 'Salvando...' : 'Salvar Equações Favoritas'}
        </button>
      </div>
    </div>
  )
}