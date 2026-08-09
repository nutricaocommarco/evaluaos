import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from '../components/SidebarPaciente'
import EmConstrucao from '../components/EmConstrucao'

const CAMPOS_PLANO_VAZIOS = {
  titulo: 'Plano Alimentar',
  vet_target: '',
  proteina_target_g_kg: '',
  carbo_target_g_kg: '',
  lipidio_target_g_kg: '',
  proteina_target_pct: '',
  carbo_target_pct: '',
  lipidio_target_pct: '',
}

// Fatores de Atwater (kcal por grama) — padrão usado pela TACO/TBCA/IBGE.
const KCAL_POR_G = { proteina: 4, carbo: 4, lipidio: 9 }

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

function calcularMacrosItem(item) {
  const alimento = item.tabela_alimentos
  if (!alimento || item.ignorar_nos_calculos) return { kcal: 0, proteina: 0, carbo: 0, lipidio: 0 }
  const fator = (Number(item.quantidade_g) || 0) / 100
  return {
    kcal: (alimento.energia_kcal || 0) * fator,
    proteina: (alimento.proteina_g || 0) * fator,
    carbo: (alimento.carboidrato_g || 0) * fator,
    lipidio: (alimento.lipidios_g || 0) * fator,
  }
}

function somarMacros(lista) {
  return lista.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      proteina: acc.proteina + m.proteina,
      carbo: acc.carbo + m.carbo,
      lipidio: acc.lipidio + m.lipidio,
    }),
    { kcal: 0, proteina: 0, carbo: 0, lipidio: 0 }
  )
}

function fmt(n) {
  return Number.isFinite(n) ? n.toFixed(1).replace(/\.0$/, '') : '0'
}

// Busca de alimento com debounce + adiciona item a uma refeição/opção.
// Componente isolado pra cada instância ter seu próprio estado de busca.
function AdicionarItemForm({ refeicaoId, opcaoNumero, onItemAdicionado, onCancelar }) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selecionado, setSelecionado] = useState(null)
  const [quantidade, setQuantidade] = useState('')
  const [salvando, setSalvando] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (busca.trim().length < 2) { setResultados([]); return }
    const delay = setTimeout(async () => {
      const { data } = await supabase
        .from('tabela_alimentos')
        .select('*')
        .ilike('nome', `%${busca.trim()}%`)
        .order('nome')
        .limit(15)
      setResultados(data || [])
    }, 300)
    return () => clearTimeout(delay)
  }, [busca])

  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  const handleAdicionar = async () => {
    if (!selecionado || !quantidade || Number(quantidade) <= 0) return
    setSalvando(true)

    const { data, error } = await supabase
      .from('itens_refeicao')
      .insert({
        id_refeicao: refeicaoId,
        id_alimento: selecionado.id,
        quantidade_g: Number(quantidade),
        opcao_numero: opcaoNumero,
      })
      .select('*, tabela_alimentos(*)')
      .single()

    setSalvando(false)
    if (error) {
      alert('Erro ao adicionar item: ' + error.message)
      return
    }
    onItemAdicionado(data)
    setBusca('')
    setSelecionado(null)
    setQuantidade('')
  }

  return (
    <div className="flex flex-wrap items-end gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-200 dark:border-slate-700">
      <div className="relative flex-1 min-w-[180px]" ref={dropdownRef}>
        <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          Alimento
        </label>
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
              <li
                key={r.id}
                onClick={() => { setSelecionado(r); setShowDropdown(false) }}
                className="px-3 py-2 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 text-xs border-b border-gray-100 dark:border-slate-800 last:border-0"
              >
                <span className="font-semibold">{r.nome}</span>
                <span className="text-gray-400 dark:text-slate-500 ml-2">{r.energia_kcal ?? '-'} kcal/100g</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="w-24">
        <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          Qtd (g)
        </label>
        <input
          type="number"
          step="any"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <button
        type="button"
        onClick={handleAdicionar}
        disabled={!selecionado || !quantidade || salvando}
        className="px-3 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 shrink-0"
      >
        {salvando ? '...' : 'Adicionar'}
      </button>
      <button
        type="button"
        onClick={onCancelar}
        className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-700 shrink-0"
      >
        Cancelar
      </button>
    </div>
  )
}

function OpcaoCard({ refeicaoId, opcaoNumero, itens, onItemExcluido, onItemAdicionado, mostrarFormInicial, aoFecharForm, onDuplicar }) {
  const [mostrarForm, setMostrarForm] = useState(!!mostrarFormInicial)
  const macros = somarMacros(itens.map(calcularMacrosItem))

  const handleExcluirItem = async (itemId) => {
    if (!window.confirm('Remover este item da refeição?')) return
    const { error } = await supabase.from('itens_refeicao').delete().eq('id', itemId)
    if (error) { alert('Erro ao remover item: ' + error.message); return }
    onItemExcluido(itemId)
  }

  return (
    <div className="rounded-lg border border-gray-100 dark:border-slate-800 p-3 flex-1 min-w-[240px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black text-gray-700 dark:text-slate-300 uppercase tracking-wider">
          Opção {opcaoNumero}
        </span>
        <div className="flex items-center gap-2">
          {itens.length > 0 && onDuplicar && (
            <button
              onClick={onDuplicar}
              className="text-[11px] font-semibold text-primary-600 hover:underline"
              title="Duplicar esta opção em uma nova opção"
            >
              duplicar
            </button>
          )}
          <span className="text-[11px] text-gray-400 dark:text-slate-500">
            {fmt(macros.kcal)} kcal
          </span>
        </div>
      </div>

      {itens.length === 0 && !mostrarForm && (
        <p className="text-xs text-gray-400 dark:text-slate-500 mb-2">Sem itens ainda.</p>
      )}

      <ul className="space-y-1 mb-2">
        {itens.map((item) => {
          const m = calcularMacrosItem(item)
          return (
            <li key={item.id} className="flex items-center justify-between gap-2 text-xs text-gray-700 dark:text-slate-300">
              <span className="truncate">
                {item.tabela_alimentos?.nome || 'Alimento removido'} — {item.quantidade_g}g
                <span className="text-gray-400 dark:text-slate-500 ml-1">
                  ({fmt(m.kcal)}kcal · P{fmt(m.proteina)} · C{fmt(m.carbo)} · L{fmt(m.lipidio)})
                </span>
              </span>
              <button
                onClick={() => handleExcluirItem(item.id)}
                className="text-red-500 hover:underline shrink-0"
              >
                remover
              </button>
            </li>
          )
        })}
      </ul>

      {itens.length > 0 && (
        <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-2">
          P: {fmt(macros.proteina)}g · C: {fmt(macros.carbo)}g · L: {fmt(macros.lipidio)}g
        </p>
      )}

      {mostrarForm ? (
        <AdicionarItemForm
          refeicaoId={refeicaoId}
          opcaoNumero={opcaoNumero}
          onItemAdicionado={(item) => { onItemAdicionado(item); }}
          onCancelar={() => { setMostrarForm(false); aoFecharForm?.() }}
        />
      ) : (
        <button
          onClick={() => setMostrarForm(true)}
          className="text-xs font-semibold text-primary-600 hover:underline"
        >
          + Adicionar item
        </button>
      )}
    </div>
  )
}

function RefeicaoCard({ refeicao, onAtualizarCampo, onExcluir, onItensChange, onMover, podeSubir, podeDescer, onDuplicarRefeicao }) {
  const [novaOpcaoAberta, setNovaOpcaoAberta] = useState(false)

  const opcoesExistentes = [...new Set(refeicao.itens_refeicao.map((i) => i.opcao_numero))].sort((a, b) => a - b)
  const proximaOpcao = opcoesExistentes.length > 0 ? Math.max(...opcoesExistentes) + 1 : 1
  const opcoesParaExibir = opcoesExistentes.length > 0 ? opcoesExistentes : [1]

  const handleItemAdicionado = (item) => {
    onItensChange([...refeicao.itens_refeicao, item])
    if (item.opcao_numero === proximaOpcao) setNovaOpcaoAberta(false)
  }

  const handleItemExcluido = (itemId) => {
    onItensChange(refeicao.itens_refeicao.filter((i) => i.id !== itemId))
  }

  const handleDuplicarOpcao = async (opcaoOrigem) => {
    const itensOrigem = refeicao.itens_refeicao.filter((i) => i.opcao_numero === opcaoOrigem)
    if (itensOrigem.length === 0) return

    const novaOpcao = Math.max(...refeicao.itens_refeicao.map((i) => i.opcao_numero)) + 1
    const inserts = itensOrigem.map((i) => ({
      id_refeicao: refeicao.id,
      id_alimento: i.id_alimento,
      quantidade_g: i.quantidade_g,
      opcao_numero: novaOpcao,
    }))

    const { data, error } = await supabase.from('itens_refeicao').insert(inserts).select('*, tabela_alimentos(*)')
    if (error) { alert('Erro ao duplicar opção: ' + error.message); return }
    onItensChange([...refeicao.itens_refeicao, ...data])
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-1 min-w-[200px]">
          <div className="flex flex-col shrink-0">
            <button
              onClick={() => onMover('cima')}
              disabled={!podeSubir}
              title="Mover refeição pra cima"
              className="text-gray-300 dark:text-slate-600 hover:text-primary-600 disabled:opacity-30 disabled:hover:text-gray-300 leading-none text-xs px-1"
            >
              ▲
            </button>
            <button
              onClick={() => onMover('baixo')}
              disabled={!podeDescer}
              title="Mover refeição pra baixo"
              className="text-gray-300 dark:text-slate-600 hover:text-primary-600 disabled:opacity-30 disabled:hover:text-gray-300 leading-none text-xs px-1"
            >
              ▼
            </button>
          </div>
          <input
            type="time"
            value={refeicao.horario || ''}
            onChange={(e) => onAtualizarCampo(refeicao.id, 'horario', e.target.value || null)}
            className="px-2 py-1 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 rounded text-sm bg-transparent focus:border-primary-500 outline-none text-gray-500 dark:text-slate-400"
          />
          <input
            type="text"
            value={refeicao.nome_refeicao}
            onChange={(e) => onAtualizarCampo(refeicao.id, 'nome_refeicao', e.target.value)}
            className="flex-1 px-2 py-1 border border-transparent hover:border-gray-200 dark:hover:border-slate-700 rounded text-sm font-black bg-transparent focus:border-primary-500 outline-none text-gray-800 dark:text-slate-100"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onDuplicarRefeicao(refeicao)}
            className="text-xs font-semibold text-primary-600 hover:underline"
          >
            Duplicar refeição
          </button>
          <button
            onClick={() => onExcluir(refeicao.id)}
            className="text-xs font-semibold text-red-600 hover:underline"
          >
            Excluir refeição
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {opcoesParaExibir.map((n) => (
          <OpcaoCard
            key={n}
            refeicaoId={refeicao.id}
            opcaoNumero={n}
            itens={refeicao.itens_refeicao.filter((i) => i.opcao_numero === n)}
            onItemAdicionado={handleItemAdicionado}
            onItemExcluido={handleItemExcluido}
            onDuplicar={() => handleDuplicarOpcao(n)}
          />
        ))}

        {novaOpcaoAberta && (
          <OpcaoCard
            refeicaoId={refeicao.id}
            opcaoNumero={proximaOpcao}
            itens={[]}
            onItemAdicionado={handleItemAdicionado}
            onItemExcluido={handleItemExcluido}
            mostrarFormInicial
            aoFecharForm={() => setNovaOpcaoAberta(false)}
          />
        )}
      </div>

      {!novaOpcaoAberta && (
        <button
          onClick={() => setNovaOpcaoAberta(true)}
          className="text-xs font-semibold text-primary-600 hover:underline"
        >
          + Nova Opção (substituição)
        </button>
      )}
    </div>
  )
}

export default function PlanoAlimentar({ userId }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [itemAtivo, setItemAtivo] = useState('planos')
  const [planos, setPlanos] = useState([])
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState(null)
  const [refeicoes, setRefeicoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [carregandoRefeicoes, setCarregandoRefeicoes] = useState(false)

  const [pesoAtual, setPesoAtual] = useState(null)
  const [vetSugerido, setVetSugerido] = useState(null)
  const [idAvaliacaoRecente, setIdAvaliacaoRecente] = useState(null)

  const [showModalNovoPlano, setShowModalNovoPlano] = useState(false)
  const [editingPlanoId, setEditingPlanoId] = useState(null)
  const [formPlano, setFormPlano] = useState(CAMPOS_PLANO_VAZIOS)
  const [salvandoPlano, setSalvandoPlano] = useState(false)
  const [pesoOverride, setPesoOverride] = useState('')
  const [modoMeta, setModoMeta] = useState('g_kg') // 'g_kg' | 'percentual'

  const pesoParaConversao = pesoOverride !== '' ? Number(pesoOverride) : (pesoAtual ? Number(pesoAtual) : null)

  const carregarPaciente = async () => {
    const { data } = await supabase.from('pacientes').select('*').eq('id', id).maybeSingle()
    setPaciente(data || null)
  }

  const carregarPlanos = async () => {
    const { data } = await supabase
      .from('planos_alimentares')
      .select('*')
      .eq('id_paciente', id)
      .order('created_at', { ascending: false })
    setPlanos(data || [])
    return data || []
  }

  const carregarDadosRecentes = async () => {
    const { data: aval } = await supabase
      .from('avaliacoes')
      .select('id, peso_paciente')
      .eq('id_paciente', id)
      .order('data_avaliacao', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (aval) {
      setPesoAtual(aval.peso_paciente || null)
      setIdAvaliacaoRecente(aval.id)

      const { data: calc } = await supabase
        .from('dados_calculados')
        .select('gasto_energetico_total, calorias_fase_mudanca')
        .eq('id_avaliacao', aval.id)
        .maybeSingle()

      if (calc) setVetSugerido(calc.calorias_fase_mudanca ?? calc.gasto_energetico_total ?? null)
    }
  }

  const carregarRefeicoes = async (planoId) => {
    if (!planoId) { setRefeicoes([]); return }
    setCarregandoRefeicoes(true)
    const { data, error } = await supabase
      .from('refeicoes_prescritas')
      .select('*, itens_refeicao(*, tabela_alimentos(*))')
      .eq('id_plano', planoId)
      .order('ordem')

    if (!error) setRefeicoes(data || [])
    setCarregandoRefeicoes(false)
  }

  useEffect(() => {
    const iniciar = async () => {
      setLoading(true)
      await carregarPaciente()
      const listaPlanos = await carregarPlanos()
      await carregarDadosRecentes()

      const ativo = listaPlanos.find((p) => p.ativo) || listaPlanos[0]
      if (ativo) setPlanoSelecionadoId(ativo.id)

      setLoading(false)
    }
    iniciar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    carregarRefeicoes(planoSelecionadoId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planoSelecionadoId])

  const abrirNovoPlano = () => {
    setEditingPlanoId(null)
    setModoMeta('g_kg')
    setFormPlano({
      ...CAMPOS_PLANO_VAZIOS,
      vet_target: vetSugerido ? String(Math.round(vetSugerido)) : '',
    })
    setShowModalNovoPlano(true)
  }

  const abrirEditarMetas = (plano) => {
    setEditingPlanoId(plano.id)
    const usaPercentual = plano.proteina_target_pct != null || plano.carbo_target_pct != null || plano.lipidio_target_pct != null
    setModoMeta(usaPercentual ? 'percentual' : 'g_kg')
    setFormPlano({
      titulo: plano.titulo || 'Plano Alimentar',
      vet_target: plano.vet_target ?? '',
      proteina_target_g_kg: plano.proteina_target_g_kg ?? '',
      carbo_target_g_kg: plano.carbo_target_g_kg ?? '',
      lipidio_target_g_kg: plano.lipidio_target_g_kg ?? '',
      proteina_target_pct: plano.proteina_target_pct ?? '',
      carbo_target_pct: plano.carbo_target_pct ?? '',
      lipidio_target_pct: plano.lipidio_target_pct ?? '',
    })
    setShowModalNovoPlano(true)
  }

  const handleImportarVet = () => {
    if (!vetSugerido) return
    setFormPlano((prev) => ({ ...prev, vet_target: String(Math.round(vetSugerido)) }))
  }

  // Modo g/kg: o VET recalcula sozinho a partir dos 3 macros × peso × fator
  // de Atwater (4/4/9 kcal por g) toda vez que um macro muda.
  const handleChangeMacroGKg = (campo, valor) => {
    setFormPlano((prev) => {
      const proximo = { ...prev, [campo]: valor }
      if (pesoParaConversao) {
        const p = Number(proximo.proteina_target_g_kg) || 0
        const c = Number(proximo.carbo_target_g_kg) || 0
        const l = Number(proximo.lipidio_target_g_kg) || 0
        const vetCalculado = pesoParaConversao * (p * KCAL_POR_G.proteina + c * KCAL_POR_G.carbo + l * KCAL_POR_G.lipidio)
        proximo.vet_target = vetCalculado > 0 ? String(Math.round(vetCalculado)) : ''
      }
      return proximo
    })
  }

  const handleChangeMacroPct = (campo, valor) => {
    setFormPlano((prev) => ({ ...prev, [campo]: valor }))
  }

  // Gramas equivalentes a um percentual do VET, pro texto de ajuda no modo %.
  const gramasDoPercentual = (pct, macro) => {
    const vet = Number(formPlano.vet_target)
    const p = Number(pct)
    if (!vet || !p) return null
    return (vet * (p / 100)) / KCAL_POR_G[macro]
  }

  const handleSalvarPlano = async (e) => {
    e.preventDefault()
    setSalvandoPlano(true)

    const numerico = (v) => (v === '' ? null : Number(v))
    const vet = numerico(formPlano.vet_target)

    let payload
    if (modoMeta === 'percentual') {
      const pctP = numerico(formPlano.proteina_target_pct)
      const pctC = numerico(formPlano.carbo_target_pct)
      const pctL = numerico(formPlano.lipidio_target_pct)
      const gKg = (pct, fator) =>
        pct != null && vet && pesoParaConversao
          ? (vet * (pct / 100) / fator) / pesoParaConversao
          : null

      payload = {
        titulo: formPlano.titulo || 'Plano Alimentar',
        vet_target: vet,
        proteina_target_pct: pctP,
        carbo_target_pct: pctC,
        lipidio_target_pct: pctL,
        proteina_target_g_kg: gKg(pctP, KCAL_POR_G.proteina),
        carbo_target_g_kg: gKg(pctC, KCAL_POR_G.carbo),
        lipidio_target_g_kg: gKg(pctL, KCAL_POR_G.lipidio),
      }
    } else {
      payload = {
        titulo: formPlano.titulo || 'Plano Alimentar',
        vet_target: vet,
        proteina_target_g_kg: numerico(formPlano.proteina_target_g_kg),
        carbo_target_g_kg: numerico(formPlano.carbo_target_g_kg),
        lipidio_target_g_kg: numerico(formPlano.lipidio_target_g_kg),
        proteina_target_pct: null,
        carbo_target_pct: null,
        lipidio_target_pct: null,
      }
    }

    if (editingPlanoId) {
      const { error } = await supabase.from('planos_alimentares').update(payload).eq('id', editingPlanoId)
      setSalvandoPlano(false)
      if (error) { alert('Erro ao atualizar metas: ' + error.message); return }
      setShowModalNovoPlano(false)
      await carregarPlanos()
      return
    }

    await supabase.from('planos_alimentares').update({ ativo: false }).eq('id_paciente', id).eq('ativo', true)

    const { data, error } = await supabase
      .from('planos_alimentares')
      .insert({
        id_paciente: id,
        id_avaliador: userId,
        id_avaliacao: idAvaliacaoRecente || null,
        ...payload,
        ativo: true,
      })
      .select()
      .single()

    setSalvandoPlano(false)
    if (error) {
      alert('Erro ao criar plano: ' + error.message)
      return
    }

    setShowModalNovoPlano(false)
    await carregarPlanos()
    setPlanoSelecionadoId(data.id)
  }

  const handleExcluirPlano = async () => {
    const alvo = planos.find((p) => p.id === planoSelecionadoId)
    if (!alvo) return
    if (!window.confirm(`Excluir o plano "${alvo.titulo}"? Isso apaga também as refeições e itens dele — não pode ser desfeito.`)) return

    const { error } = await supabase.from('planos_alimentares').delete().eq('id', alvo.id)
    if (error) { alert('Erro ao excluir plano: ' + error.message); return }

    const restantes = planos.filter((p) => p.id !== alvo.id)
    setPlanos(restantes)
    const proximo = restantes.find((p) => p.ativo) || restantes[0] || null
    setPlanoSelecionadoId(proximo ? proximo.id : null)
  }

  const handleNovaRefeicao = async () => {
    const { data, error } = await supabase
      .from('refeicoes_prescritas')
      .insert({
        id_plano: planoSelecionadoId,
        nome_refeicao: 'Nova Refeição',
        ordem: refeicoes.length,
      })
      .select('*, itens_refeicao(*, tabela_alimentos(*))')
      .single()

    if (error) { alert('Erro ao criar refeição: ' + error.message); return }
    setRefeicoes((prev) => [...prev, data])
  }

  const handleDuplicarRefeicao = async (refeicao) => {
    const { data: novaRefeicao, error: erroRefeicao } = await supabase
      .from('refeicoes_prescritas')
      .insert({
        id_plano: planoSelecionadoId,
        nome_refeicao: `${refeicao.nome_refeicao} (cópia)`,
        horario: refeicao.horario,
        ordem: refeicoes.length,
      })
      .select('*, itens_refeicao(*, tabela_alimentos(*))')
      .single()

    if (erroRefeicao) { alert('Erro ao duplicar refeição: ' + erroRefeicao.message); return }

    if (refeicao.itens_refeicao.length > 0) {
      const inserts = refeicao.itens_refeicao.map((i) => ({
        id_refeicao: novaRefeicao.id,
        id_alimento: i.id_alimento,
        quantidade_g: i.quantidade_g,
        opcao_numero: i.opcao_numero,
      }))
      const { data: novosItens, error: erroItens } = await supabase
        .from('itens_refeicao')
        .insert(inserts)
        .select('*, tabela_alimentos(*)')

      if (erroItens) {
        alert('Refeição duplicada, mas houve erro ao copiar os itens: ' + erroItens.message)
      } else {
        novaRefeicao.itens_refeicao = novosItens || []
      }
    }

    setRefeicoes((prev) => [...prev, novaRefeicao])
  }

  const handleExcluirRefeicao = async (refeicaoId) => {
    if (!window.confirm('Excluir esta refeição e todos os itens dela?')) return
    const { error } = await supabase.from('refeicoes_prescritas').delete().eq('id', refeicaoId)
    if (error) { alert('Erro ao excluir refeição: ' + error.message); return }
    setRefeicoes((prev) => prev.filter((r) => r.id !== refeicaoId))
  }

  const handleAtualizarCampoRefeicao = async (refeicaoId, campo, valor) => {
    setRefeicoes((prev) => prev.map((r) => (r.id === refeicaoId ? { ...r, [campo]: valor } : r)))
    await supabase.from('refeicoes_prescritas').update({ [campo]: valor }).eq('id', refeicaoId)
  }

  const handleItensChange = (refeicaoId, novosItens) => {
    setRefeicoes((prev) => prev.map((r) => (r.id === refeicaoId ? { ...r, itens_refeicao: novosItens } : r)))
  }

  const handleMoverRefeicao = async (refeicaoId, direcao) => {
    const ordenadas = [...refeicoes].sort((a, b) => a.ordem - b.ordem)
    const idx = ordenadas.findIndex((r) => r.id === refeicaoId)
    const alvoIdx = direcao === 'cima' ? idx - 1 : idx + 1
    if (alvoIdx < 0 || alvoIdx >= ordenadas.length) return

    const atual = ordenadas[idx]
    const alvo = ordenadas[alvoIdx]

    setRefeicoes((prev) => {
      const atualizadas = prev.map((r) => {
        if (r.id === atual.id) return { ...r, ordem: alvo.ordem }
        if (r.id === alvo.id) return { ...r, ordem: atual.ordem }
        return r
      })
      return atualizadas.sort((a, b) => a.ordem - b.ordem)
    })

    await supabase.from('refeicoes_prescritas').update({ ordem: alvo.ordem }).eq('id', atual.id)
    await supabase.from('refeicoes_prescritas').update({ ordem: atual.ordem }).eq('id', alvo.id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-primary-600 font-bold animate-pulse">Carregando plano alimentar...</p>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
        <p className="text-gray-600 dark:text-slate-300 font-semibold">Paciente não encontrado.</p>
        <button onClick={() => navigate('/pacientes')} className="text-primary-600 font-semibold text-sm hover:underline">
          ← Voltar para Pacientes
        </button>
      </div>
    )
  }

  const planoSelecionado = planos.find((p) => p.id === planoSelecionadoId)

  const totalDia = somarMacros(
    refeicoes.flatMap((r) => r.itens_refeicao.filter((i) => i.opcao_numero === 1).map(calcularMacrosItem))
  )

  const metaProteinaG = planoSelecionado?.proteina_target_g_kg && pesoParaConversao
    ? planoSelecionado.proteina_target_g_kg * pesoParaConversao
    : null
  const metaCarboG = planoSelecionado?.carbo_target_g_kg && pesoParaConversao
    ? planoSelecionado.carbo_target_g_kg * pesoParaConversao
    : null
  const metaLipidioG = planoSelecionado?.lipidio_target_g_kg && pesoParaConversao
    ? planoSelecionado.lipidio_target_g_kg * pesoParaConversao
    : null

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
      <SidebarPaciente paciente={paciente} itemAtivo={itemAtivo} onSelecionarItem={setItemAtivo} />

      <div className="flex-1 min-w-0 space-y-4">
        {itemAtivo !== 'planos' ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm min-h-[400px]">
            <EmConstrucao />
          </div>
        ) : (
        <>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Plano Alimentar — {paciente.nome_completo}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Prescrição de refeições e itens com cálculo de macros</p>
          </div>
          <button
            onClick={abrirNovoPlano}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors shrink-0"
          >
            + Novo Plano
          </button>
        </div>

        {planos.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhum plano alimentar criado ainda.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {planos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlanoSelecionadoId(p.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    planoSelecionadoId === p.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {p.titulo} · {formatarData(p.created_at)}
                  {p.ativo && (
                    <span className="ml-2 text-[10px] font-black uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                      Ativo
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {planoSelecionado && (
          <>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Meta vs. Calculado (Opção 1 de cada refeição)
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => abrirEditarMetas(planoSelecionado)}
                    className="text-xs font-semibold text-primary-600 hover:underline"
                  >
                    Editar metas
                  </button>
                  <button
                    onClick={handleExcluirPlano}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Excluir plano
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <label className="text-xs text-gray-500 dark:text-slate-400">Peso considerado (kg):</label>
                <input
                  type="number"
                  step="any"
                  value={pesoOverride}
                  onChange={(e) => setPesoOverride(e.target.value)}
                  placeholder={pesoAtual ? String(pesoAtual) : '-'}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-xs outline-none focus:ring-2 focus:ring-primary-500"
                />
                {pesoAtual && (
                  <span className="text-[11px] text-gray-400 dark:text-slate-500">
                    (última avaliação: {pesoAtual}kg)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 dark:text-slate-500 text-xs">Calorias</p>
                  <p className="font-black text-gray-800 dark:text-slate-100">
                    {fmt(totalDia.kcal)} {planoSelecionado.vet_target ? `/ ${planoSelecionado.vet_target}` : ''} kcal
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-slate-500 text-xs">Proteína</p>
                  <p className="font-black text-gray-800 dark:text-slate-100">
                    {fmt(totalDia.proteina)} {metaProteinaG ? `/ ${fmt(metaProteinaG)}` : ''} g
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-slate-500 text-xs">Carboidrato</p>
                  <p className="font-black text-gray-800 dark:text-slate-100">
                    {fmt(totalDia.carbo)} {metaCarboG ? `/ ${fmt(metaCarboG)}` : ''} g
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-slate-500 text-xs">Lipídio</p>
                  <p className="font-black text-gray-800 dark:text-slate-100">
                    {fmt(totalDia.lipidio)} {metaLipidioG ? `/ ${fmt(metaLipidioG)}` : ''} g
                  </p>
                </div>
              </div>
              {!pesoParaConversao && (planoSelecionado.proteina_target_g_kg || planoSelecionado.carbo_target_g_kg || planoSelecionado.lipidio_target_g_kg) && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">
                  Sem peso de avaliação recente pra converter metas g/kg em gramas.
                </p>
              )}
            </div>

            {carregandoRefeicoes ? (
              <p className="text-sm text-primary-600 font-semibold text-center py-6 animate-pulse">Carregando refeições...</p>
            ) : (
              <div className="space-y-3">
                {refeicoes.map((refeicao, index) => (
                  <RefeicaoCard
                    key={refeicao.id}
                    refeicao={refeicao}
                    onAtualizarCampo={handleAtualizarCampoRefeicao}
                    onExcluir={handleExcluirRefeicao}
                    onDuplicarRefeicao={handleDuplicarRefeicao}
                    onItensChange={(novosItens) => handleItensChange(refeicao.id, novosItens)}
                    onMover={(direcao) => handleMoverRefeicao(refeicao.id, direcao)}
                    podeSubir={index > 0}
                    podeDescer={index < refeicoes.length - 1}
                  />
                ))}

                <button
                  onClick={handleNovaRefeicao}
                  className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-500 dark:text-slate-400 hover:border-primary-400 hover:text-primary-600 transition-colors"
                >
                  + Nova Refeição
                </button>
              </div>
            )}

            <p className="text-[11px] text-gray-400 dark:text-slate-500 text-center">
              O total do dia soma só a Opção 1 de cada refeição — as demais opções são alternativas de substituição.
            </p>
          </>
        )}
        </>
        )}
      </div>

      {showModalNovoPlano && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                {editingPlanoId ? 'Editar Metas do Plano' : 'Novo Plano Alimentar'}
              </h3>
              <button onClick={() => setShowModalNovoPlano(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSalvarPlano} className="p-6 space-y-4 overflow-y-auto flex-1">
              {!editingPlanoId && planos.some((p) => p.ativo) && (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                  Já existe um plano ativo — ele será marcado como inativo (mas continua no histórico) quando este for criado.
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={formPlano.titulo}
                  onChange={(e) => setFormPlano({ ...formPlano, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setModoMeta('g_kg')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${modoMeta === 'g_kg' ? 'bg-white dark:bg-slate-900 text-primary-600 shadow' : 'text-gray-500 dark:text-slate-400'}`}
                >
                  Gramas por kg
                </button>
                <button
                  type="button"
                  onClick={() => setModoMeta('percentual')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${modoMeta === 'percentual' ? 'bg-white dark:bg-slate-900 text-primary-600 shadow' : 'text-gray-500 dark:text-slate-400'}`}
                >
                  Percentual do VET
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                    Meta Calórica — VET (kcal)
                    {modoMeta === 'g_kg' && (
                      <span className="text-primary-600 normal-case font-normal ml-1">(calculado a partir dos macros)</span>
                    )}
                  </label>
                  {vetSugerido && (
                    <button
                      type="button"
                      onClick={handleImportarVet}
                      className="text-[11px] font-semibold text-primary-600 hover:underline"
                    >
                      Importar do Planejamento Calórico
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="any"
                  value={formPlano.vet_target}
                  onChange={(e) => setFormPlano({ ...formPlano, vet_target: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {modoMeta === 'g_kg' ? (
                <>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider pt-1">
                    Metas de macro (g por kg de peso corporal)
                    {!pesoParaConversao && <span className="text-amber-600 normal-case font-normal ml-1">— sem peso, VET não calcula sozinho</span>}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Proteína
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formPlano.proteina_target_g_kg}
                        onChange={(e) => handleChangeMacroGKg('proteina_target_g_kg', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Carbo
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formPlano.carbo_target_g_kg}
                        onChange={(e) => handleChangeMacroGKg('carbo_target_g_kg', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Lipídio
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formPlano.lipidio_target_g_kg}
                        onChange={(e) => handleChangeMacroGKg('lipidio_target_g_kg', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider pt-1">
                    Metas de macro (% do VET)
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { campo: 'proteina_target_pct', macro: 'proteina', label: 'Proteína' },
                      { campo: 'carbo_target_pct', macro: 'carbo', label: 'Carbo' },
                      { campo: 'lipidio_target_pct', macro: 'lipidio', label: 'Lipídio' },
                    ].map(({ campo, macro, label }) => {
                      const gramas = gramasDoPercentual(formPlano[campo], macro)
                      return (
                        <div key={campo}>
                          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                            {label}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={formPlano[campo]}
                            onChange={(e) => handleChangeMacroPct(campo, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
                            {gramas !== null ? `≈ ${gramas.toFixed(0)}g${pesoParaConversao ? ` (${(gramas / pesoParaConversao).toFixed(2)} g/kg)` : ''}` : '—'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                  {(() => {
                    const total = ['proteina_target_pct', 'carbo_target_pct', 'lipidio_target_pct']
                      .reduce((acc, c) => acc + (Number(formPlano[c]) || 0), 0)
                    return total > 0 && Math.abs(total - 100) > 0.5 ? (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        Os percentuais somam {total.toFixed(0)}%, não 100%.
                      </p>
                    ) : null
                  })()}
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalNovoPlano(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoPlano}
                  className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
                >
                  {salvandoPlano ? 'Salvando...' : editingPlanoId ? 'Salvar Metas' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
