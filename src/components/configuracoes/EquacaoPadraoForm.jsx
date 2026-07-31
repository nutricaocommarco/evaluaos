import React from 'react'

const listaFeminina = [
  { nome: 'Durnin et al. (1974) - 4skf', func: Eq.calcularFemDurnin1974 },
  { nome: 'Jackson et al. (1980) - 3skf', func: Eq.calcularFemJacksonPollock1980_3skf },
  { nome: 'Petroski (1995) - 4skf', func: Eq.calcularFemPetroski1995_4skf },
  { nome: 'Guedes (1985) - 3skf', func: Eq.calcularFemGuedes1985_3skf },
  { nome: 'Withers et al. (1987) - 4skf', func: Eq.calcularFemWithers1987_4skf },
  { nome: 'Withers et al. (1987) - 6skf', func: Eq.calcularFemWithers1987_6skf },
  { nome: 'Slaughter et al. (1988) - 2skf', func: Eq.calcularFemSlaughter1988_2skf },
  { nome: 'Yuhasz (1974) - 6skf', func: Eq.calcularFemYuhasz1974_6skf },
  { nome: 'Katch & McArdle (1973) - 3skf', func: Eq.calcularFemKatchMcArdle1973_3skf },
  { nome: 'Sloan et al. (1962) - 2skf', func: Eq.calcularFemSloan1962_2skf },
  { nome: 'Wilmore & Behnke (1970) - 3skf', func: Eq.calcularFemWilmoreBehnke1970_3skf },
  { nome: 'Thorland et al. (1984) - Generalizada', func: Eq.calcularFemThorlandGeneralizada1984 },
  { nome: 'Lewis et al. (1978) - Dobras e Perímetros', func: Eq.calcularFemLewis1978 },
  { nome: 'Jackson et al. (1980) - 4skf', func: Eq.calcularFemJacksonPollock1980_4skf },
  { nome: 'Tran & Weltman (1989) - Perímetros', func: Eq.calcularFemTranWeltman1989_Perimetros },
  { nome: 'Weltman et al. (1988) - Perímetros', func: Eq.calcularFemWeltman1988_Perimetros },
  { nome: 'Woolcott & Bergman 2018', func: Eq.calcularFemWoolcottBergman2018 },
  { nome: 'Deurenberg et al. (1991) - Por IMC', func: Eq.calcularFemDeurenberg1991_IMC },
  { nome: 'Mitchell et al. 2020 7skd ISAK', func: Eq.calcularFemMitchell2020_7skf },
  { nome: 'Eston et al. 2005 3skf ISAK', func: Eq.calcularFemEston2005_3skf },
  { nome: 'Evans et al. 2005 3skf Brancas', func: Eq.calcularFemEvans2005_3skf_Brancas },
  { nome: 'Evans et al. 2005 3skf Negras', func: Eq.calcularFemEvans2005_3skf_Negras },
  { nome: 'Durnin 4skf (menor de 17 anos)', func: Eq.calcularFemDurnin1974_Menor17 },
  { nome: 'Durnin 4skf (16-19 anos)', func: Eq.calcularFemDurnin1974_16a19anos },
  { nome: 'Durnin 4skf (20-29 anos)', func: Eq.calcularFemDurnin1974_20a29anos },
  { nome: 'Durnin 4skf (30-39 anos)', func: Eq.calcularFemDurnin1974_30a39anos },
  { nome: 'Durnin 4skf (40-49 anos)', func: Eq.calcularFemDurnin1974_40a49anos },
  { nome: 'Durnin 4skf - Variação F (50+ anos Alt)', func: Eq.calcularFemDurnin1974_50a58anos },
  { nome: 'Durnin  et al. 1974 1skf', func: Eq.calcularFemDurnin1974_1skf },
  { nome: 'Durnin  et al. 1974 2skf', func: Eq.calcularFemDurnin1974_2skf },
  { nome: 'Nagamine & Suzuki, 1964 2skf', func: Eq.calcularFemNagamineSuzuki1964_2skf },
  { nome: 'Deurenberg et al. 1990 pré-puberes', func: Eq.calcularFemDeurenberg1990_PrePuberes },
  { nome: 'Deurenberg et al. 1990 púberes', func: Eq.calcularFemDeurenberg1990_Puberes },
  { nome: 'Deurenberg et al. 1990 pós-puberes', func: Eq.calcularFemDeurenberg1990_PosPuberes },
  { nome: 'Ortiz-Hernández et al. 2016', func: Eq.calcularFemOrtizHernandez2016 }
];

const listaMasculina = [
  { nome: 'Mitchell et al. (2020) - 7skf ISAK', func: Eq.calcularMascMitchell2020_7skd },
  { nome: 'Woolcott & Bergman (2018) - RFM', func: Eq.calcularMascWoolcottBergman2018 },
  { nome: 'Guedes (1985) - 3skf', func: Eq.calcularMascGuedes1985_3skd },
  { nome: 'Deurenberg et al. (1991) - Por IMC', func: Eq.calcularMascDeurenberg1991_IMC },
  { nome: 'Weltman et al. (1987) - Por Perímetros', func: Eq.calcularMascWeltman1987 },
  { nome: 'Petroski (1995) - 4skf', func: Eq.calcularMascPetroski1995_4skd },
  { nome: 'Stewart & Hannan (2000) - 2skf', func: Eq.calcularMascStewartHannan_2skd },
  { nome: 'Faulkner (1968) - 4skf', func: Eq.calcularMascFaulkner1968_4skd },
  { nome: 'Reilly et al. (2009) - 4skf ISAK', func: Eq.calcularMascReilly2009_4skd },
  { nome: 'Evans et al. (2005) - 3skf (Brancos)', func: Eq.calcularMascEvans2005_3skd_White },
  { nome: 'Evans et al. (2005) - 3skf (Negros)', func: Eq.calcularMascEvans2005_3skd_Black },
  { nome: 'Katch & McArdle (1973) - 3skf', func: Eq.calcularMascKatchMcArdle1973_3skd },
  { nome: 'Withers et al. (1987) - 7skf', func: Eq.calcularMascWithers1987_7skd },
  { nome: 'Slaughter et al. (1988) - 2skf', func: Eq.calcularMascSlaughter1988_2skd },
  { nome: 'Yuhasz (1974) - 6skf', func: Eq.calcularMascYuhasz1974_6skd },
  { nome: 'Wilmore & Behnke (1969) - 2skf', func: Eq.calcularMascWilmoreBehnke1969_2skd },
  { nome: 'Boileau et al. (1985) - 2skf', func: Eq.calcularMascBoileau1985_2skd },
  { nome: 'Deurenberg et al. (1990) - Pré-Púberes', func: Eq.calcularMascDeurenberg1990_4skd_PrePuberes },
  { nome: 'Deurenberg et al. (1990) - Púberes', func: Eq.calcularMascDeurenberg1990_4skd_Puberes },
  { nome: 'Deurenberg et al. (1990) - Pós-Púberes', func: Eq.calcularMascDeurenberg1990_4skd_PosPuberes },
  { nome: 'Eston et al. (2005) - 2skf ISAK', func: Eq.calcularMascEston2005_2skd },
  { nome: 'Eston et al. (2005) - 6skf ISAK', func: Eq.calcularMascEston2005_6skd },
  { nome: 'Durnin et al. (1974) - 4skf (17 a 72 anos)', func: Eq.calcularMascDurnin1974_17a72anos },
  { nome: 'Durnin et al. (1974) - 4skf (17 a 19 anos)', func: Eq.calcularMascDurnin1974_17a19anos },
  { nome: 'Durnin et al. (1974) - 4skf (20 a 29 anos)', func: Eq.calcularMascDurnin1974_20a29anos },
  { nome: 'Durnin et al. (1974) - 4skf (30 a 39 anos)', func: Eq.calcularMascDurnin1974_30a39anos },
  { nome: 'Durnin et al. (1974) - 4skf (40 a 49 anos)', func: Eq.calcularMascDurnin1974_40a49anos },
  { nome: 'Durnin et al. (1974) - 4skf (50 a 72 anos)', func: Eq.calcularMascDurnin1974_50a72anos },
  { nome: 'Durnin et al. (1974) - 1skf (Só Tríceps)', func: Eq.calcularMascDurnin1974_1skd },
  { nome: 'Durnin & Rahaman (1967) - 4skf (< 17 anos)', func: Eq.calcularMascDurninRahaman1967_4skd },
  { nome: 'Forsyth & Sinning (1973) - 2skf', func: Eq.calcularMascForsythSinning1973_2skd },
  { nome: 'Nagamine & Suzuki (1964) - 2skf', func: Eq.calcularMascNagamineSuzuki1964_2skd },
  { nome: 'Sloan (1967) - 2skf', func: Eq.calcularMascSloan1967_2skd },
  { nome: 'Hortobagyi et al. (1992) - Massa/Estatura', func: Eq.calcularMascHortobagyi1992 },
  { nome: 'Ortiz-Hernández et al. (2016) - Mista', func: Eq.calcularMascOrtizHernandez2016 }
];

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