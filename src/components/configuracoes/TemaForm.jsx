import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { PRESET_COLORS, DEFAULT_PRIMARY_HEX } from '../../utils/colorTheme'

export default function TemaForm({ config, setConfig, onSave, saving }) {
  const { darkMode, corPrimaria, setDarkMode, setCorPrimaria } = useTheme()

  const escolherModo = (escuro) => {
    setDarkMode(escuro)
    setConfig(prev => ({ ...prev, dark_mode: escuro }))
  }

  const escolherCor = (hex) => {
    setCorPrimaria(hex)
    setConfig(prev => ({ ...prev, cor_primaria: hex }))
  }

  const restaurarPadrao = () => {
    escolherModo(false)
    escolherCor(DEFAULT_PRIMARY_HEX)
  }

  const corEhPreset = PRESET_COLORS.some(c => c.hex.toLowerCase() === corPrimaria.toLowerCase())

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider">Aparência</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          Personalize o modo de exibição e a cor de destaque do sistema. As alterações aparecem
          na hora, e valem para o painel logado e para os laudos/evoluções enviados aos pacientes.
        </p>
      </div>

      {/* MODO CLARO / ESCURO */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
          Modo de exibição
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            type="button"
            onClick={() => escolherModo(false)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold border transition-colors ${
              !darkMode
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            <span>☀️</span> Claro
          </button>
          <button
            type="button"
            onClick={() => escolherModo(true)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold border transition-colors ${
              darkMode
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            <span>🌙</span> Escuro
          </button>
        </div>
      </div>

      {/* COR DE DESTAQUE */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
          Cor de destaque
        </label>
        <div className="flex flex-wrap gap-3">
          {PRESET_COLORS.map((cor) => (
            <button
              key={cor.hex}
              type="button"
              title={cor.nome}
              onClick={() => escolherCor(cor.hex)}
              style={{ backgroundColor: cor.hex }}
              className={`w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 ${
                corPrimaria.toLowerCase() === cor.hex.toLowerCase()
                  ? 'border-gray-800 dark:border-white shadow-md scale-110'
                  : 'border-white dark:border-slate-900 ring-1 ring-gray-200 dark:ring-slate-700'
              }`}
            />
          ))}

          {/* PERSONALIZADA */}
          <label
            title="Cor personalizada"
            className={`relative w-9 h-9 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 overflow-hidden ${
              !corEhPreset
                ? 'border-gray-800 dark:border-white shadow-md scale-110'
                : 'border-white dark:border-slate-900 ring-1 ring-gray-200 dark:ring-slate-700'
            }`}
            style={{
              background: !corEhPreset
                ? corPrimaria
                : 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)'
            }}
          >
            <input
              type="color"
              value={corPrimaria}
              onChange={(e) => escolherCor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
        </div>

        <div className="flex items-center gap-2 mt-3 max-w-[220px]">
          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase">Hex</span>
          <input
            type="text"
            value={corPrimaria}
            onChange={(e) => escolherCor(e.target.value)}
            className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs font-bold text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
        <button
          type="button"
          onClick={restaurarPadrao}
          className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
        >
          Restaurar padrão
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? 'Salvando...' : 'Salvar Aparência'}
        </button>
      </div>
    </div>
  )
}
