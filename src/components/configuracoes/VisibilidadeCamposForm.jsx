import React from 'react'

const todosCampos = {
  basicas: [
    { key: 'peso_paciente', label: 'Peso' },
    { key: 'altura_paciente', label: 'Estatura / Altura' },
    { key: 'altura_sentado_paciente', label: 'Altura Sentado' },
    { key: 'envergadura_paciente', label: 'Envergadura' }
  ],
  dobras: [
    { key: 'dobra_cutanea_triceps', label: 'Tríceps' },
    { key: 'dobra_cutanea_subescapular', label: 'Subescapular' },
    { key: 'dobra_cutanea_biceps', label: 'Bíceps' },
    { key: 'dobra_cutanea_crista_iliaca', label: 'Crista Ilíaca' },
    { key: 'dobra_cutanea_supraespinhal', label: 'Supraespinhal' },
    { key: 'dobra_cutanea_abdominal', label: 'Abdominal' },
    { key: 'dobra_cutanea_coxa_media', label: 'Coxa Média' },
    { key: 'dobra_cutanea_panturrilha', label: 'Panturrilha' }
  ],
  perimetros: [
    { key: 'perimetro_braco_relaxado', label: 'Braço Relaxado' },
    { key: 'perimetro_braco_contraido', label: 'Braço Contraído' },
    { key: 'perimetro_antibraco', label: 'Antebraço' },
    { key: 'perimetro_cintura', label: 'Cintura' },
    { key: 'perimetro_abdominal', label: 'Abdominal' },
    { key: 'perimetro_quadril', label: 'Quadril' },
    { key: 'perimetro_coxa_maxima', label: 'Coxa Máxima' },
    { key: 'perimetro_coxa_media', label: 'Coxa Média' },
    { key: 'perimetro_panturrilha', label: 'Panturrilha' }
  ],
  diametros: [
    { key: 'diametro_umero', label: 'Úmero' },
    { key: 'diametro_femur', label: 'Fêmur' },
    { key: 'diametro_punho', label: 'Punho' },
    { key: 'diametro_maleolar', label: 'Tornozelo (Maleolar)' }
  ]
}

export default function VisibilidadeCamposForm({ config, setConfig, onSave, saving }) {
  const camposVisiveis = config.campos_visiveis || {
    basicas: todosCampos.basicas.map(c => c.key),
    dobras: todosCampos.dobras.map(c => c.key),
    perimetros: todosCampos.perimetros.map(c => c.key),
    diametros: todosCampos.diametros.map(c => c.key)
  }

  const handleToggle = (categoria, key) => {
    const listaAtual = camposVisiveis[categoria] || []
    let novaLista = []

    if (listaAtual.includes(key)) {
      novaLista = listaAtual.filter(item => item !== key)
    } else {
      novaLista = [...listaAtual, key]
    }

    setConfig(prev => ({
      ...prev,
      campos_visiveis: {
        ...camposVisiveis,
        [categoria]: novaLista
      }
    }))
  }

  const renderBlocoCategory = (titulo, categoria, itens) => (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide border-b pb-1">{titulo}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
        {itens.map(item => {
          const isChecked = (camposVisiveis[categoria] || []).includes(item.key)
          return (
            <label
              key={item.key}
              className={`flex items-center space-x-2 text-xs p-2 rounded-lg border cursor-pointer transition-colors ${
                isChecked ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-semibold' : 'bg-gray-50 border-gray-100 text-gray-400'
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggle(categoria, item.key)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span className="truncate">{item.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Campos do Formulário de Coleta</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Marque os campos que você deseja exibir na tela de inserção de medidas (`AvaliacaoForm`). Ocultar campos não utilizados agiliza sua rotina.
        </p>
      </div>

      {renderBlocoCategory('1. Medidas Básicas', 'basicas', todosCampos.basicas)}
      {renderBlocoCategory('2. Dobras Cutâneas', 'dobras', todosCampos.dobras)}
      {renderBlocoCategory('3. Perímetros / Circunferências', 'perimetros', todosCampos.perimetros)}
      {renderBlocoCategory('4. Diâmetros Ósseos', 'diametros', todosCampos.diametros)}

      <div className="flex justify-end pt-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {saving ? 'Salvando...' : 'Salvar Formulário de Coleta'}
        </button>
      </div>
    </div>
  )
}