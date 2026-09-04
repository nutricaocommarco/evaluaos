import React, { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../supabaseClient'
import RichTextEditor, { sanitizarHtmlEditor } from '../components/RichTextEditor'
import CampoImagem from '../components/imagens/CampoImagem'
import ConfirmModal from '../components/ConfirmModal'
import { aplicarBuscaPorPalavras, ordenarPorRelevancia } from '../utils/buscaAlimentos'
import { ChefHat, Clock, Layers, Plus, X, Trash2, Search } from 'lucide-react'

const CAMPOS_VAZIOS = {
  nome: '', descricao: '', imagem_url: null, modo_preparo: '',
  peso_final_g: '', rendimento_porcoes: '', tempo_preparo_min: '',
  tags: [], habilitado_planos: false,
  energia_kcal: '', proteina_g: '', lipidios_g: '', carboidrato_g: '', fibra_g: '', acucares_g: '',
  gorduras_saturadas_g: '', gorduras_trans_g: '', colesterol_mg: '', calcio_mg: '', ferro_mg: '',
  sodio_mg: '', zinco_mg: '', vitamina_a_mcg: '', vitamina_c_mg: '', vitamina_d_mcg: '',
  tiamina_mg: '', riboflavina_mg: '', niacina_mg: '', vitamina_b6_mg: '', vitamina_b12_mcg: '',
  magnesio_mg: '', fosforo_mg: '', potassio_mg: '', cromo_mcg: '', cobre_mcg: '', iodo_mcg: '',
  manganes_mg: '', molibdenio_mcg: '', selenio_mcg: '', vitamina_e_mg: '', acido_pantotenico_mg: '',
  biotina_mcg: '', folato_mcg: '', colina_mg: '', vitamina_k_mcg: '',
}

// Mesmos campos/ordem/rótulos de src/pages/TabelaAlimentos.jsx — aqui os
// valores representam o TOTAL da receita inteira (peso_final_g), não por
// 100g, mas a UI/rótulo é idêntica pra manter familiaridade com quem já
// usa a Tabela de Alimentos.
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

const CAMPOS_NUTRIENTES = [...CAMPOS_PRINCIPAIS, ...CAMPOS_EXTRAS].map((c) => c.key)

const CORES_TAG = [
  'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800',
  'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800',
  'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800',
  'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
]

// Cor consistente por nome de tag (mesmo hash sempre dá a mesma cor), sem
// precisar guardar cor no banco — catálogo de tags é só o Set das tags já
// em uso nas receitas do nutricionista, calculado no client.
function corTag(nome) {
  let hash = 0
  for (let i = 0; i < nome.length; i++) hash = nome.charCodeAt(i) + ((hash << 5) - hash)
  return CORES_TAG[Math.abs(hash) % CORES_TAG.length]
}

function formatarData(d) {
  return d ? new Date(d).toLocaleDateString('pt-BR') : '-'
}

function fmtNum(n) {
  const v = Number(n)
  return Number.isFinite(v) ? (Math.round(v * 10) / 10).toString().replace('.', ',') : '-'
}

async function buscarAlimentos(termo) {
  const { data } = await aplicarBuscaPorPalavras(supabase.from('tabela_alimentos').select('*'), 'nome', termo).order('nome').limit(60)
  return ordenarPorRelevancia(data || [], termo).slice(0, 15)
}

// Converte os nutrientes TOTAIS da receita (por peso_final_g) pra por
// 100g, formato que tabela_alimentos espera.
function nutrientesPor100g(form) {
  const peso = Number(form.peso_final_g)
  if (!(peso > 0)) return null
  const fator = 100 / peso
  const campos = {}
  for (const key of CAMPOS_NUTRIENTES) {
    const v = Number(form[key])
    campos[key] = Number.isFinite(v) && form[key] !== '' ? Number((v * fator).toFixed(3)) : null
  }
  return campos
}

// Cria/atualiza o alimento sincronizado (visível na busca de alimento de
// qualquer Plano Alimentar, como qualquer outro alimento) a partir dos
// dados atuais da receita. Retorna o id do alimento, ou null em erro.
async function sincronizarAlimentoReceita(receitaSalva, userId) {
  const nutrientes = nutrientesPor100g(receitaSalva)
  if (!nutrientes) {
    alert('Defina o peso final (g) da receita antes de habilitar pra uso em planos alimentares.')
    return null
  }
  const rendimento = Number(receitaSalva.rendimento_porcoes)
  const porcaoG = rendimento > 0 ? Number(receitaSalva.peso_final_g) / rendimento : null
  const payload = {
    id_avaliador: userId,
    nome: receitaSalva.nome,
    categoria: 'Receita',
    fonte: 'Customizado',
    id_receita: receitaSalva.id,
    medida_caseira_unidade: porcaoG ? 'unidade' : null,
    medida_caseira_desc: porcaoG ? '1 porção' : null,
    medida_caseira_g: porcaoG,
    ...nutrientes,
  }
  if (receitaSalva.id_alimento_sincronizado) {
    const { data, error } = await supabase.from('tabela_alimentos').update(payload).eq('id', receitaSalva.id_alimento_sincronizado).select('id').single()
    if (error) { alert('Erro ao sincronizar com a Tabela de Alimentos: ' + error.message); return null }
    return data.id
  }
  const { data, error } = await supabase.from('tabela_alimentos').insert(payload).select('id').single()
  if (error) { alert('Erro ao sincronizar com a Tabela de Alimentos: ' + error.message); return null }
  return data.id
}

// Tenta apagar o alimento sincronizado. Se ele já foi usado em algum plano
// alimentar, tabela_alimentos.on delete restrict bloqueia — igual já
// acontece hoje pra qualquer alimento em uso, então só avisa e mantém.
async function dessincronizarAlimentoReceita(idAlimentoSincronizado, nomeReceita) {
  const { error } = await supabase.from('tabela_alimentos').delete().eq('id', idAlimentoSincronizado)
  if (error) {
    alert(`Não dá pra desabilitar "${nomeReceita}": ela já foi usada em algum plano alimentar de paciente.`)
    return false
  }
  return true
}

function somarIngredientes(ingredientes) {
  const soma = {}
  for (const key of CAMPOS_NUTRIENTES) soma[key] = 0
  for (const ing of ingredientes) {
    const fator = (Number(ing.quantidade_g) || 0) / 100
    for (const key of CAMPOS_NUTRIENTES) {
      const v = Number(ing.tabela_alimentos?.[key])
      if (Number.isFinite(v)) soma[key] += v * fator
    }
  }
  for (const key of CAMPOS_NUTRIENTES) soma[key] = Number(soma[key].toFixed(3))
  return soma
}

// Busca de alimento + gramas pra montar a lista de ingredientes usada só
// pelo botão "Calcular a partir de alimentos" (mesmo padrão de busca já
// usado em Modelos.jsx > AdicionarAlimentoGrupoForm).
function AdicionarIngredienteForm({ onAdicionar, onCancelar }) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selecionado, setSelecionado] = useState(null)
  const [quantidade, setQuantidade] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (busca.trim().length < 2) { setResultados([]); return }
    const delay = setTimeout(async () => setResultados(await buscarAlimentos(busca.trim())), 300)
    return () => clearTimeout(delay)
  }, [busca])

  useEffect(() => {
    const handleClickFora = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false) }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  const handleAdicionar = () => {
    if (!selecionado || !quantidade || Number(quantidade) <= 0) return
    onAdicionar({ id_temp: `novo-${Date.now()}`, id_alimento: selecionado.id, quantidade_g: Number(quantidade), tabela_alimentos: selecionado })
    setBusca(''); setSelecionado(null); setQuantidade('')
  }

  return (
    <div className="flex flex-wrap items-end gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-200 dark:border-slate-700">
      <div className="relative flex-1 min-w-[160px]" ref={dropdownRef}>
        <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Ingrediente</label>
        <input
          type="text"
          value={selecionado ? selecionado.nome : busca}
          onChange={(e) => { setBusca(e.target.value); setSelecionado(null); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Buscar alimento..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
        />
        {showDropdown && !selecionado && resultados.length > 0 && (
          <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
            {resultados.map((r) => (
              <li key={r.id} onClick={() => { setSelecionado(r); setShowDropdown(false) }} className="px-3 py-2 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 text-xs border-b border-gray-100 dark:border-slate-800 last:border-0">
                <span className="font-semibold">{r.nome}</span>
                <span className="text-gray-400 dark:text-slate-500 ml-2">{r.energia_kcal ?? '-'} kcal/100g</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="w-24">
        <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Qtd (g)</label>
        <input type="number" step="any" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
      </div>
      <button type="button" onClick={handleAdicionar} disabled={!selecionado || !quantidade || Number(quantidade) <= 0} className="px-3 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 shrink-0">
        Adicionar
      </button>
      <button type="button" onClick={onCancelar} className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-700 shrink-0">Cancelar</button>
    </div>
  )
}

function CalculadoraIngredientes({ ingredientes, onIngredientesChange, onAplicar, onFechar }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const totais = somarIngredientes(ingredientes)

  return (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Calcular nutrientes a partir de alimentos</span>
        <button type="button" onClick={onFechar} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
      </div>
      {ingredientes.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-500">Nenhum ingrediente ainda.</p>
      ) : (
        <ul className="space-y-1">
          {ingredientes.map((ing) => (
            <li key={ing.id_temp} className="flex items-center justify-between gap-2 text-xs text-gray-700 dark:text-slate-300">
              <span className="min-w-0 truncate">{ing.tabela_alimentos?.nome} — {ing.quantidade_g}g</span>
              <button type="button" onClick={() => onIngredientesChange(ingredientes.filter((i) => i.id_temp !== ing.id_temp))} className="text-red-500 hover:text-red-700 shrink-0">
                <Trash2 size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {mostrarForm ? (
        <AdicionarIngredienteForm onAdicionar={(ing) => { onIngredientesChange([...ingredientes, ing]); setMostrarForm(false) }} onCancelar={() => setMostrarForm(false)} />
      ) : (
        <button type="button" onClick={() => setMostrarForm(true)} className="text-xs font-semibold text-primary-600 hover:underline">+ Adicionar ingrediente</button>
      )}
      {ingredientes.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-slate-700">
          <span className="text-xs text-gray-500 dark:text-slate-400">
            Total: {fmtNum(totais.energia_kcal)}kcal · P{fmtNum(totais.proteina_g)}g · C{fmtNum(totais.carboidrato_g)}g · L{fmtNum(totais.lipidios_g)}g
          </span>
          <button type="button" onClick={() => onAplicar(totais)} className="px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700">
            Usar esses valores
          </button>
        </div>
      )}
    </div>
  )
}

function ModalReceita({ receita, userId, onFechar, onSalvo }) {
  const podeEditar = !receita || receita.id_avaliador === userId
  const [form, setForm] = useState(() => {
    if (!receita) return CAMPOS_VAZIOS
    const preenchido = { ...CAMPOS_VAZIOS }
    for (const key of Object.keys(CAMPOS_VAZIOS)) preenchido[key] = receita[key] ?? CAMPOS_VAZIOS[key]
    preenchido.tags = receita.tags || []
    return preenchido
  })
  const [ingredientes, setIngredientes] = useState([])
  const [ingredientesCarregados, setIngredientesCarregados] = useState(!receita)
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false)
  const [mostrarExtras, setMostrarExtras] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!receita) return
    supabase
      .from('receitas_ingredientes')
      .select('*, tabela_alimentos(*)')
      .eq('id_receita', receita.id)
      .order('ordem')
      .then(({ data }) => {
        setIngredientes((data || []).map((i) => ({ id_temp: `db-${i.id}`, id_alimento: i.id_alimento, quantidade_g: i.quantidade_g, tabela_alimentos: i.tabela_alimentos })))
        setIngredientesCarregados(true)
      })
  }, [receita])

  const handleAplicarCalculo = (totais) => {
    setForm((f) => {
      const novo = { ...f }
      for (const key of CAMPOS_NUTRIENTES) novo[key] = totais[key] || ''
      return novo
    })
    setMostrarCalculadora(false)
  }

  const handleAdicionarTag = () => {
    const t = tagInput.trim()
    if (!t || form.tags.includes(t)) { setTagInput(''); return }
    setForm((f) => ({ ...f, tags: [...f.tags, t] }))
    setTagInput('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!podeEditar || salvando) return
    setSalvando(true)

    const payload = { ...form }
    payload.modo_preparo = sanitizarHtmlEditor(payload.modo_preparo || '')
    for (const key of [...CAMPOS_NUTRIENTES, 'peso_final_g', 'rendimento_porcoes', 'tempo_preparo_min']) {
      payload[key] = payload[key] === '' ? null : Number(payload[key])
    }
    delete payload.habilitado_planos

    let receitaSalva
    if (receita) {
      const { data, error } = await supabase.from('receitas').update(payload).eq('id', receita.id).select().single()
      if (error) { alert('Erro ao salvar receita: ' + error.message); setSalvando(false); return }
      receitaSalva = data
    } else {
      const { data, error } = await supabase.from('receitas').insert({ ...payload, id_avaliador: userId }).select().single()
      if (error) { alert('Erro ao criar receita: ' + error.message); setSalvando(false); return }
      receitaSalva = data
    }

    // ingredientes: apaga tudo e reinsere (cópia simples, mesmo espírito
    // de "snapshot" já usado em Modelos pra não precisar de diff)
    await supabase.from('receitas_ingredientes').delete().eq('id_receita', receitaSalva.id)
    if (ingredientes.length > 0) {
      await supabase.from('receitas_ingredientes').insert(
        ingredientes.map((ing, i) => ({ id_receita: receitaSalva.id, id_alimento: ing.id_alimento, quantidade_g: ing.quantidade_g, ordem: i }))
      )
    }

    // habilitar/desabilitar pra uso em planos
    const habilitarAgora = !!form.habilitado_planos
    const jaHabilitada = !!receita?.habilitado_planos
    if (habilitarAgora && !receitaSalva.id_alimento_sincronizado) {
      const idAlimento = await sincronizarAlimentoReceita(receitaSalva, userId)
      if (idAlimento) {
        await supabase.from('receitas').update({ habilitado_planos: true, id_alimento_sincronizado: idAlimento }).eq('id', receitaSalva.id)
      }
    } else if (habilitarAgora && receitaSalva.id_alimento_sincronizado) {
      await sincronizarAlimentoReceita(receitaSalva, userId)
      await supabase.from('receitas').update({ habilitado_planos: true }).eq('id', receitaSalva.id)
    } else if (!habilitarAgora && jaHabilitada && receita.id_alimento_sincronizado) {
      const ok = await dessincronizarAlimentoReceita(receita.id_alimento_sincronizado, form.nome)
      await supabase.from('receitas').update({ habilitado_planos: !ok, id_alimento_sincronizado: ok ? null : receita.id_alimento_sincronizado }).eq('id', receitaSalva.id)
    } else if (!habilitarAgora) {
      await supabase.from('receitas').update({ habilitado_planos: false }).eq('id', receitaSalva.id)
    }

    setSalvando(false)
    onSalvo()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
            {!podeEditar ? 'Ver Receita' : receita ? 'Editar Receita' : 'Nova Receita'}
          </h3>
          <button onClick={onFechar} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {!podeEditar && (
            <p className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              Receita padrão do EvaluaOS — só visualização.
            </p>
          )}

          <CampoImagem valor={form.imagem_url} onChange={podeEditar ? (url) => setForm((f) => ({ ...f, imagem_url: url })) : () => {}} label="Imagem" />

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nome</label>
            <input type="text" required disabled={!podeEditar} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-slate-800" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Descrição</label>
            <textarea disabled={!podeEditar} value={form.descricao || ''} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-slate-800" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Peso final (g)</label>
              <input type="number" step="any" disabled={!podeEditar} value={form.peso_final_g} onChange={(e) => setForm((f) => ({ ...f, peso_final_g: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-slate-800" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Rendimento (porções)</label>
              <input type="number" step="any" disabled={!podeEditar} value={form.rendimento_porcoes} onChange={(e) => setForm((f) => ({ ...f, rendimento_porcoes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-slate-800" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tempo de preparo (min)</label>
              <input type="number" disabled={!podeEditar} value={form.tempo_preparo_min} onChange={(e) => setForm((f) => ({ ...f, tempo_preparo_min: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-slate-800" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {form.tags.map((t) => (
                <span key={t} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${corTag(t)}`}>
                  {t}
                  {podeEditar && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))}>
                      <X size={10} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {podeEditar && (
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdicionarTag() } }}
                placeholder="Digite uma tag e Enter"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Ingredientes e modo de preparo</label>
            {podeEditar ? (
              <RichTextEditor initialHtml={form.modo_preparo} onChange={(html) => setForm((f) => ({ ...f, modo_preparo: html }))} placeholder="Liste os ingredientes e o passo a passo do preparo..." />
            ) : (
              <div className="rte-html text-sm text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-lg p-3" dangerouslySetInnerHTML={{ __html: form.modo_preparo || '-' }} />
            )}
          </div>

          <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-800 dark:text-slate-100">Nutrientes (receita inteira)</span>
              {podeEditar && ingredientesCarregados && (
                <button type="button" onClick={() => setMostrarCalculadora((v) => !v)} className="text-xs font-semibold text-primary-600 hover:underline">
                  Calcular a partir de alimentos
                </button>
              )}
            </div>
            {mostrarCalculadora && (
              <CalculadoraIngredientes ingredientes={ingredientes} onIngredientesChange={setIngredientes} onAplicar={handleAplicarCalculo} onFechar={() => setMostrarCalculadora(false)} />
            )}
            <div className="grid grid-cols-3 gap-3">
              {CAMPOS_PRINCIPAIS.map((c) => (
                <div key={c.key}>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">{c.label} ({c.unidade})</label>
                  <input type="number" step="any" disabled={!podeEditar} value={form[c.key]} onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-slate-800" />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setMostrarExtras((v) => !v)} className="text-xs font-semibold text-primary-600 hover:underline">
              {mostrarExtras ? 'Ocultar micronutrientes' : 'Mostrar mais (micronutrientes)'}
            </button>
            {mostrarExtras && (
              <div className="grid grid-cols-3 gap-3">
                {CAMPOS_EXTRAS.map((c) => (
                  <div key={c.key}>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">{c.label} ({c.unidade})</label>
                    <input type="number" step="any" disabled={!podeEditar} value={form[c.key]} onChange={(e) => setForm((f) => ({ ...f, [c.key]: e.target.value }))} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 dark:disabled:bg-slate-800" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" disabled={!podeEditar} checked={form.habilitado_planos} onChange={(e) => setForm((f) => ({ ...f, habilitado_planos: e.target.checked }))} className="w-4 h-4" />
            <span className="text-sm text-gray-700 dark:text-slate-300">Habilitar para uso em planos alimentares</span>
          </label>

          {podeEditar && (
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onFechar} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-slate-400 hover:text-gray-800">Cancelar</button>
              <button type="submit" disabled={salvando} className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {salvando ? 'Salvando...' : 'Salvar receita'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

function CardReceita({ receita, podeEditar, onClick, onExcluir }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="w-full h-32 bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
        {receita.imagem_url ? (
          <img src={receita.imagem_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <ChefHat size={28} className="text-gray-300 dark:text-slate-600" />
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-black text-gray-800 dark:text-slate-100 truncate">{receita.nome}</p>
          {podeEditar && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onExcluir(receita.id) }}
              className="text-gray-300 hover:text-red-500 shrink-0"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-400 dark:text-slate-500">
          {!receita.id_avaliador ? 'Padrão · ' : ''}Cadastrada em {formatarData(receita.created_at)}
        </p>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-slate-400">
          {receita.tempo_preparo_min ? (
            <span className="flex items-center gap-0.5"><Clock size={11} /> {receita.tempo_preparo_min} min</span>
          ) : null}
          {receita.rendimento_porcoes ? (
            <span className="flex items-center gap-0.5"><Layers size={11} /> {receita.rendimento_porcoes} porç{Number(receita.rendimento_porcoes) === 1 ? 'ão' : 'ões'}</span>
          ) : null}
        </div>
        {receita.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {receita.tags.map((t) => (
              <span key={t} className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${corTag(t)}`}>{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Receitas({ userId }) {
  const [receitas, setReceitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [tagFiltro, setTagFiltro] = useState(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [receitaParaExcluir, setReceitaParaExcluir] = useState(null)

  const carregar = async () => {
    setLoading(true)
    const { data } = await supabase.from('receitas').select('*').order('nome')
    setReceitas(data || [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  const tagsDisponiveis = useMemo(() => [...new Set(receitas.flatMap((r) => r.tags || []))].sort(), [receitas])

  const receitasFiltradas = receitas.filter((r) => {
    if (busca.trim() && !r.nome.toLowerCase().includes(busca.trim().toLowerCase())) return false
    if (tagFiltro && !(r.tags || []).includes(tagFiltro)) return false
    return true
  })

  const confirmarExclusaoReceita = async () => {
    const receita = receitaParaExcluir
    setReceitaParaExcluir(null)
    if (receita.id_alimento_sincronizado) {
      const ok = await dessincronizarAlimentoReceita(receita.id_alimento_sincronizado, receita.nome)
      if (!ok) return
    }
    const { error } = await supabase.from('receitas').delete().eq('id', receita.id)
    if (error) { alert('Erro ao excluir receita: ' + error.message); return }
    setReceitas((prev) => prev.filter((r) => r.id !== receita.id))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">Receitas</h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">Cadastre receitas e habilite pra usar em qualquer Plano Alimentar.</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditando(null); setModalAberto(true) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700"
        >
          <Plus size={16} /> Nova receita
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Procurar receita..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {tagsDisponiveis.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTagFiltro((cur) => (cur === t ? null : t))}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${corTag(t)} ${tagFiltro === t ? 'ring-2 ring-primary-500' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-primary-600 font-semibold text-center py-10 animate-pulse">Carregando...</p>
      ) : receitasFiltradas.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-10">Nenhuma receita encontrada.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {receitasFiltradas.map((r) => (
            <CardReceita
              key={r.id}
              receita={r}
              podeEditar={r.id_avaliador === userId}
              onClick={() => { setEditando(r); setModalAberto(true) }}
              onExcluir={(id) => setReceitaParaExcluir(receitas.find((r) => r.id === id))}
            />
          ))}
        </div>
      )}

      {receitaParaExcluir && (
        <ConfirmModal
          titulo="Excluir receita"
          mensagem={`Excluir "${receitaParaExcluir.nome}"?`}
          detalhes={
            receitaParaExcluir.id_alimento_sincronizado
              ? 'Se essa receita já foi usada em algum plano alimentar de paciente, a exclusão será bloqueada automaticamente.'
              : undefined
          }
          onConfirmar={confirmarExclusaoReceita}
          onCancelar={() => setReceitaParaExcluir(null)}
        />
      )}

      {modalAberto && (
        <ModalReceita
          receita={editando}
          userId={userId}
          onFechar={() => setModalAberto(false)}
          onSalvo={() => { setModalAberto(false); carregar() }}
        />
      )}
    </div>
  )
}
