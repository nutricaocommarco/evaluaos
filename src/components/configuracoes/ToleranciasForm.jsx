import React from 'react'

export default function ToleranciasForm({ config, setConfig, onSave, saving }) {
  const handleChange = (campo, valor) => {
    setConfig(prev => ({ ...prev, [campo]: Number(valor) }))
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 uppercase tracking-wider">Tolerâncias & Tira-teima (ISAK)</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
          Defina a variação percentual máxima permitida entre a 1ª e 2ª medida antes de exigir a 3ª medição.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Dobras Cutâneas (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="20"
            value={config.tolerancia_dobras ?? 5.0}
            onChange={(e) => handleChange('tolerancia_dobras', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm font-bold text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <span className="text-[10px] text-gray-400 dark:text-slate-400">Padrão ISAK: 5.0%</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Perímetros / Circunferências (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="20"
            value={config.tolerancia_perimetros ?? 1.0}
            onChange={(e) => handleChange('tolerancia_perimetros', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm font-bold text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <span className="text-[10px] text-gray-400 dark:text-slate-400">Padrão ISAK: 1.0%</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Diâmetros Ósseos (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="20"
            value={config.tolerancia_diametros ?? 1.0}
            onChange={(e) => handleChange('tolerancia_diametros', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm font-bold text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <span className="text-[10px] text-gray-400 dark:text-slate-400">Padrão ISAK: 1.0%</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Medidas Básicas (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="20"
            value={config.tolerancia_basicas ?? 1.0}
            onChange={(e) => handleChange('tolerancia_basicas', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm font-bold text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 outline-none"
          />
          <span className="text-[10px] text-gray-400 dark:text-slate-400">Padrão recomendados: 1.0%</span>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? 'Salvando...' : 'Salvar Tolerâncias'}
        </button>
      </div>
    </div>
  )
}