import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { aplicarBuscaPorPalavras } from '../utils/buscaAlimentos'

// A maioria das medidas caseiras já vem com a contagem embutida na
// descrição ("1 colher de sopa cheia") — só antepõe "1 " se ainda não
// começar com um número.
function formatarMedidaCaseira(desc) {
  const texto = (desc || '').trim()
  return texto && /^\d/.test(texto) ? texto : `1 ${texto || 'unidade'}`
}

// Mesmas opções do seletor de medida em PlanoAlimentar.jsx, menos "Gramas"
// e "À vontade" — a medida caseira precisa valer pra uma unidade real do
// seletor (qual "colher"/"unidade"/"concha" esse peso representa).
const OPCOES_MEDIDA_CASEIRA = [
  { valor: 'unidade', label: 'Unidade(s)' },
  { valor: 'ml', label: 'Mililitros (ml)' },
  { valor: 'colher_sopa', label: 'Colher de sopa' },
  { valor: 'colher_cha', label: 'Colher de chá' },
  { valor: 'colher_cafe', label: 'Colher de café' },
  { valor: 'copo_americano', label: 'Copo americano' },
  { valor: 'xicara_cha', label: 'Xícara de chá' },
  { valor: 'concha', label: 'Concha média' },
]

const CAMPOS_VAZIOS = {
  nome: '',
  categoria: '',
  unidade_padrao: 'g',
  medida_caseira_desc: '',
  medida_caseira_g: '',
  medida_caseira_unidade: 'unidade',
  energia_kcal: '',
  proteina_g: '',
  lipidios_g: '',
  carboidrato_g: '',
  fibra_g: '',
  acucares_g: '',
  gorduras_saturadas_g: '',
  gorduras_trans_g: '',
  colesterol_mg: '',
  calcio_mg: '',
  ferro_mg: '',
  sodio_mg: '',
  zinco_mg: '',
  vitamina_a_mcg: '',
  vitamina_c_mg: '',
  vitamina_d_mcg: '',
  tiamina_mg: '',
  riboflavina_mg: '',
  niacina_mg: '',
  vitamina_b6_mg: '',
  vitamina_b12_mcg: '',
  magnesio_mg: '',
  fosforo_mg: '',
  potassio_mg: '',
  cromo_mcg: '',
  cobre_mcg: '',
  iodo_mcg: '',
  manganes_mg: '',
  molibdenio_mcg: '',
  selenio_mcg: '',
  vitamina_e_mg: '',
  acido_pantotenico_mg: '',
  biotina_mcg: '',
  folato_mcg: '',
  colina_mg: '',
  vitamina_k_mcg: '',
}

const CAMPOS_PRINCIPAIS = [
  { key: 'energia_kcal', label: 'Energia', unidade: 'kcal' },
  { key: 'proteina_g', label: 'Proteína', unidade: 'g' },
  { key: 'lipidios_g', label: 'Lipídios', unidade: 'g' },
  { key: 'carboidrato_g', label: 'Carboidrato', unidade: 'g' },
  { key: 'fibra_g', label: 'Fibra Alimentar', unidade: 'g' },
  { key: 'sodio_mg', label: 'Sódio', unidade: 'mg' },
]

const CAMPOS_EXTRAS = [
  { key: 'acucares_g', label: 'Açúcares', unidade: 'g' },
  { key: 'gorduras_saturadas_g', label: 'Gorduras Saturadas', unidade: 'g' },
  { key: 'gorduras_trans_g', label: 'Gorduras Trans', unidade: 'g' },
  { key: 'colesterol_mg', label: 'Colesterol', unidade: 'mg' },
  { key: 'calcio_mg', label: 'Cálcio', unidade: 'mg' },
  { key: 'ferro_mg', label: 'Ferro', unidade: 'mg' },
  { key: 'zinco_mg', label: 'Zinco', unidade: 'mg' },
  { key: 'vitamina_a_mcg', label: 'Vitamina A', unidade: 'mcg' },
  { key: 'vitamina_c_mg', label: 'Vitamina C', unidade: 'mg' },
  { key: 'vitamina_d_mcg', label: 'Vitamina D', unidade: 'mcg' },
  { key: 'tiamina_mg', label: 'Tiamina (B1)', unidade: 'mg' },
  { key: 'riboflavina_mg', label: 'Riboflavina (B2)', unidade: 'mg' },
  { key: 'niacina_mg', label: 'Niacina (B3)', unidade: 'mg' },
  { key: 'vitamina_b6_mg', label: 'Vitamina B6', unidade: 'mg' },
  { key: 'vitamina_b12_mcg', label: 'Vitamina B12', unidade: 'mcg' },
  { key: 'magnesio_mg', label: 'Magnésio', unidade: 'mg' },
  { key: 'fosforo_mg', label: 'Fósforo', unidade: 'mg' },
  { key: 'potassio_mg', label: 'Potássio', unidade: 'mg' },
  { key: 'cromo_mcg', label: 'Cromo', unidade: 'mcg' },
  { key: 'cobre_mcg', label: 'Cobre', unidade: 'mcg' },
  { key: 'iodo_mcg', label: 'Iodo', unidade: 'mcg' },
  { key: 'manganes_mg', label: 'Manganês', unidade: 'mg' },
  { key: 'molibdenio_mcg', label: 'Molibdênio', unidade: 'mcg' },
  { key: 'selenio_mcg', label: 'Selênio', unidade: 'mcg' },
  { key: 'vitamina_e_mg', label: 'Vitamina E', unidade: 'mg' },
  { key: 'acido_pantotenico_mg', label: 'Ácido Pantotênico (B5)', unidade: 'mg' },
  { key: 'biotina_mcg', label: 'Biotina (B7)', unidade: 'mcg' },
  { key: 'folato_mcg', label: 'Folato', unidade: 'mcg' },
  { key: 'colina_mg', label: 'Colina', unidade: 'mg' },
  { key: 'vitamina_k_mcg', label: 'Vitamina K', unidade: 'mcg' },
]

const BADGE_FONTE = {
  TACO: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  IBGE: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  USDA: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  Fabricante: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800',
  Customizado: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
}

export default function TabelaAlimentos({ userId }) {
  const [busca, setBusca] = useState('')
  const [alimentos, setAlimentos] = useState([])
  const [buscando, setBuscando] = useState(false)

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [isOverride, setIsOverride] = useState(false)
  const [overrides, setOverrides] = useState({})
  const [mostrarMais, setMostrarMais] = useState(false)
  const [form, setForm] = useState(CAMPOS_VAZIOS)
  const [saving, setSaving] = useState(false)
  const [excluindoId, setExcluindoId] = useState(null)

  useEffect(() => {
    if (busca.trim().length < 2) {
      setAlimentos([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setBuscando(true)
      const { data, error } = await aplicarBuscaPorPalavras(
        supabase.from('tabela_alimentos').select('*'),
        'nome',
        busca
      )
        .order('nome')
        .limit(50)

      const lista = data || []
      if (!error) setAlimentos(lista)

      const idsOficiais = lista.filter((a) => !a.id_avaliador).map((a) => a.id)
      if (idsOficiais.length > 0) {
        const { data: ovs } = await supabase
          .from('alimentos_medida_caseira_pessoal')
          .select('*')
          .eq('id_avaliador', userId)
          .in('id_alimento', idsOficiais)
        const mapa = {}
        for (const o of ovs || []) mapa[o.id_alimento] = o
        setOverrides(mapa)
      } else {
        setOverrides({})
      }

      setBuscando(false)
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [busca, userId])

  const abrirNovoAlimento = () => {
    setEditingId(null)
    setIsOverride(false)
    setForm(CAMPOS_VAZIOS)
    setMostrarMais(false)
    setShowModal(true)
  }

  const abrirEdicaoAlimento = (a) => {
    setEditingId(a.id)
    setIsOverride(false)
    const preenchido = { ...CAMPOS_VAZIOS }
    for (const key of Object.keys(CAMPOS_VAZIOS)) {
      preenchido[key] = a[key] ?? ''
    }
    setForm(preenchido)
    setMostrarMais(false)
    setShowModal(true)
  }

  // Alimento oficial (TACO/IBGE/Fabricante) não pode ser editado de
  // verdade — não tem dono, e mudar o valor nutricional afetaria todo
  // mundo. Isso só anota a medida caseira PESSOAL desse nutri por cima
  // dele, numa tabela separada (alimentos_medida_caseira_pessoal).
  const abrirEdicaoMedidaPessoal = (a) => {
    setEditingId(a.id)
    setIsOverride(true)
    const ov = overrides[a.id]
    setForm({
      ...CAMPOS_VAZIOS,
      nome: a.nome,
      medida_caseira_desc: ov?.medida_caseira_desc ?? a.medida_caseira_desc ?? '',
      medida_caseira_g: ov?.medida_caseira_g ?? a.medida_caseira_g ?? '',
      medida_caseira_unidade: ov?.medida_caseira_unidade ?? a.medida_caseira_unidade ?? 'unidade',
    })
    setMostrarMais(false)
    setShowModal(true)
  }

  const handleRemoverMedidaPessoal = async () => {
    if (!window.confirm('Remover sua medida caseira pessoal desse alimento?')) return
    setSaving(true)
    const { error } = await supabase
      .from('alimentos_medida_caseira_pessoal')
      .delete()
      .eq('id_avaliador', userId)
      .eq('id_alimento', editingId)
    setSaving(false)
    if (error) { alert('Erro ao remover: ' + error.message); return }
    setShowModal(false)
    setOverrides((prev) => {
      const novo = { ...prev }
      delete novo[editingId]
      return novo
    })
  }

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const numerico = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

    if (isOverride) {
      const { error } = await supabase
        .from('alimentos_medida_caseira_pessoal')
        .upsert(
          {
            id_avaliador: userId,
            id_alimento: editingId,
            medida_caseira_desc: form.medida_caseira_desc.trim() || null,
            medida_caseira_g: numerico(form.medida_caseira_g),
            medida_caseira_unidade: form.medida_caseira_unidade || 'unidade',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id_avaliador,id_alimento' }
        )
        .select()
        .single()
      setSaving(false)
      if (error) { alert('Erro ao salvar medida caseira: ' + error.message); return }
      setShowModal(false)
      setOverrides((prev) => ({
        ...prev,
        [editingId]: {
          medida_caseira_desc: form.medida_caseira_desc.trim() || null,
          medida_caseira_g: numerico(form.medida_caseira_g),
          medida_caseira_unidade: form.medida_caseira_unidade || 'unidade',
        },
      }))
      return
    }

    const payload = {
      nome: form.nome.trim(),
      categoria: form.categoria.trim() || null,
      unidade_padrao: form.unidade_padrao.trim() || 'g',
      medida_caseira_desc: form.medida_caseira_desc.trim() || null,
      medida_caseira_g: numerico(form.medida_caseira_g),
      medida_caseira_unidade: form.medida_caseira_unidade || 'unidade',
      energia_kcal: numerico(form.energia_kcal),
      proteina_g: numerico(form.proteina_g),
      lipidios_g: numerico(form.lipidios_g),
      carboidrato_g: numerico(form.carboidrato_g),
      fibra_g: numerico(form.fibra_g),
      acucares_g: numerico(form.acucares_g),
      gorduras_saturadas_g: numerico(form.gorduras_saturadas_g),
      gorduras_trans_g: numerico(form.gorduras_trans_g),
      colesterol_mg: numerico(form.colesterol_mg),
      calcio_mg: numerico(form.calcio_mg),
      ferro_mg: numerico(form.ferro_mg),
      sodio_mg: numerico(form.sodio_mg),
      zinco_mg: numerico(form.zinco_mg),
      vitamina_a_mcg: numerico(form.vitamina_a_mcg),
      vitamina_c_mg: numerico(form.vitamina_c_mg),
      vitamina_d_mcg: numerico(form.vitamina_d_mcg),
      tiamina_mg: numerico(form.tiamina_mg),
      riboflavina_mg: numerico(form.riboflavina_mg),
      niacina_mg: numerico(form.niacina_mg),
      vitamina_b6_mg: numerico(form.vitamina_b6_mg),
      vitamina_b12_mcg: numerico(form.vitamina_b12_mcg),
      magnesio_mg: numerico(form.magnesio_mg),
      fosforo_mg: numerico(form.fosforo_mg),
      potassio_mg: numerico(form.potassio_mg),
      cromo_mcg: numerico(form.cromo_mcg),
      cobre_mcg: numerico(form.cobre_mcg),
      iodo_mcg: numerico(form.iodo_mcg),
      manganes_mg: numerico(form.manganes_mg),
      molibdenio_mcg: numerico(form.molibdenio_mcg),
      selenio_mcg: numerico(form.selenio_mcg),
      vitamina_e_mg: numerico(form.vitamina_e_mg),
      acido_pantotenico_mg: numerico(form.acido_pantotenico_mg),
      biotina_mcg: numerico(form.biotina_mcg),
      folato_mcg: numerico(form.folato_mcg),
      colina_mg: numerico(form.colina_mg),
      vitamina_k_mcg: numerico(form.vitamina_k_mcg),
    }

    if (editingId) {
      const { error } = await supabase.from('tabela_alimentos').update(payload).eq('id', editingId)
      if (error) {
        alert('Erro ao atualizar alimento: ' + error.message)
      } else {
        setShowModal(false)
        setAlimentos((prev) => prev.map((a) => (a.id === editingId ? { ...a, ...payload } : a)))
      }
    } else {
      const { data, error } = await supabase
        .from('tabela_alimentos')
        .insert({ ...payload, fonte: 'Customizado', id_avaliador: userId })
        .select()
        .single()

      if (error) {
        alert('Erro ao cadastrar alimento: ' + error.message)
      } else {
        setShowModal(false)
        if (data && busca.trim() && data.nome.toLowerCase().includes(busca.trim().toLowerCase())) {
          setAlimentos((prev) => [data, ...prev])
        }
      }
    }

    setSaving(false)
  }

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir este alimento customizado? Essa ação não pode ser desfeita.')) return

    setExcluindoId(id)
    const { error } = await supabase.from('tabela_alimentos').delete().eq('id', id)
    setExcluindoId(null)

    if (error) {
      alert('Erro ao excluir alimento: ' + error.message)
    } else {
      setAlimentos((prev) => prev.filter((a) => a.id !== id))
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Tabela de Alimentos</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Base oficial (TACO) + seus alimentos customizados — valores por 100g
          </p>
        </div>
        <button
          onClick={abrirNovoAlimento}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors shrink-0"
        >
          + Novo Alimento
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
          Buscar Alimento
        </label>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Digite ao menos 2 letras (ex: arroz, frango, aveia...)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm outline-none bg-gray-50/50 dark:bg-slate-800/70 focus:bg-white focus:ring-2 focus:ring-primary-500"
        />

        <div className="mt-4">
          {busca.trim().length < 2 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">
              Digite pelo menos 2 letras para buscar.
            </p>
          ) : buscando ? (
            <p className="text-sm text-primary-600 font-semibold text-center py-6 animate-pulse">Buscando...</p>
          ) : alimentos.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6">
              Nenhum alimento encontrado para "{busca}".
            </p>
          ) : (
            <div className="space-y-2">
              {alimentos.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-lg border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-800 dark:text-slate-100">{a.nome}</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            BADGE_FONTE[a.fonte] || BADGE_FONTE.Customizado
                          }`}
                        >
                          {a.fonte}
                        </span>
                      </div>
                      {a.categoria && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{a.categoria}</p>
                      )}
                    </div>

                    <div className="flex gap-3 shrink-0">
                      {a.id_avaliador === userId ? (
                        <>
                          <button
                            onClick={() => abrirEdicaoAlimento(a)}
                            className="text-xs font-semibold text-primary-600 hover:underline"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleExcluir(a.id)}
                            disabled={excluindoId === a.id}
                            className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                          >
                            {excluindoId === a.id ? 'Excluindo...' : 'Excluir'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => abrirEdicaoMedidaPessoal(a)}
                          title="Anotar sua própria medida caseira pra esse alimento, sem alterar o valor oficial"
                          className="text-xs font-semibold text-primary-600 hover:underline"
                        >
                          Medida caseira
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600 dark:text-slate-400">
                    <span>{a.energia_kcal ?? '-'} kcal</span>
                    <span>{a.proteina_g ?? '-'}g proteína</span>
                    <span>{a.lipidios_g ?? '-'}g lipídios</span>
                    <span>{a.carboidrato_g ?? '-'}g carboidrato</span>
                  </div>

                  {a.id_avaliador !== userId && overrides[a.id]?.medida_caseira_g && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                      Sua medida pessoal: {formatarMedidaCaseira(overrides[a.id].medida_caseira_desc)} ≈ {overrides[a.id].medida_caseira_g}g
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                {isOverride ? 'Medida Caseira Pessoal' : editingId ? 'Editar Alimento' : 'Novo Alimento'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {isOverride ? (
                <>
                  <p className="text-sm font-bold text-gray-800 dark:text-slate-100">{form.nome}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 -mt-3">
                    Alimento oficial — não dá pra editar o valor nutricional dele (é compartilhado com todos os nutricionistas). Aqui você só anota a SUA medida caseira, visível só pra você.
                  </p>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-gray-50/50 dark:bg-slate-800/70 focus:bg-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              {!isOverride && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={form.categoria}
                      onChange={(e) => handleChange('categoria', e.target.value)}
                      placeholder="Ex: Frutas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Unidade Padrão
                    </label>
                    <input
                      type="text"
                      value={form.unidade_padrao}
                      onChange={(e) => handleChange('unidade_padrao', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Medida Caseira — aplica a qual unidade do seletor?
                </label>
                <select
                  value={form.medida_caseira_unidade}
                  onChange={(e) => handleChange('medida_caseira_unidade', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {OPCOES_MEDIDA_CASEIRA.map((o) => (
                    <option key={o.valor} value={o.valor}>{o.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                  Ex: arroz/feijão pesam diferente por "Colher de sopa" — escolha essa opção aqui pra esse peso valer quando o nutricionista escolher "Colher de sopa" no Plano Alimentar (em vez do valor genérico da lista).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Medida Caseira (descrição)
                  </label>
                  <input
                    type="text"
                    value={form.medida_caseira_desc}
                    onChange={(e) => handleChange('medida_caseira_desc', e.target.value)}
                    placeholder="Ex: 1 colher de sopa cheia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Medida Caseira (g)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.medida_caseira_g}
                    onChange={(e) => handleChange('medida_caseira_g', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {!isOverride && (
                <>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider pt-2">
                    Valores por 100g
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {CAMPOS_PRINCIPAIS.map((campo) => (
                      <div key={campo.key}>
                        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                          {campo.label} ({campo.unidade})
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={form[campo.key]}
                          onChange={(e) => handleChange(campo.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setMostrarMais((v) => !v)}
                    className="text-xs font-semibold text-primary-600 hover:underline"
                  >
                    {mostrarMais ? '- Ocultar mais nutrientes' : '+ Mostrar mais nutrientes'}
                  </button>

                  {mostrarMais && (
                    <div className="grid grid-cols-2 gap-3">
                      {CAMPOS_EXTRAS.map((campo) => (
                        <div key={campo.key}>
                          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            {campo.label} ({campo.unidade})
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={form[campo.key]}
                            onChange={(e) => handleChange(campo.key, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                {isOverride && overrides[editingId] && (
                  <button
                    type="button"
                    onClick={handleRemoverMedidaPessoal}
                    disabled={saving}
                    className="mr-auto text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                  >
                    Remover minha medida pessoal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : isOverride ? 'Salvar Medida Caseira' : editingId ? 'Atualizar Alimento' : 'Salvar Alimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
