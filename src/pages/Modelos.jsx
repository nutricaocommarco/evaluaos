import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { ChevronDown, ChevronRight, UtensilsCrossed, ClipboardList, FileText, Stethoscope, ListChecks, Layers, ArrowUp, ArrowDown, Trash2 } from 'lucide-react'
import { aplicarBuscaPorPalavras } from '../utils/buscaAlimentos'
import ConfirmModal from '../components/ConfirmModal'

function formatarDataHora(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleString('pt-BR')
}

// Uma linha de modelo, com renomear inline (clique no título) e excluir. O
// conteúdo expandido é livre (children), já que cada tipo de modelo mostra
// algo diferente (itens de refeição, refeições de um plano, texto livre...).
function LinhaModelo({ modelo, aberto, onToggle, onRenomear, onExcluir, resumo, children }) {
  const [renomeando, setRenomeando] = useState(false)
  const [novoTitulo, setNovoTitulo] = useState(modelo.titulo)

  const salvarRenomear = () => {
    const valor = novoTitulo.trim()
    setRenomeando(false)
    if (!valor || valor === modelo.titulo) { setNovoTitulo(modelo.titulo); return }
    onRenomear(modelo.id, valor)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center gap-3 p-4">
        {renomeando ? (
          <input
            autoFocus
            type="text"
            value={novoTitulo}
            onChange={(e) => setNovoTitulo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') { setNovoTitulo(modelo.titulo); setRenomeando(false) } }}
            onBlur={salvarRenomear}
            className="flex-1 px-2 py-1 border border-primary-300 rounded text-sm font-black outline-none focus:ring-2 focus:ring-primary-500"
          />
        ) : (
          <button type="button" onClick={onToggle} className="flex-1 flex items-center gap-2 text-left min-w-0">
            {aberto ? (
              <ChevronDown size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
            ) : (
              <ChevronRight size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="text-sm font-black text-gray-800 dark:text-slate-100 truncate block">{modelo.titulo}</span>
              <p className="text-[10px] text-gray-400 dark:text-slate-500">
                Criado em {formatarDataHora(modelo.created_at)}{resumo ? ` · ${resumo}` : ''}
              </p>
            </div>
          </button>
        )}
        <div className="flex gap-3 shrink-0">
          {onRenomear && (
            <button
              onClick={() => setRenomeando(true)}
              className="text-xs font-semibold text-primary-600 hover:underline"
            >
              Renomear
            </button>
          )}
          {onExcluir && (
            <button
              onClick={() => onExcluir(modelo.id)}
              className="text-xs font-semibold text-red-600 hover:underline"
            >
              Excluir
            </button>
          )}
        </div>
      </div>
      {aberto && !renomeando && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function labelQuantidade(item) {
  if (item.unidade_medida === 'a_vontade') return 'à vontade'
  if (item.unidade_medida && item.quantidade_medida) return `${item.quantidade_medida} ${item.unidade_medida} (≈${item.quantidade_g}g)`
  return `${item.quantidade_g}g`
}

function Secao({ titulo, icone: Icone, cor, itens, carregando, vazio, headerExtra, children }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-slate-800">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cor}`}>
          <Icone size={18} />
        </div>
        <h3 className="text-base font-bold text-gray-800 dark:text-slate-100">{titulo}</h3>
        <span className="text-xs text-gray-400 dark:text-slate-500 ml-auto">{itens.length}</span>
        {headerExtra}
      </div>
      {carregando ? (
        <p className="text-sm text-primary-600 font-semibold text-center py-6 animate-pulse">Carregando...</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-6 px-4">{vazio}</p>
      ) : (
        <div className="p-4 space-y-3">{children}</div>
      )}
    </div>
  )
}

function fmtKcal(n) {
  return Number.isFinite(n) ? n.toFixed(0) : '0'
}

function calcularKcalItemGrupo(item) {
  const alimento = item.tabela_alimentos
  if (!alimento) return 0
  return ((alimento.energia_kcal || 0) * (Number(item.quantidade_g) || 0)) / 100
}

// Form de criação de um grupo novo — fica no header da Seção (headerExtra),
// já que, diferente dos outros 5 tipos de modelo, um Grupo de Alimentos não
// é a cópia de algo que já existe em Plano Alimentar/Anamnese/etc.: não tem
// "tela de origem" pra nascer, então precisa de criação própria aqui.
function NovoGrupoForm({ onCriado }) {
  const [aberto, setAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [kcalAlvo, setKcalAlvo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const handleCriar = async () => {
    if (!titulo.trim()) return
    setSalvando(true)
    const { data: authData } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('grupos_alimentos_modelo')
      .insert({
        id_avaliador: authData.user.id,
        titulo: titulo.trim(),
        kcal_alvo: kcalAlvo === '' ? null : Number(kcalAlvo),
      })
      .select()
      .single()
    setSalvando(false)
    if (error) { alert('Erro ao criar grupo: ' + error.message); return }
    onCriado({ ...data, grupos_alimentos_modelo_itens: [] })
    setTitulo('')
    setKcalAlvo('')
    setAberto(false)
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setAberto(true) }}
        className="ml-3 text-xs font-semibold text-primary-600 hover:underline shrink-0"
      >
        + Novo grupo
      </button>
    )
  }

  return (
    <div className="ml-3 flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleCriar(); if (e.key === 'Escape') setAberto(false) }}
        placeholder="Nome do grupo"
        className="px-2 py-1 border border-gray-300 rounded text-xs outline-none focus:ring-2 focus:ring-primary-500 w-40"
      />
      <input
        type="number"
        step="any"
        value={kcalAlvo}
        onChange={(e) => setKcalAlvo(e.target.value)}
        placeholder="kcal alvo"
        className="px-2 py-1 border border-gray-300 rounded text-xs outline-none focus:ring-2 focus:ring-primary-500 w-20"
      />
      <button
        type="button"
        onClick={handleCriar}
        disabled={!titulo.trim() || salvando}
        className="text-xs font-semibold text-primary-600 hover:underline disabled:opacity-50"
      >
        {salvando ? '...' : 'Criar'}
      </button>
      <button
        type="button"
        onClick={() => { setAberto(false); setTitulo(''); setKcalAlvo('') }}
        className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-700"
      >
        Cancelar
      </button>
    </div>
  )
}

// Busca alimento + gramas (sugeridos automaticamente a partir do kcal_alvo
// do grupo, mesma fórmula da "equivalência automática" de substitutos em
// PlanoAlimentar.jsx) + medida caseira em texto livre.
function AdicionarAlimentoGrupoForm({ grupo, ordemProxima, onItemAdicionado, onCancelar }) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selecionado, setSelecionado] = useState(null)
  const [quantidade, setQuantidade] = useState('')
  const [descricaoPorcao, setDescricaoPorcao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (busca.trim().length < 2) { setResultados([]); return }
    const delay = setTimeout(async () => {
      const { data } = await aplicarBuscaPorPalavras(supabase.from('tabela_alimentos').select('*'), 'nome', busca.trim())
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

  const handleSelecionar = (alimento) => {
    setSelecionado(alimento)
    setShowDropdown(false)
    if (grupo.kcal_alvo && alimento.energia_kcal) {
      const sugestao = Math.max(5, Math.floor(((Number(grupo.kcal_alvo) * 100) / alimento.energia_kcal) / 5) * 5)
      setQuantidade(String(sugestao))
    }
  }

  const handleAdicionar = async () => {
    if (!selecionado || !quantidade || Number(quantidade) <= 0) return
    setSalvando(true)
    const { data, error } = await supabase
      .from('grupos_alimentos_modelo_itens')
      .insert({
        id_grupo: grupo.id,
        id_alimento: selecionado.id,
        quantidade_g: Number(quantidade),
        descricao_porcao: descricaoPorcao.trim() || null,
        ordem: ordemProxima,
      })
      .select('*, tabela_alimentos(nome, energia_kcal)')
      .single()
    setSalvando(false)
    if (error) { alert('Erro ao adicionar alimento: ' + error.message); return }
    onItemAdicionado(data)
    setBusca('')
    setSelecionado(null)
    setQuantidade('')
    setDescricaoPorcao('')
  }

  return (
    <div className="flex flex-wrap items-end gap-2 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-200 dark:border-slate-700">
      <div className="relative flex-1 min-w-[160px]" ref={dropdownRef}>
        <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Alimento</label>
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
                onClick={() => handleSelecionar(r)}
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
        <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Qtd (g)</label>
        <input
          type="number"
          step="any"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <div className="w-44">
        <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Medida caseira (opcional)</label>
        <input
          type="text"
          value={descricaoPorcao}
          onChange={(e) => setDescricaoPorcao(e.target.value)}
          placeholder="ex: 5 colheres de sopa"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <button
        type="button"
        onClick={handleAdicionar}
        disabled={!selecionado || !quantidade || Number(quantidade) <= 0 || salvando}
        className="px-3 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 shrink-0"
      >
        {salvando ? '...' : 'Adicionar'}
      </button>
      <button type="button" onClick={onCancelar} className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-700 shrink-0">
        Cancelar
      </button>
      {grupo.kcal_alvo ? (
        <p className="w-full text-[10px] text-gray-400 dark:text-slate-500">
          Gramas sugeridos automaticamente pra bater ~{grupo.kcal_alvo}kcal (o alvo do grupo) — ajuste se quiser.
        </p>
      ) : null}
    </div>
  )
}

// Conteúdo expandido de um Grupo de Alimentos: lista de alimentos
// intercambiáveis (reordenar ▲▼, excluir), kcal alvo editável, e form pra
// adicionar mais um alimento ao grupo.
function GrupoItensEditor({ grupo, onAtualizarGrupo, podeEditar }) {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [itemParaExcluir, setItemParaExcluir] = useState(null)
  const itens = [...(grupo.grupos_alimentos_modelo_itens || [])].sort((a, b) => a.ordem - b.ordem)

  const handleItemAdicionado = (novoItem) => {
    onAtualizarGrupo({ ...grupo, grupos_alimentos_modelo_itens: [...itens, novoItem] })
    setMostrarForm(false)
  }

  const confirmarExclusaoItem = async () => {
    const itemId = itemParaExcluir.id
    setItemParaExcluir(null)
    const { error } = await supabase.from('grupos_alimentos_modelo_itens').delete().eq('id', itemId)
    if (error) { alert('Erro ao remover: ' + error.message); return }
    onAtualizarGrupo({ ...grupo, grupos_alimentos_modelo_itens: itens.filter((i) => i.id !== itemId) })
  }

  const handleMover = async (index, direcao) => {
    const alvo = index + direcao
    if (alvo < 0 || alvo >= itens.length) return
    const a = itens[index]
    const b = itens[alvo]
    const novosItens = [...itens]
    novosItens[index] = { ...b, ordem: a.ordem }
    novosItens[alvo] = { ...a, ordem: b.ordem }
    onAtualizarGrupo({ ...grupo, grupos_alimentos_modelo_itens: novosItens })
    await Promise.all([
      supabase.from('grupos_alimentos_modelo_itens').update({ ordem: b.ordem }).eq('id', a.id),
      supabase.from('grupos_alimentos_modelo_itens').update({ ordem: a.ordem }).eq('id', b.id),
    ])
  }

  const handleKcalAlvoBlur = async (valor) => {
    const num = valor === '' ? null : Number(valor)
    if (num === grupo.kcal_alvo) return
    onAtualizarGrupo({ ...grupo, kcal_alvo: num })
    await supabase.from('grupos_alimentos_modelo').update({ kcal_alvo: num }).eq('id', grupo.id)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Kcal alvo</span>
        {podeEditar ? (
          <input
            type="number"
            step="any"
            defaultValue={grupo.kcal_alvo ?? ''}
            onBlur={(e) => handleKcalAlvoBlur(e.target.value)}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-xs outline-none focus:ring-2 focus:ring-primary-500"
          />
        ) : (
          <span className="text-xs text-gray-700 dark:text-slate-300">{grupo.kcal_alvo ?? '-'}</span>
        )}
      </div>
      {itens.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-500">Sem alimentos ainda.</p>
      ) : (
        <ul className="space-y-1">
          {itens.map((item, index) => {
            const kcal = calcularKcalItemGrupo(item)
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 text-xs text-gray-700 dark:text-slate-300 py-1 border-b border-gray-50 dark:border-slate-800/50 last:border-0"
              >
                <span className="min-w-0 truncate">
                  {item.tabela_alimentos?.nome || 'Alimento removido'}
                  <span className="text-gray-400 dark:text-slate-500">
                    {' — '}
                    {item.descricao_porcao ? `${item.descricao_porcao} (${item.quantidade_g}g)` : `${item.quantidade_g}g`}
                    {' · '}
                    {fmtKcal(kcal)}kcal
                  </span>
                </span>
                {podeEditar && (
                  <span className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => handleMover(index, -1)} disabled={index === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                      <ArrowUp size={12} />
                    </button>
                    <button type="button" onClick={() => handleMover(index, 1)} disabled={index === itens.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                      <ArrowDown size={12} />
                    </button>
                    <button type="button" onClick={() => setItemParaExcluir(item)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={12} />
                    </button>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {!podeEditar ? null : mostrarForm ? (
        <AdicionarAlimentoGrupoForm
          grupo={grupo}
          ordemProxima={itens.length > 0 ? Math.max(...itens.map((i) => i.ordem)) + 1 : 0}
          onItemAdicionado={handleItemAdicionado}
          onCancelar={() => setMostrarForm(false)}
        />
      ) : (
        <button type="button" onClick={() => setMostrarForm(true)} className="text-xs font-semibold text-primary-600 hover:underline">
          + Adicionar alimento
        </button>
      )}
      {itemParaExcluir && (
        <ConfirmModal
          titulo="Remover alimento do grupo"
          mensagem={`Remover "${itemParaExcluir.tabela_alimentos?.nome || 'este alimento'}" das opções deste grupo?`}
          detalhes="Isso não afeta refeições que já usaram esse grupo antes — só as próximas vezes que ele for inserido."
          onConfirmar={confirmarExclusaoItem}
          onCancelar={() => setItemParaExcluir(null)}
        />
      )}
    </div>
  )
}

export default function Modelos() {
  const [loading, setLoading] = useState(true)
  const [modelosRefeicoes, setModelosRefeicoes] = useState([])
  const [modelosPlanos, setModelosPlanos] = useState([])
  const [modelosOrientacoes, setModelosOrientacoes] = useState([])
  const [modelosListas, setModelosListas] = useState([])
  const [modelosAnamneses, setModelosAnamneses] = useState([])
  const [modelosGrupos, setModelosGrupos] = useState([])
  const [abertos, setAbertos] = useState(new Set())
  const [userId, setUserId] = useState(null)
  const [grupoParaExcluir, setGrupoParaExcluir] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null))
  }, [])

  const carregarTudo = async () => {
    setLoading(true)
    const [refRes, planoRes, orientRes, listasRes, anamRes, gruposRes] = await Promise.all([
      supabase.from('modelos_refeicoes').select('*, modelos_refeicoes_itens(*, tabela_alimentos(nome))').order('titulo'),
      supabase.from('modelos_planos').select('*, modelos_planos_refeicoes(*, modelos_planos_itens(*, tabela_alimentos(nome)))').order('titulo'),
      supabase.from('modelos_orientacoes').select('*').order('titulo'),
      supabase.from('modelos_listas_recomendacoes').select('*').order('titulo'),
      supabase.from('modelos_anamneses').select('*').order('titulo'),
      supabase.from('grupos_alimentos_modelo').select('*, grupos_alimentos_modelo_itens(*, tabela_alimentos(nome, energia_kcal))').order('titulo'),
    ])
    setModelosRefeicoes(refRes.data || [])
    setModelosPlanos(planoRes.data || [])
    setModelosOrientacoes(orientRes.data || [])
    setModelosListas(listasRes.data || [])
    setModelosAnamneses(anamRes.data || [])
    setModelosGrupos(gruposRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  const toggleAberto = (chave) => {
    setAbertos((prev) => {
      const novo = new Set(prev)
      if (novo.has(chave)) novo.delete(chave)
      else novo.add(chave)
      return novo
    })
  }

  const excluir = async (tabela, id, atualizarLista) => {
    if (!window.confirm('Excluir este modelo? Isso não afeta o que já foi criado a partir dele.')) return
    const { error } = await supabase.from(tabela).delete().eq('id', id)
    if (error) { alert('Erro ao excluir modelo: ' + error.message); return }
    atualizarLista((prev) => prev.filter((m) => m.id !== id))
  }

  const renomear = async (tabela, id, titulo, atualizarLista) => {
    atualizarLista((prev) => prev.map((m) => (m.id === id ? { ...m, titulo } : m)))
    await supabase.from(tabela).update({ titulo }).eq('id', id)
  }

  const confirmarExclusaoGrupo = async () => {
    const id = grupoParaExcluir.id
    setGrupoParaExcluir(null)
    const { error } = await supabase.from('grupos_alimentos_modelo').delete().eq('id', id)
    if (error) { alert('Erro ao excluir grupo: ' + error.message); return }
    setModelosGrupos((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Modelos</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Organize num só lugar os modelos reutilizáveis que você salvou. Modelos de refeição e plano alimentar
          são criados a partir do Plano Alimentar de qualquer paciente; orientações, listas de recomendações e
          anamnese, a partir das respectivas telas do paciente.
        </p>
      </div>

      <Secao
        titulo="Refeições"
        icone={UtensilsCrossed}
        cor="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400"
        itens={modelosRefeicoes}
        carregando={loading}
        vazio='Nenhum modelo de refeição ainda. Salve um em "Salvar como modelo", dentro de uma refeição no Plano Alimentar.'
      >
        {modelosRefeicoes.map((m) => (
          <LinhaModelo
            key={m.id}
            modelo={m}
            aberto={abertos.has(`refeicao-${m.id}`)}
            onToggle={() => toggleAberto(`refeicao-${m.id}`)}
            onRenomear={(id, titulo) => renomear('modelos_refeicoes', id, titulo, setModelosRefeicoes)}
            onExcluir={(id) => excluir('modelos_refeicoes', id, setModelosRefeicoes)}
            resumo={`${m.modelos_refeicoes_itens?.length || 0} item(ns)`}
          >
            {m.modelos_refeicoes_itens?.length > 0 ? (
              <ul className="space-y-1">
                {m.modelos_refeicoes_itens.map((item) => (
                  <li key={item.id} className="text-xs text-gray-700 dark:text-slate-300">
                    {item.nome_customizado || item.tabela_alimentos?.nome || 'Alimento removido'}
                    <span className="text-gray-400 dark:text-slate-500"> — {labelQuantidade(item)}</span>
                    {item.opcao_numero > 1 && (
                      <span className="text-primary-500 dark:text-primary-400"> (Opção {item.opcao_numero})</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500">Sem itens.</p>
            )}
          </LinhaModelo>
        ))}
      </Secao>

      <Secao
        titulo="Plano Alimentar"
        icone={ClipboardList}
        cor="text-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:text-primary-400"
        itens={modelosPlanos}
        carregando={loading}
        vazio='Nenhum modelo de plano ainda. Salve um em "Salvar como modelo", dentro de um Plano Alimentar de paciente.'
      >
        {modelosPlanos.map((m) => {
          const refeicoes = [...(m.modelos_planos_refeicoes || [])].sort((a, b) => a.ordem - b.ordem)
          return (
            <LinhaModelo
              key={m.id}
              modelo={m}
              aberto={abertos.has(`plano-${m.id}`)}
              onToggle={() => toggleAberto(`plano-${m.id}`)}
              onRenomear={(id, titulo) => renomear('modelos_planos', id, titulo, setModelosPlanos)}
              onExcluir={(id) => excluir('modelos_planos', id, setModelosPlanos)}
              resumo={`${refeicoes.length} refeição(ões)${m.vet_target ? ` · ${m.vet_target} kcal` : ''}`}
            >
              {refeicoes.length > 0 ? (
                <div className="space-y-3">
                  {refeicoes.map((r) => (
                    <div key={r.id}>
                      <p className="text-xs font-black text-gray-700 dark:text-slate-300">
                        {r.horario ? `${r.horario.slice(0, 5)} — ` : ''}{r.nome_refeicao}
                      </p>
                      <ul className="ml-3 space-y-0.5 mt-0.5">
                        {(r.modelos_planos_itens || []).map((item) => (
                          <li key={item.id} className="text-xs text-gray-600 dark:text-slate-400">
                            {item.nome_customizado || item.tabela_alimentos?.nome || 'Alimento removido'}
                            <span className="text-gray-400 dark:text-slate-500"> — {labelQuantidade(item)}</span>
                            {item.opcao_numero > 1 && (
                              <span className="text-primary-500 dark:text-primary-400"> (Opção {item.opcao_numero})</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-slate-500">Sem refeições.</p>
              )}
            </LinhaModelo>
          )
        })}
      </Secao>

      <Secao
        titulo="Orientações Nutricionais"
        icone={FileText}
        cor="text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
        itens={modelosOrientacoes}
        carregando={loading}
        vazio='Nenhum modelo de orientação ainda. Salve um marcando "Salvar também como modelo", dentro de Orientações Nutricionais de um paciente.'
      >
        {modelosOrientacoes.map((m) => (
          <LinhaModelo
            key={m.id}
            modelo={m}
            aberto={abertos.has(`orientacao-${m.id}`)}
            onToggle={() => toggleAberto(`orientacao-${m.id}`)}
            onRenomear={(id, titulo) => renomear('modelos_orientacoes', id, titulo, setModelosOrientacoes)}
            onExcluir={(id) => excluir('modelos_orientacoes', id, setModelosOrientacoes)}
          >
            {m.conteudo ? (
              <div className="rte-html text-xs text-gray-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: m.conteudo }} />
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500">-</p>
            )}
          </LinhaModelo>
        ))}
      </Secao>

      <Secao
        titulo="Listas de Recomendações"
        icone={ListChecks}
        cor="text-sky-600 bg-sky-50 dark:bg-sky-900/20 dark:text-sky-400"
        itens={modelosListas}
        carregando={loading}
        vazio='Nenhum modelo de lista ainda. Salve um marcando "Salvar também como modelo", dentro de Listas de Recomendações de um paciente.'
      >
        {modelosListas.map((m) => (
          <LinhaModelo
            key={m.id}
            modelo={m}
            aberto={abertos.has(`lista-${m.id}`)}
            onToggle={() => toggleAberto(`lista-${m.id}`)}
            onRenomear={(id, titulo) => renomear('modelos_listas_recomendacoes', id, titulo, setModelosListas)}
            onExcluir={(id) => excluir('modelos_listas_recomendacoes', id, setModelosListas)}
          >
            {m.conteudo ? (
              <div className="rte-html text-xs text-gray-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: m.conteudo }} />
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500">-</p>
            )}
          </LinhaModelo>
        ))}
      </Secao>

      <Secao
        titulo="Anamnese"
        icone={Stethoscope}
        cor="text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-400"
        itens={modelosAnamneses}
        carregando={loading}
        vazio='Nenhum modelo de anamnese ainda. Salve um marcando "Salvar também como modelo", dentro da Anamnese de um paciente.'
      >
        {modelosAnamneses.map((m) => (
          <LinhaModelo
            key={m.id}
            modelo={m}
            aberto={abertos.has(`anamnese-${m.id}`)}
            onToggle={() => toggleAberto(`anamnese-${m.id}`)}
            onRenomear={(id, titulo) => renomear('modelos_anamneses', id, titulo, setModelosAnamneses)}
            onExcluir={(id) => excluir('modelos_anamneses', id, setModelosAnamneses)}
          >
            {m.conteudo ? (
              <div className="rte-html text-xs text-gray-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: m.conteudo }} />
            ) : (
              <p className="text-xs text-gray-400 dark:text-slate-500">-</p>
            )}
          </LinhaModelo>
        ))}
      </Secao>

      <Secao
        titulo="Grupos de Alimentos"
        icone={Layers}
        cor="text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400"
        itens={modelosGrupos}
        carregando={loading}
        vazio='Nenhum grupo cadastrado ainda. Crie um grupo (ex: "Carboidratos — 150kcal") com alimentos intercambiáveis pra inserir de uma vez em qualquer refeição do Plano Alimentar.'
        headerExtra={
          <NovoGrupoForm
            onCriado={(novo) => {
              setModelosGrupos((prev) => [...prev, novo])
              setAbertos((prev) => new Set(prev).add(`grupo-${novo.id}`))
            }}
          />
        }
      >
        {modelosGrupos.map((g) => {
          const podeEditar = !!userId && g.id_avaliador === userId
          const n = g.grupos_alimentos_modelo_itens?.length || 0
          return (
            <LinhaModelo
              key={g.id}
              modelo={g}
              aberto={abertos.has(`grupo-${g.id}`)}
              onToggle={() => toggleAberto(`grupo-${g.id}`)}
              onRenomear={podeEditar ? (id, titulo) => renomear('grupos_alimentos_modelo', id, titulo, setModelosGrupos) : undefined}
              onExcluir={podeEditar ? () => setGrupoParaExcluir(g) : undefined}
              resumo={`${g.id_avaliador ? '' : 'Padrão · '}${n} opç${n === 1 ? 'ão' : 'ões'}${g.kcal_alvo ? ` · ~${g.kcal_alvo}kcal` : ''}`}
            >
              <GrupoItensEditor
                grupo={g}
                podeEditar={podeEditar}
                onAtualizarGrupo={(grupoAtualizado) =>
                  setModelosGrupos((prev) => prev.map((m) => (m.id === grupoAtualizado.id ? grupoAtualizado : m)))
                }
              />
            </LinhaModelo>
          )
        })}
      </Secao>

      {grupoParaExcluir && (
        <ConfirmModal
          titulo="Excluir grupo de alimentos"
          mensagem={`Excluir "${grupoParaExcluir.titulo}"?`}
          detalhes={`Isso apaga as ${grupoParaExcluir.grupos_alimentos_modelo_itens?.length || 0} opções do grupo. Não afeta refeições que já usaram esse grupo antes — só fica indisponível pra inserir de novo.`}
          onConfirmar={confirmarExclusaoGrupo}
          onCancelar={() => setGrupoParaExcluir(null)}
        />
      )}
    </div>
  )
}
