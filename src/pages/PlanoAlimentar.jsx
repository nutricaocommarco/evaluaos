import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from '../components/SidebarPaciente'
import GeradorPdfNutricional from '../components/GeradorPdfNutricional'
import InterruptorVisibilidade from '../components/InterruptorVisibilidade'
import RichTextEditor, { sanitizarHtmlEditor } from '../components/RichTextEditor'
import { FileDown, Save, Pencil, Trash2, StickyNote, ImagePlus, ChevronDown, ChevronRight } from 'lucide-react'
import SeletorImagem from '../components/imagens/SeletorImagem'
import { aplicarBuscaPorPalavras } from '../utils/buscaAlimentos'
import { MICRONUTRIENTES, calcularMacrosItem, somarMacros } from '../utils/calculoNutricional'

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

// Medidas caseiras — só ajudam a digitar a quantidade (o peso final em
// gramas é sempre o que vai pro cálculo, editável antes de salvar). Os
// gramas por unidade são aproximações usuais; variam por alimento na
// prática, por isso o campo de gramas fica sempre aberto pra ajuste.
// fatorG null = sem conversão automática (o peso de "1 unidade" varia
// demais de alimento pra alimento — banana, ovo, fatia de pão não têm
// nada em comum). Pra essas, o nutri digita a quantidade em gramas à
// parte, na mão.
const UNIDADES_MEDIDA = [
  { valor: 'g', label: 'Gramas (g)', fatorG: 1 },
  { valor: 'unidade', label: 'Unidade(s)', fatorG: null },
  { valor: 'ml', label: 'Mililitros (ml)', fatorG: 1 },
  { valor: 'colher_sopa', label: 'Colher de sopa (~15g)', fatorG: 15 },
  { valor: 'colher_cha', label: 'Colher de chá (~5g)', fatorG: 5 },
  { valor: 'colher_cafe', label: 'Colher de café (~3g)', fatorG: 3 },
  { valor: 'copo_americano', label: 'Copo americano (~200ml)', fatorG: 200 },
  { valor: 'xicara_cha', label: 'Xícara de chá (~240ml)', fatorG: 240 },
  { valor: 'concha', label: 'Concha média (~80g)', fatorG: 80 },
  { valor: 'a_vontade', label: 'À vontade (sem peso)', fatorG: null },
]

function labelUnidade(valor) {
  return UNIDADES_MEDIDA.find((u) => u.valor === valor)?.label.replace(/\s*\(~.*\)/, '') || valor
}

// O "(~15g)" no rótulo é só o fator GENÉRICO, igual pra qualquer
// alimento. Quando o alimento selecionado tem peso próprio cadastrado
// pra essa mesma unidade (medida_caseira_unidade bate com u.valor), o
// rótulo precisa mostrar ESSE peso — senão o texto da opção continua
// dizendo "~15g" mesmo quando o cálculo real já usa 25g, o que confunde
// o nutricionista (viu esse caso: arroz/feijão em "Colher de sopa").
function labelUnidadeParaAlimento(u, unidadeEfetiva, gramasEfetiva) {
  if (unidadeEfetiva !== u.valor || !gramasEfetiva) return u.label
  const match = u.label.match(/\(~\d+(\D*)\)/)
  const sufixo = match ? match[1] : 'g'
  const base = u.label.replace(/\s*\(~.*?\)/, '')
  return `${base} (${gramasEfetiva}${sufixo})`
}

// A maioria das medidas caseiras já vem com a contagem embutida na
// descrição ("1 colher de sopa cheia", "1 fatia") — só antepõe "1 " se a
// descrição ainda não começar com um número (ex: alguém digitou só
// "colher de sopa" na medida pessoal).
function formatarMedidaCaseira(desc) {
  const texto = (desc || '').trim()
  return texto && /^\d/.test(texto) ? texto : `1 ${texto || 'unidade'}`
}

// Busca alimentos e sobrepõe a medida caseira PESSOAL do nutri logado (se
// tiver cadastrada) por cima da oficial — permite anotar "1 unidade ≈ 90g"
// num alimento da TACO/IBGE sem alterar o valor nutricional compartilhado.
async function buscarAlimentosComMedidaPessoal(termo, limite = 15) {
  const { data } = await aplicarBuscaPorPalavras(
    supabase.from('tabela_alimentos').select('*'),
    'nome',
    termo
  )
    .order('nome')
    .limit(limite)
  let lista = data || []

  const idsOficiais = lista.filter((a) => !a.id_avaliador).map((a) => a.id)
  if (idsOficiais.length > 0) {
    const { data: authData } = await supabase.auth.getUser()
    if (authData?.user) {
      const { data: overrides } = await supabase
        .from('alimentos_medida_caseira_pessoal')
        .select('id_alimento, medida_caseira_desc, medida_caseira_g, medida_caseira_unidade')
        .eq('id_avaliador', authData.user.id)
        .in('id_alimento', idsOficiais)
      const mapa = {}
      for (const o of overrides || []) mapa[o.id_alimento] = o
      lista = lista.map((a) =>
        mapa[a.id]
          ? {
              ...a,
              medida_caseira_desc: mapa[a.id].medida_caseira_desc,
              medida_caseira_g: mapa[a.id].medida_caseira_g,
              medida_caseira_unidade: mapa[a.id].medida_caseira_unidade,
            }
          : a
      )
    }
  }

  return lista
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

// Mesma lógica de src/pages/PerfilPaciente.jsx (não exportada de lá — função
// pura pequena, duplicada aqui como o resto do arquivo já faz).
function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null
  const nasc = new Date(dataNascimento + 'T12:00:00')
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

// Mapeia idade pra uma das 4 faixas cadastradas em dri_referencias
// (19-30/31-50/51-70/71-120). Menor de 19 anos = sem referência DRI
// cadastrada ainda (ver migration 0055/0096).
function faixaDri(idade, sexo) {
  if (!Number.isFinite(idade) || idade < 19 || (sexo !== 'M' && sexo !== 'F')) return null
  if (idade <= 30) return { idade_min: 19, idade_max: 30 }
  if (idade <= 50) return { idade_min: 31, idade_max: 50 }
  if (idade <= 70) return { idade_min: 51, idade_max: 70 }
  return { idade_min: 71, idade_max: 120 }
}

// Recomendação padrão de fibra alimentar: 14g a cada 1000kcal do VET
// prescrito (base usada por diretrizes de ingestão dietética).
function calcularFibraRecomendada(vetTarget) {
  const vet = Number(vetTarget)
  return vet > 0 ? (vet / 1000) * 14 : null
}

function fmt(n) {
  return Number.isFinite(n) ? n.toFixed(1).replace(/\.0$/, '') : '0'
}

// Sem horário vai pro fim da lista; em caso de empate, usa 'ordem' (a mesma
// coluna que as setas ▲▼ já manipulam) como critério de desempate manual.
function compararRefeicoes(a, b) {
  const ha = a.horario || '99:99'
  const hb = b.horario || '99:99'
  if (ha !== hb) return ha < hb ? -1 : 1
  return a.ordem - b.ordem
}

// Duplica itens (de uma opção ou de uma refeição inteira) preservando os
// substitutos de cada item. Um insert por item (em vez de insert em lote)
// pra poder amarrar com segurança o id do item novo aos substitutos dele.
async function duplicarItensComSubstitutos(itensOrigem, idRefeicaoDestino, mapOpcao) {
  const resultados = await Promise.all(
    itensOrigem.map(async (origem) => {
      const { data: novoItem, error } = await supabase
        .from('itens_refeicao')
        .insert({
          id_refeicao: idRefeicaoDestino,
          id_alimento: origem.id_alimento,
          quantidade_g: origem.quantidade_g,
          opcao_numero: mapOpcao ? mapOpcao(origem.opcao_numero) : origem.opcao_numero,
          nome_customizado: origem.nome_customizado || null,
          unidade_medida: origem.unidade_medida || null,
          quantidade_medida: origem.quantidade_medida || null,
        })
        .select('*, tabela_alimentos(*)')
        .single()

      if (error || !novoItem) return null

      let substitutos = []
      const subsOrigem = origem.substitutos_item || []
      if (subsOrigem.length > 0) {
        const inserts = subsOrigem.map((s) => ({
          id_item_original: novoItem.id,
          id_alimento: s.id_alimento,
          quantidade_g: s.quantidade_g,
          unidade_medida: s.unidade_medida || null,
          quantidade_medida: s.quantidade_medida || null,
          ordem: s.ordem,
        }))
        const { data: novosSubs } = await supabase
          .from('substitutos_item')
          .insert(inserts)
          .select('*, tabela_alimentos(*)')
        substitutos = novosSubs || []
      }

      return { ...novoItem, substitutos_item: substitutos }
    })
  )
  return resultados.filter(Boolean)
}

// Insere um Grupo de Alimentos (Modelos > Grupos de Alimentos) numa
// refeição: o primeiro alimento do grupo (por 'ordem') vira o item normal
// da refeição, e os demais entram como substitutos_item dele — reaproveita
// 100% do cálculo/exibição de substitutos que já existe (calcularMacrosItem,
// SubstitutosModal, tela do paciente, PDF), sem precisar de nenhuma coluna
// nova em itens_refeicao pra "item sem alimento único".
async function inserirGrupoAlimentos(grupo, idRefeicao, opcaoNumero) {
  const itensGrupo = [...(grupo.grupos_alimentos_modelo_itens || [])].sort((a, b) => a.ordem - b.ordem)
  if (itensGrupo.length === 0) return null
  const [primario, ...resto] = itensGrupo

  const { data: novoItem, error } = await supabase
    .from('itens_refeicao')
    .insert({
      id_refeicao: idRefeicao,
      id_alimento: primario.id_alimento,
      quantidade_g: primario.quantidade_g,
      opcao_numero: opcaoNumero,
      nome_customizado: grupo.titulo,
    })
    .select('*, tabela_alimentos(*)')
    .single()

  if (error || !novoItem) {
    alert('Erro ao adicionar grupo: ' + (error?.message || 'grupo sem alimentos'))
    return null
  }

  let substitutos = []
  if (resto.length > 0) {
    const inserts = resto.map((it, i) => ({
      id_item_original: novoItem.id,
      id_alimento: it.id_alimento,
      quantidade_g: it.quantidade_g,
      ordem: i,
    }))
    const { data: novosSubs } = await supabase.from('substitutos_item').insert(inserts).select('*, tabela_alimentos(*)')
    substitutos = novosSubs || []
  }

  return { ...novoItem, substitutos_item: substitutos }
}

// Busca de alimento com debounce + adiciona item a uma refeição/opção.
// Componente isolado pra cada instância ter seu próprio estado de busca.
function AdicionarItemForm({ refeicaoId, opcaoNumero, onItemAdicionado, onCancelar }) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selecionado, setSelecionado] = useState(null)
  const [unidade, setUnidade] = useState('g')
  const [quantidadeMedida, setQuantidadeMedida] = useState('')
  const [quantidade, setQuantidade] = useState('')
  const [salvando, setSalvando] = useState(false)
  const dropdownRef = useRef(null)

  // A medida caseira do alimento (Tabela de Alimentos > editar, ou medida
  // pessoal) vale especificamente pra UMA unidade do seletor — pode ser
  // "Unidade(s)" (banana, ovo) ou uma das outras, tipo "Colher de sopa"
  // (arroz, feijão). Só substitui o fator genérico quando a unidade
  // escolhida bate com a cadastrada pro alimento; nas outras, o fator
  // genérico da lista continua valendo.
  const fatorParaUnidade = (valorUnidade) =>
    selecionado && selecionado.medida_caseira_unidade === valorUnidade
      ? selecionado.medida_caseira_g || null
      : UNIDADES_MEDIDA.find((u) => u.valor === valorUnidade)?.fatorG

  const fatorUnidade = fatorParaUnidade(unidade)

  const handleChangeUnidade = (novaUnidade) => {
    setUnidade(novaUnidade)
    if (novaUnidade === 'g') { setQuantidadeMedida(''); return }
    const fator = fatorParaUnidade(novaUnidade)
    const qtdMedida = Number(quantidadeMedida) || Number(quantidade) || ''
    setQuantidadeMedida(qtdMedida === '' ? '' : String(qtdMedida))
    if (fator && qtdMedida !== '') setQuantidade(String((Number(qtdMedida) * fator).toFixed(2).replace(/\.00$/, '')))
  }

  const handleChangeQuantidadeMedida = (valor) => {
    setQuantidadeMedida(valor)
    if (!fatorUnidade) return
    if (valor === '') { setQuantidade(''); return }
    setQuantidade(String((Number(valor) * fatorUnidade).toFixed(2).replace(/\.00$/, '')))
  }

  useEffect(() => {
    if (busca.trim().length < 2) { setResultados([]); return }
    const delay = setTimeout(async () => {
      setResultados(await buscarAlimentosComMedidaPessoal(busca.trim()))
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

  const ehAVontade = unidade === 'a_vontade'

  const handleAdicionar = async () => {
    if (!selecionado) return
    if (!ehAVontade && (!quantidade || Number(quantidade) <= 0)) return
    setSalvando(true)

    const { data, error } = await supabase
      .from('itens_refeicao')
      .insert({
        id_refeicao: refeicaoId,
        id_alimento: selecionado.id,
        quantidade_g: ehAVontade ? null : Number(quantidade),
        opcao_numero: opcaoNumero,
        unidade_medida: ehAVontade ? 'a_vontade' : unidade !== 'g' && quantidadeMedida !== '' ? unidade : null,
        quantidade_medida: ehAVontade ? null : unidade !== 'g' && quantidadeMedida !== '' ? Number(quantidadeMedida) : null,
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
    setUnidade('g')
    setQuantidadeMedida('')
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
                <span className="font-semibold">{r.id_receita ? '🍳 ' : ''}{r.nome}</span>
                <span className="text-gray-400 dark:text-slate-500 ml-2">{r.energia_kcal ?? '-'} kcal/100g</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="w-40">
        <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
          Medida
        </label>
        <select
          value={unidade}
          onChange={(e) => handleChangeUnidade(e.target.value)}
          className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
        >
          {UNIDADES_MEDIDA.map((u) => (
            <option key={u.valor} value={u.valor}>
              {labelUnidadeParaAlimento(u, selecionado?.medida_caseira_unidade, selecionado?.medida_caseira_g)}
            </option>
          ))}
        </select>
      </div>

      {!ehAVontade && unidade !== 'g' && (
        <div className="w-20">
          <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Qtd
          </label>
          <input
            type="number"
            step="any"
            value={quantidadeMedida}
            onChange={(e) => handleChangeQuantidadeMedida(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      {!ehAVontade && (
        <div className="w-24">
          <label className="block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {unidade !== 'g' ? '≈ Gramas' : 'Qtd (g)'}
          </label>
          <input
            type="number"
            step="any"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleAdicionar}
        disabled={!selecionado || (!ehAVontade && (!quantidade || Number(quantidade) <= 0)) || salvando}
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

      {unidade === 'unidade' && selecionado && (
        <p className="w-full text-[10px] text-gray-400 dark:text-slate-500">
          {selecionado.medida_caseira_unidade === 'unidade' && selecionado.medida_caseira_g
            ? `Peso cadastrado pra esse alimento: ${formatarMedidaCaseira(selecionado.medida_caseira_desc)} ≈ ${selecionado.medida_caseira_g}g (calculado sozinho ao digitar a Qtd).`
            : 'Esse alimento não tem peso por unidade cadastrado ainda — digite as gramas manualmente, ou cadastre em Tabela de Alimentos > editar > Medida Caseira pra próxima vez ser automático.'}
        </p>
      )}
      {unidade !== 'unidade' && unidade !== 'g' && selecionado?.medida_caseira_unidade === unidade && selecionado.medida_caseira_g && (
        <p className="w-full text-[10px] text-gray-400 dark:text-slate-500">
          Peso cadastrado pra esse alimento nessa medida: {formatarMedidaCaseira(selecionado.medida_caseira_desc)} ≈ {selecionado.medida_caseira_g}g (calculado sozinho ao digitar a Qtd, em vez do valor genérico da lista).
        </p>
      )}
      {ehAVontade && (
        <p className="w-full text-[10px] text-gray-400 dark:text-slate-500">
          Sem peso definido — entra 0kcal no cálculo de macros e aparece pro paciente como "à vontade". Use pra folhas, verduras e legumes sem risco real de excesso.
        </p>
      )}
    </div>
  )
}

// Lista os Grupos de Alimentos do avaliador (cadastrados em Modelos >
// Grupos de Alimentos) e insere o escolhido de uma vez via
// inserirGrupoAlimentos. Sem busca com debounce (lista curta e navegável,
// diferente da busca em tabela_alimentos inteira).
function AdicionarGrupoForm({ refeicaoId, opcaoNumero, onItemAdicionado, onCancelar }) {
  const [grupos, setGrupos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [salvandoId, setSalvandoId] = useState(null)

  useEffect(() => {
    let ativo = true
    supabase
      .from('grupos_alimentos_modelo')
      .select('*, grupos_alimentos_modelo_itens(*, tabela_alimentos(nome, energia_kcal))')
      .order('titulo')
      .then(({ data }) => {
        if (ativo) { setGrupos(data || []); setCarregando(false) }
      })
    return () => { ativo = false }
  }, [])

  const gruposFiltrados = busca.trim()
    ? grupos.filter((g) => g.titulo.toLowerCase().includes(busca.trim().toLowerCase()))
    : grupos

  const handleEscolher = async (grupo) => {
    setSalvandoId(grupo.id)
    const item = await inserirGrupoAlimentos(grupo, refeicaoId, opcaoNumero)
    setSalvandoId(null)
    if (item) onItemAdicionado(item)
  }

  return (
    <div className="p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2 gap-2">
        <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
          Grupo de alimentos
        </label>
        <button type="button" onClick={onCancelar} className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-gray-700 shrink-0">
          Cancelar
        </button>
      </div>
      <input
        type="text"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar grupo..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 mb-2"
      />
      {carregando ? (
        <p className="text-xs text-gray-400 dark:text-slate-500">Carregando...</p>
      ) : gruposFiltrados.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-slate-500">
          {grupos.length === 0
            ? 'Nenhum grupo cadastrado ainda — crie em Modelos > Grupos de Alimentos.'
            : 'Nenhum grupo bate com essa busca.'}
        </p>
      ) : (
        <ul className="max-h-52 overflow-y-auto space-y-1">
          {gruposFiltrados.map((g) => {
            const n = g.grupos_alimentos_modelo_itens?.length || 0
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => handleEscolher(g)}
                  disabled={n === 0 || salvandoId === g.id}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-xs disabled:opacity-50 flex items-center justify-between gap-2"
                >
                  <span className="font-semibold">{g.titulo}</span>
                  <span className="text-gray-400 dark:text-slate-500 shrink-0">
                    {salvandoId === g.id ? '...' : `${n} opç${n === 1 ? 'ão' : 'ões'}${g.kcal_alvo ? ` · ~${fmt(g.kcal_alvo)}kcal` : ''}`}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// Uma linha de item da refeição, com menu "..." pra renomear (só neste
// plano), editar quantidade/medida, abrir substitutos ou excluir.
function ItemLinha({ item, onExcluir, onRenomear, onAbrirSubstitutos, onAtualizarQuantidade }) {
  const [menuAberto, setMenuAberto] = useState(false)
  const [renomeando, setRenomeando] = useState(false)
  const [nomeEdit, setNomeEdit] = useState('')
  const [editandoQtd, setEditandoQtd] = useState(false)
  const [unidadeEdit, setUnidadeEdit] = useState('g')
  const [quantidadeMedidaEdit, setQuantidadeMedidaEdit] = useState('')
  const [quantidadeEdit, setQuantidadeEdit] = useState('')
  const [medidaPessoal, setMedidaPessoal] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickFora = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAberto(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  const m = calcularMacrosItem(item)
  const nomeOriginal = item.tabela_alimentos?.nome || 'Alimento removido'
  const nomeExibido = item.nome_customizado || nomeOriginal
  const numSubstitutos = item.substitutos_item?.length || 0

  const iniciarRenomear = () => {
    setNomeEdit(item.nome_customizado || nomeOriginal)
    setRenomeando(true)
    setMenuAberto(false)
  }

  const salvarRenomear = async () => {
    const digitado = nomeEdit.trim()
    const valor = digitado && digitado !== nomeOriginal ? digitado : null
    setRenomeando(false)
    if (valor === (item.nome_customizado || null)) return
    onRenomear(item.id, valor)
    await supabase.from('itens_refeicao').update({ nome_customizado: valor }).eq('id', item.id)
  }

  const iniciarEditarQtd = async () => {
    setUnidadeEdit(item.unidade_medida || 'g')
    setQuantidadeMedidaEdit(item.quantidade_medida != null ? String(item.quantidade_medida) : '')
    setQuantidadeEdit(item.quantidade_g != null ? String(item.quantidade_g) : '')
    setEditandoQtd(true)
    setMenuAberto(false)

    if (!item.tabela_alimentos?.id_avaliador && item.id_alimento) {
      const { data: authData } = await supabase.auth.getUser()
      if (authData?.user) {
        const { data } = await supabase
          .from('alimentos_medida_caseira_pessoal')
          .select('medida_caseira_desc, medida_caseira_g, medida_caseira_unidade')
          .eq('id_avaliador', authData.user.id)
          .eq('id_alimento', item.id_alimento)
          .maybeSingle()
        setMedidaPessoal(data || null)
      }
    }
  }

  const medidaUnidadeEfetiva = medidaPessoal?.medida_caseira_unidade || item.tabela_alimentos?.medida_caseira_unidade
  const medidaGramasEfetiva = medidaPessoal?.medida_caseira_g || item.tabela_alimentos?.medida_caseira_g
  const medidaDescEfetiva = medidaPessoal?.medida_caseira_desc || item.tabela_alimentos?.medida_caseira_desc

  const fatorParaUnidadeEdit = (valorUnidade) =>
    medidaUnidadeEfetiva === valorUnidade ? medidaGramasEfetiva || null : UNIDADES_MEDIDA.find((u) => u.valor === valorUnidade)?.fatorG

  const fatorUnidadeEdit = fatorParaUnidadeEdit(unidadeEdit)

  const handleChangeUnidadeEdit = (nova) => {
    setUnidadeEdit(nova)
    if (nova === 'g') { setQuantidadeMedidaEdit(''); return }
    const fator = fatorParaUnidadeEdit(nova)
    const qtdMedida = Number(quantidadeMedidaEdit) || Number(quantidadeEdit) || ''
    setQuantidadeMedidaEdit(qtdMedida === '' ? '' : String(qtdMedida))
    if (fator && qtdMedida !== '') setQuantidadeEdit(String((Number(qtdMedida) * fator).toFixed(2).replace(/\.00$/, '')))
  }

  const handleChangeQuantidadeMedidaEdit = (valor) => {
    setQuantidadeMedidaEdit(valor)
    if (!fatorUnidadeEdit || valor === '') return
    setQuantidadeEdit(String((Number(valor) * fatorUnidadeEdit).toFixed(2).replace(/\.00$/, '')))
  }

  const ehAVontadeEdit = unidadeEdit === 'a_vontade'

  const salvarEdicaoQtd = async () => {
    let patch
    if (ehAVontadeEdit) {
      patch = { quantidade_g: null, unidade_medida: 'a_vontade', quantidade_medida: null }
    } else {
      const novaQtd = Number(quantidadeEdit)
      if (!novaQtd || novaQtd <= 0) { alert('Quantidade em gramas inválida.'); return }
      patch = {
        quantidade_g: novaQtd,
        unidade_medida: unidadeEdit !== 'g' && quantidadeMedidaEdit !== '' ? unidadeEdit : null,
        quantidade_medida: unidadeEdit !== 'g' && quantidadeMedidaEdit !== '' ? Number(quantidadeMedidaEdit) : null,
      }
    }
    setEditandoQtd(false)
    onAtualizarQuantidade(item.id, patch)
    await supabase.from('itens_refeicao').update(patch).eq('id', item.id)
  }

  if (editandoQtd) {
    return (
      <li className="text-xs">
        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-200 dark:border-slate-700">
          <select
            value={unidadeEdit}
            onChange={(e) => handleChangeUnidadeEdit(e.target.value)}
            className="px-1.5 py-1 border border-gray-300 rounded text-xs outline-none focus:ring-2 focus:ring-primary-500"
          >
            {UNIDADES_MEDIDA.map((u) => (
              <option key={u.valor} value={u.valor}>
                {labelUnidadeParaAlimento(u, medidaUnidadeEfetiva, medidaGramasEfetiva)}
              </option>
            ))}
          </select>
          {!ehAVontadeEdit && unidadeEdit !== 'g' && (
            <input
              type="number"
              step="any"
              autoFocus
              value={quantidadeMedidaEdit}
              onChange={(e) => handleChangeQuantidadeMedidaEdit(e.target.value)}
              placeholder="Qtd"
              className="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs outline-none focus:ring-2 focus:ring-primary-500"
            />
          )}
          {!ehAVontadeEdit && (
            <>
              <input
                type="number"
                step="any"
                value={quantidadeEdit}
                onChange={(e) => setQuantidadeEdit(e.target.value)}
                placeholder="Gramas"
                className="w-16 px-1.5 py-1 border border-gray-300 rounded text-xs outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-[10px] text-gray-400 dark:text-slate-500">g</span>
            </>
          )}
          <button onClick={salvarEdicaoQtd} className="text-[11px] font-semibold text-primary-600 hover:underline">Salvar</button>
          <button onClick={() => setEditandoQtd(false)} className="text-[11px] text-gray-400 dark:text-slate-500 hover:text-gray-600">Cancelar</button>
          {unidadeEdit === 'unidade' && (
            <p className="w-full text-[10px] text-gray-400 dark:text-slate-500">
              {medidaUnidadeEfetiva === 'unidade' && medidaGramasEfetiva
                ? `Peso cadastrado: ${formatarMedidaCaseira(medidaDescEfetiva)} ≈ ${medidaGramasEfetiva}g.`
                : 'Sem peso por unidade cadastrado pra esse alimento — digite as gramas manualmente.'}
            </p>
          )}
          {unidadeEdit !== 'unidade' && unidadeEdit !== 'g' && !ehAVontadeEdit && medidaUnidadeEfetiva === unidadeEdit && medidaGramasEfetiva && (
            <p className="w-full text-[10px] text-gray-400 dark:text-slate-500">
              Peso cadastrado nessa medida: {formatarMedidaCaseira(medidaDescEfetiva)} ≈ {medidaGramasEfetiva}g (em vez do valor genérico da lista).
            </p>
          )}
          {ehAVontadeEdit && (
            <p className="w-full text-[10px] text-gray-400 dark:text-slate-500">
              Sem peso definido — entra 0kcal no cálculo de macros e aparece pro paciente como "à vontade".
            </p>
          )}
        </div>
      </li>
    )
  }

  if (renomeando) {
    return (
      <li className="text-xs">
        <input
          autoFocus
          type="text"
          value={nomeEdit}
          onChange={(e) => setNomeEdit(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setRenomeando(false) }}
          onBlur={salvarRenomear}
          className="w-full px-2 py-1 border border-primary-300 rounded text-xs outline-none focus:ring-2 focus:ring-primary-500"
        />
      </li>
    )
  }

  return (
    <li className="flex items-center justify-between gap-2 text-xs text-gray-700 dark:text-slate-300">
      <span className="truncate">
        {nomeExibido}
        {item.nome_customizado && (
          <span className="text-gray-400 dark:text-slate-500 italic" title={`Alimento original: ${nomeOriginal}`}> *</span>
        )}
        {' — '}
        <button
          type="button"
          onClick={iniciarEditarQtd}
          title="Clique para editar a quantidade/medida"
          className="underline decoration-dotted decoration-gray-300 dark:decoration-slate-600 underline-offset-2 hover:text-primary-600 dark:hover:text-primary-400 hover:decoration-primary-400"
        >
          {item.unidade_medida === 'a_vontade'
            ? 'à vontade'
            : item.unidade_medida && item.quantidade_medida
              ? `${item.quantidade_medida} ${labelUnidade(item.unidade_medida)} (≈${item.quantidade_g}g)`
              : `${item.quantidade_g}g`}
        </button>
        {numSubstitutos > 0 && (
          <span className="text-primary-500 dark:text-primary-400 ml-1" title={`${numSubstitutos} substituto(s)`}>
            ⇄{numSubstitutos}
          </span>
        )}
        <span className="text-gray-400 dark:text-slate-500 ml-1">
          ({fmt(m.kcal)}kcal · P{fmt(m.proteina)} · C{fmt(m.carbo)} · L{fmt(m.lipidio)} · Fb{fmt(m.fibra)})
        </span>
      </span>
      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuAberto((v) => !v)}
          className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 px-1 leading-none"
        >
          •••
        </button>
        {menuAberto && (
          <ul className="absolute right-0 z-20 mt-1 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
            <li>
              <button
                onClick={iniciarRenomear}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Renomear nesta refeição
              </button>
            </li>
            <li>
              <button
                onClick={() => { setMenuAberto(false); onAbrirSubstitutos(item) }}
                className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Adicionar substitutos{numSubstitutos > 0 ? ` (${numSubstitutos})` : ''}
              </button>
            </li>
            <li>
              <button
                onClick={() => { setMenuAberto(false); onExcluir(item.id) }}
                className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Excluir
              </button>
            </li>
          </ul>
        )}
      </div>
    </li>
  )
}

// Busca de alimento pra escolher um substituto — seleção adiciona na hora
// (a quantidade é calculada/ajustada depois pelo chamador).
function BuscarSubstitutoForm({ onSelecionar, onCancelar }) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    if (busca.trim().length < 2) { setResultados([]); return }
    const delay = setTimeout(async () => {
      setResultados(await buscarAlimentosComMedidaPessoal(busca.trim()))
    }, 300)
    return () => clearTimeout(delay)
  }, [busca])

  useEffect(() => {
    const handleClickFora = (e) => { if (ref.current && !ref.current.contains(e.target)) onCancelar() }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="relative" ref={ref}>
      <input
        autoFocus
        type="text"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar alimento substituto..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
      />
      {resultados.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {resultados.map((r) => (
            <li
              key={r.id}
              onClick={() => onSelecionar(r)}
              className="px-3 py-2 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 text-xs border-b border-gray-100 dark:border-slate-800 last:border-0"
            >
              <span className="font-semibold">{r.nome}</span>
              <span className="text-gray-400 dark:text-slate-500 ml-2">{r.energia_kcal ?? '-'} kcal/100g</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Modal "Substitutos do alimento" — lista o item principal (travado) + os
// substitutos, com Média/Desvio padrão por coluna (igual ao Amplinutri).
function SubstitutosModal({ item, onFechar, onSubstitutosChange }) {
  const [substitutos, setSubstitutos] = useState(item.substitutos_item || [])
  const [equivalenciaAuto, setEquivalenciaAuto] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  const nomePrincipal = item.nome_customizado || item.tabela_alimentos?.nome || 'Alimento'
  const entradas = [{ tabela_alimentos: item.tabela_alimentos, quantidade_g: item.quantidade_g }, ...substitutos]
  const linhas = entradas.map((e) => ({ quantidade: Number(e.quantidade_g) || 0, ...calcularMacrosItem(e) }))

  const media = (campo) => linhas.reduce((s, l) => s + l[campo], 0) / linhas.length
  const desvio = (campo) => {
    if (linhas.length < 2) return 0
    const m = media(campo)
    return Math.sqrt(linhas.reduce((s, l) => s + (l[campo] - m) ** 2, 0) / linhas.length)
  }

  const handleAdicionarSubstituto = async (alimento) => {
    let quantidade = Number(item.quantidade_g) || 0
    if (equivalenciaAuto && alimento.energia_kcal) {
      const kcalAlvo = (item.tabela_alimentos?.energia_kcal || 0) * (quantidade / 100)
      quantidade = (kcalAlvo * 100) / alimento.energia_kcal
      // Arredonda pra baixo, de 5 em 5g — equivalência calculada (ex: 102.37g)
      // vira um número redondo e prático de pesar (100g), nunca menos que 5g.
      quantidade = Math.max(5, Math.floor(quantidade / 5) * 5)
    }
    const { data, error } = await supabase
      .from('substitutos_item')
      .insert({
        id_item_original: item.id,
        id_alimento: alimento.id,
        quantidade_g: quantidade,
        ordem: substitutos.length,
      })
      .select('*, tabela_alimentos(*)')
      .single()

    if (error) { alert('Erro ao adicionar substituto: ' + error.message); return }
    const novos = [...substitutos, data]
    setSubstitutos(novos)
    onSubstitutosChange(novos)
    setMostrarForm(false)
  }

  const handleQuantidadeChange = (substitutoId, valor) => {
    const novos = substitutos.map((s) => (s.id === substitutoId ? { ...s, quantidade_g: valor } : s))
    setSubstitutos(novos)
    onSubstitutosChange(novos)
  }

  const handleQuantidadeBlur = async (substitutoId, valor) => {
    await supabase.from('substitutos_item').update({ quantidade_g: Number(valor) || 0 }).eq('id', substitutoId)
  }

  // Trocar a unidade recalcula os gramas a partir da qtd de medida já
  // digitada (ou da estimativa a partir dos gramas atuais); voltar pra 'g'
  // limpa a medida caseira e deixa só o peso.
  // "Unidade" não tem fator fixo — usa o peso por unidade cadastrado no
  // próprio alimento do substituto, se tiver (Tabela de Alimentos > editar
  // ou a medida caseira pessoal). Sem isso, os gramas ficam por conta do
  // que já estava, o nutri ajusta na mão.
  const fatorParaUnidadeSub = (sub, valorUnidade) =>
    sub.tabela_alimentos?.medida_caseira_unidade === valorUnidade
      ? sub.tabela_alimentos?.medida_caseira_g || null
      : UNIDADES_MEDIDA.find((u) => u.valor === valorUnidade)?.fatorG

  const handleUnidadeChange = async (substitutoId, novaUnidade) => {
    const sub = substitutos.find((s) => s.id === substitutoId)
    if (!sub) return
    let patch
    if (novaUnidade === 'g') {
      patch = { unidade_medida: null, quantidade_medida: null }
    } else {
      const fator = fatorParaUnidadeSub(sub, novaUnidade)
      const qtdMedida = Number(sub.quantidade_medida) || (fator ? (Number(sub.quantidade_g) || 0) / fator : 0)
      patch = {
        unidade_medida: novaUnidade,
        quantidade_medida: qtdMedida ? Number(qtdMedida.toFixed(2)) : null,
        ...(fator && qtdMedida ? { quantidade_g: Number((qtdMedida * fator).toFixed(2)) } : {}),
      }
    }
    const novos = substitutos.map((s) => (s.id === substitutoId ? { ...s, ...patch } : s))
    setSubstitutos(novos)
    onSubstitutosChange(novos)
    await supabase.from('substitutos_item').update(patch).eq('id', substitutoId)
  }

  const handleQuantidadeMedidaChange = (substitutoId, valor) => {
    const novos = substitutos.map((s) => (s.id === substitutoId ? { ...s, quantidade_medida: valor } : s))
    setSubstitutos(novos)
    onSubstitutosChange(novos)
  }

  const handleQuantidadeMedidaBlur = async (substitutoId, valor) => {
    const sub = substitutos.find((s) => s.id === substitutoId)
    if (!sub?.unidade_medida) return
    const fator = fatorParaUnidadeSub(sub, sub.unidade_medida)
    const qtdMedida = Number(valor) || 0
    const patch = fator
      ? { quantidade_medida: qtdMedida, quantidade_g: Number((qtdMedida * fator).toFixed(2)) }
      : { quantidade_medida: qtdMedida }
    const novos = substitutos.map((s) => (s.id === substitutoId ? { ...s, ...patch } : s))
    setSubstitutos(novos)
    onSubstitutosChange(novos)
    await supabase.from('substitutos_item').update(patch).eq('id', substitutoId)
  }

  const handleRemoverSubstituto = async (substitutoId) => {
    const { error } = await supabase.from('substitutos_item').delete().eq('id', substitutoId)
    if (error) { alert('Erro ao remover substituto: ' + error.message); return }
    const novos = substitutos.filter((s) => s.id !== substitutoId)
    setSubstitutos(novos)
    onSubstitutosChange(novos)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Substitutos do alimento</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">{nomePrincipal}</p>
          </div>
          <button onClick={onFechar} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={equivalenciaAuto}
              onChange={(e) => setEquivalenciaAuto(e.target.checked)}
              className="w-4 h-4 accent-primary-600"
            />
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Equivalência automática</span>
          </label>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 -mt-3">
            Ao adicionar um substituto, a quantidade é calculada pra ter energia semelhante à do alimento principal (editável depois).
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-800">
                  <th className="text-left py-2 font-semibold">Alimento</th>
                  <th className="text-right py-2 font-semibold">Qtd</th>
                  <th className="text-left py-2 font-semibold pl-2">Medida caseira</th>
                  <th className="text-right py-2 font-semibold">PRO</th>
                  <th className="text-right py-2 font-semibold">LIP</th>
                  <th className="text-right py-2 font-semibold">CHO</th>
                  <th className="text-right py-2 font-semibold">Energia</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-50 dark:border-slate-800/50">
                  <td className="py-2 text-gray-700 dark:text-slate-300">
                    <span title="Alimento principal (não editável aqui)">🔒 {nomePrincipal}</span>
                  </td>
                  <td className="text-right">{fmt(linhas[0].quantidade)}g</td>
                  <td className="pl-2 text-gray-400 dark:text-slate-500">
                    {item.unidade_medida && item.quantidade_medida ? `${item.quantidade_medida} ${labelUnidade(item.unidade_medida)}` : '-'}
                  </td>
                  <td className="text-right">{fmt(linhas[0].proteina)}g</td>
                  <td className="text-right">{fmt(linhas[0].lipidio)}g</td>
                  <td className="text-right">{fmt(linhas[0].carbo)}g</td>
                  <td className="text-right">{fmt(linhas[0].kcal)}kcal</td>
                  <td></td>
                </tr>
                {substitutos.map((s, idx) => {
                  const l = linhas[idx + 1]
                  return (
                    <tr key={s.id} className="border-b border-gray-50 dark:border-slate-800/50">
                      <td className="py-2 text-gray-700 dark:text-slate-300 truncate max-w-[160px]">{s.tabela_alimentos?.nome}</td>
                      <td className="text-right whitespace-nowrap">
                        <input
                          type="number"
                          step="any"
                          value={s.quantidade_g}
                          onChange={(e) => handleQuantidadeChange(s.id, e.target.value)}
                          onBlur={(e) => handleQuantidadeBlur(s.id, e.target.value)}
                          className="w-14 px-1 py-0.5 border border-gray-200 dark:border-slate-700 rounded text-right text-xs bg-transparent outline-none focus:ring-1 focus:ring-primary-500"
                        />g
                      </td>
                      <td className="py-2 pl-2">
                        <div className="flex items-center gap-1">
                          <select
                            value={s.unidade_medida || 'g'}
                            onChange={(e) => handleUnidadeChange(s.id, e.target.value)}
                            className="px-1 py-0.5 border border-gray-200 dark:border-slate-700 rounded text-[11px] bg-transparent outline-none focus:ring-1 focus:ring-primary-500 max-w-[100px]"
                          >
                            {UNIDADES_MEDIDA.map((u) => (
                              <option key={u.valor} value={u.valor}>{labelUnidade(u.valor)}</option>
                            ))}
                          </select>
                          {s.unidade_medida && s.unidade_medida !== 'g' && (
                            <input
                              type="number"
                              step="any"
                              value={s.quantidade_medida ?? ''}
                              onChange={(e) => handleQuantidadeMedidaChange(s.id, e.target.value)}
                              onBlur={(e) => handleQuantidadeMedidaBlur(s.id, e.target.value)}
                              className="w-10 px-1 py-0.5 border border-gray-200 dark:border-slate-700 rounded text-right text-[11px] bg-transparent outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          )}
                        </div>
                      </td>
                      <td className="text-right">{fmt(l.proteina)}g</td>
                      <td className="text-right">{fmt(l.lipidio)}g</td>
                      <td className="text-right">{fmt(l.carbo)}g</td>
                      <td className="text-right">{fmt(l.kcal)}kcal</td>
                      <td className="text-right">
                        <button onClick={() => handleRemoverSubstituto(s.id)} className="text-red-500 hover:underline">remover</button>
                      </td>
                    </tr>
                  )
                })}
                {entradas.length > 1 && (
                  <>
                    <tr className="text-gray-500 dark:text-slate-400 font-semibold border-t border-gray-100 dark:border-slate-800">
                      <td className="py-2">Média</td>
                      <td className="text-right">{fmt(media('quantidade'))}g</td>
                      <td></td>
                      <td className="text-right">{fmt(media('proteina'))}g</td>
                      <td className="text-right">{fmt(media('lipidio'))}g</td>
                      <td className="text-right">{fmt(media('carbo'))}g</td>
                      <td className="text-right">{fmt(media('kcal'))}kcal</td>
                      <td></td>
                    </tr>
                    <tr className="text-gray-400 dark:text-slate-500">
                      <td className="py-1">Desvio padrão</td>
                      <td className="text-right">± {fmt(desvio('quantidade'))}g</td>
                      <td></td>
                      <td className="text-right">± {fmt(desvio('proteina'))}g</td>
                      <td className="text-right">± {fmt(desvio('lipidio'))}g</td>
                      <td className="text-right">± {fmt(desvio('carbo'))}g</td>
                      <td className="text-right">± {fmt(desvio('kcal'))}kcal</td>
                      <td></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {mostrarForm ? (
            <BuscarSubstitutoForm onSelecionar={handleAdicionarSubstituto} onCancelar={() => setMostrarForm(false)} />
          ) : (
            <button
              onClick={() => setMostrarForm(true)}
              className="text-xs font-semibold text-primary-600 hover:underline"
            >
              + Adicionar substituto
            </button>
          )}
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={onFechar}
            className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal genérico "Salvar como modelo" — só pede o título; o conteúdo em si
// (itens da refeição, ou refeições+itens do plano) já está pronto no
// chamador antes de abrir este modal.
function ModalSalvarModelo({ tituloPadrao, aoConfirmar, aoFechar, saving }) {
  const [titulo, setTitulo] = useState(tituloPadrao || 'Modelo')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-800 dark:text-slate-100">Salvar como modelo</h3>
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Título do modelo
          </label>
          <input
            autoFocus
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={aoFechar}
            className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => aoConfirmar(titulo.trim() || tituloPadrao || 'Modelo')}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar modelo'}
          </button>
        </div>
      </div>
    </div>
  )
}

function OpcaoCard({ refeicaoId, opcaoNumero, itens, onItemExcluido, onItemAdicionado, onItemAtualizado, onAbrirSubstitutos, mostrarFormInicial, aoFecharForm, onDuplicar }) {
  const [mostrarForm, setMostrarForm] = useState(!!mostrarFormInicial)
  const [mostrarFormGrupo, setMostrarFormGrupo] = useState(false)
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
        {itens.map((item) => (
          <ItemLinha
            key={item.id}
            item={item}
            onExcluir={handleExcluirItem}
            onRenomear={(itemId, valor) => onItemAtualizado(itemId, { nome_customizado: valor })}
            onAbrirSubstitutos={onAbrirSubstitutos}
            onAtualizarQuantidade={onItemAtualizado}
          />
        ))}
      </ul>

      {itens.length > 0 && (
        <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-2">
          P: {fmt(macros.proteina)}g · C: {fmt(macros.carbo)}g · L: {fmt(macros.lipidio)}g · Fibra: {fmt(macros.fibra)}g
        </p>
      )}

      {mostrarForm ? (
        <AdicionarItemForm
          refeicaoId={refeicaoId}
          opcaoNumero={opcaoNumero}
          onItemAdicionado={(item) => { onItemAdicionado(item); }}
          onCancelar={() => { setMostrarForm(false); aoFecharForm?.() }}
        />
      ) : mostrarFormGrupo ? (
        <AdicionarGrupoForm
          refeicaoId={refeicaoId}
          opcaoNumero={opcaoNumero}
          onItemAdicionado={(item) => { onItemAdicionado(item); setMostrarFormGrupo(false); aoFecharForm?.() }}
          onCancelar={() => { setMostrarFormGrupo(false); aoFecharForm?.() }}
        />
      ) : (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarForm(true)}
            className="text-xs font-semibold text-primary-600 hover:underline"
          >
            + Adicionar item
          </button>
          <button
            onClick={() => setMostrarFormGrupo(true)}
            className="text-xs font-semibold text-primary-600 hover:underline"
          >
            + Adicionar grupo
          </button>
        </div>
      )}
    </div>
  )
}

function RefeicaoCard({ refeicao, onAtualizarCampo, onExcluir, onItensChange, onMover, podeSubir, podeDescer, onDuplicarRefeicao, onAbrirSubstitutos, onSalvarComoModelo }) {
  const [novaOpcaoAberta, setNovaOpcaoAberta] = useState(false)
  const [notaAberta, setNotaAberta] = useState(!!refeicao.nota)
  const [seletorImagemAberto, setSeletorImagemAberto] = useState(false)

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

  const handleItemAtualizado = (itemId, patch) => {
    onItensChange(refeicao.itens_refeicao.map((i) => (i.id === itemId ? { ...i, ...patch } : i)))
  }

  const handleDuplicarOpcao = async (opcaoOrigem) => {
    const itensOrigem = refeicao.itens_refeicao.filter((i) => i.opcao_numero === opcaoOrigem)
    if (itensOrigem.length === 0) return

    const novaOpcao = Math.max(...refeicao.itens_refeicao.map((i) => i.opcao_numero)) + 1
    const novosItens = await duplicarItensComSubstitutos(itensOrigem, refeicao.id, () => novaOpcao)
    if (novosItens.length === 0) { alert('Erro ao duplicar opção.'); return }
    onItensChange([...refeicao.itens_refeicao, ...novosItens])
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
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setSeletorImagemAberto(true)}
            title="Imagem de capa da refeição"
            className="p-1.5 rounded transition-colors text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 shrink-0"
          >
            {refeicao.imagem_url ? (
              <img src={refeicao.imagem_url} alt="" className="w-[15px] h-[15px] rounded object-cover" />
            ) : (
              <ImagePlus size={15} />
            )}
          </button>
          <button
            onClick={() => setNotaAberta((v) => !v)}
            title="Nota da refeição (aparece pro paciente)"
            className={`p-1.5 rounded transition-colors ${
              refeicao.nota
                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                : 'text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
          >
            <StickyNote size={15} />
          </button>
          <button
            onClick={() => onSalvarComoModelo(refeicao)}
            title="Salvar como modelo"
            className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
          >
            <Save size={15} />
          </button>
          <button
            onClick={() => onDuplicarRefeicao(refeicao)}
            title="Duplicar refeição"
            className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => onExcluir(refeicao.id)}
            title="Excluir refeição"
            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {notaAberta && (
        <textarea
          value={refeicao.nota || ''}
          onChange={(e) => onAtualizarCampo(refeicao.id, 'nota', e.target.value)}
          placeholder="Nota sobre esta refeição — o paciente vê abaixo dos macros dela"
          rows={2}
          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-xs bg-transparent focus:border-primary-500 outline-none text-gray-700 dark:text-slate-300 resize-none"
        />
      )}

      <div className="flex flex-wrap gap-3">
        {opcoesParaExibir.map((n) => (
          <OpcaoCard
            key={n}
            refeicaoId={refeicao.id}
            opcaoNumero={n}
            itens={refeicao.itens_refeicao.filter((i) => i.opcao_numero === n)}
            onItemAdicionado={handleItemAdicionado}
            onItemExcluido={handleItemExcluido}
            onItemAtualizado={handleItemAtualizado}
            onAbrirSubstitutos={onAbrirSubstitutos}
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
            onItemAtualizado={handleItemAtualizado}
            onAbrirSubstitutos={onAbrirSubstitutos}
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

      {seletorImagemAberto && (
        <SeletorImagem
          aoFechar={() => setSeletorImagemAberto(false)}
          aoSelecionar={(url) => onAtualizarCampo(refeicao.id, 'imagem_url', url)}
        />
      )}
    </div>
  )
}

// Modo alternativo pro plano: sem refeições/itens/cálculo de macros, só
// título + texto livre (mesmo componente de edição já usado em Orientações
// Nutricionais). A visibilidade pro paciente continua no toggle da lista de
// planos — aqui só cuida do conteúdo.
function BlocoQualitativo({ plano, onAtualizado, onExcluir }) {
  const [titulo, setTitulo] = useState(plano.titulo || 'Plano Alimentar')
  const [conteudo, setConteudo] = useState(plano.conteudo || '')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    setTitulo(plano.titulo || 'Plano Alimentar')
    setConteudo(plano.conteudo || '')
  }, [plano.id])

  const handleSalvar = async () => {
    setSalvando(true)
    const { error } = await supabase
      .from('planos_alimentares')
      .update({ titulo: titulo || 'Plano Alimentar', conteudo: sanitizarHtmlEditor(conteudo) })
      .eq('id', plano.id)
    setSalvando(false)
    if (error) { alert('Erro ao salvar plano: ' + error.message); return }
    onAtualizado()
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex justify-between items-center gap-2">
        <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          📝 Plano Qualitativo — sem cálculo de macros
        </p>
        <button onClick={onExcluir} className="text-xs font-semibold text-red-600 hover:underline shrink-0">
          Excluir plano
        </button>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
          Título
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
          Prescrição (texto livre)
        </label>
        <RichTextEditor initialHtml={conteudo} onChange={setConteudo} />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}

// Monta as zonas coloridas da régua de um micronutriente (0 até um teto
// visual) a partir da linha de dri_referencias: vermelho até o EAR (ou até
// o AI/RDA quando não há EAR — só existe AI), amarelo do EAR até o AI/RDA,
// verde do AI/RDA até o UL, vermelho acima do UL. Teto = UL*1,15 (folga
// visual) ou AI/RDA*2 quando o nutriente não tem UL estabelecido.
function calcularBarraMicronutriente(ref, total) {
  const valor = Number(ref.valor) || 0
  const ear = ref.ear != null ? Number(ref.ear) : null
  const ul = ref.ul != null ? Number(ref.ul) : null
  const teto = ul ? ul * 1.15 : valor * 2 || 1
  const pct = (v) => Math.max(0, Math.min(100, (v / teto) * 100))
  const pctEar = ear != null ? pct(ear) : null
  const pctValor = pct(valor)
  const pctUl = ul != null ? pct(ul) : null

  const segmentos = []
  if (pctEar != null) {
    segmentos.push({ cor: 'bg-red-300 dark:bg-red-900/60', largura: pctEar })
    segmentos.push({ cor: 'bg-amber-300 dark:bg-amber-800/70', largura: Math.max(0, pctValor - pctEar) })
  } else {
    segmentos.push({ cor: 'bg-amber-300 dark:bg-amber-800/70', largura: pctValor })
  }
  segmentos.push({ cor: 'bg-emerald-300 dark:bg-emerald-800/70', largura: Math.max(0, (pctUl ?? 100) - pctValor) })
  if (pctUl != null) {
    segmentos.push({ cor: 'bg-red-300 dark:bg-red-900/60', largura: Math.max(0, 100 - pctUl) })
  }
  return { segmentos, marcador: pct(total) }
}

// Texto do tooltip (atributo title nativo — só aparece pro nutricionista,
// a régua inteira não é renderizada na tela do paciente).
function textoTooltipMicronutriente(ref, total) {
  const partes = [`${ref.nutriente} — plano: ${fmt(total)} ${ref.unidade}`]
  if (ref.ear != null) partes.push(`necessidade média (EAR): ${fmt(ref.ear)} ${ref.unidade}`)
  partes.push(`${ref.eh_ai ? 'ingestão adequada (AI)' : 'recomendado (RDA)'}: ${fmt(ref.valor)} ${ref.unidade}`)
  partes.push(ref.ul != null ? `limite superior (UL): ${fmt(ref.ul)} ${ref.unidade}` : 'sem limite superior (UL) estabelecido pelo IOM')
  let veredito
  if (ref.ear != null && total < ref.ear) veredito = 'abaixo da necessidade média — risco alto de inadequação'
  else if (total < ref.valor) veredito = `abaixo do ${ref.eh_ai ? 'AI' : 'RDA'} — pode não atender à maioria dos indivíduos`
  else if (ref.ul != null && total > ref.ul) veredito = 'acima do limite superior — risco de excesso'
  else veredito = 'dentro da faixa adequada'
  return partes.join(' · ') + '. ' + veredito.charAt(0).toUpperCase() + veredito.slice(1) + '.'
}

function LinhaMicronutriente({ referencia, total, temDado }) {
  if (!referencia) return null
  if (!temDado) {
    return (
      <div
        className="py-1.5 opacity-60"
        title={`${referencia.nutriente} — nenhum alimento deste plano tem esse nutriente cadastrado na base (comum pra Cromo, Iodo e Biotina — o USDA raramente reporta esses três). Não é o mesmo que "0" — é dado ausente, não confundir com ingestão zero.`}
      >
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{referencia.nutriente}</span>
          <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 italic">sem dado na base</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-slate-800 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(148,163,184,0.35)_4px,rgba(148,163,184,0.35)_8px)]" />
      </div>
    )
  }
  const barra = calcularBarraMicronutriente(referencia, total)
  return (
    <div className="py-1.5" title={textoTooltipMicronutriente(referencia, total)}>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{referencia.nutriente}</span>
        <span className="text-xs font-black text-gray-800 dark:text-slate-100">
          {fmt(total)} <span className="font-normal text-gray-400 dark:text-slate-500">/ {fmt(referencia.valor)} {referencia.unidade} ({referencia.eh_ai ? 'AI' : 'RDA'})</span>
        </span>
      </div>
      <div className="relative h-2.5 w-full rounded-full overflow-hidden flex bg-gray-100 dark:bg-slate-800">
        {barra.segmentos.map((s, i) => (
          <div key={i} className={s.cor} style={{ width: `${s.largura}%` }} />
        ))}
        <div
          className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-gray-800 dark:bg-white rounded-full"
          style={{ left: `calc(${barra.marcador}% - 1px)` }}
        />
      </div>
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
  const [driReferencias, setDriReferencias] = useState([])
  const [microExpandido, setMicroExpandido] = useState(true)

  const [showModalNovoPlano, setShowModalNovoPlano] = useState(false)
  const [editingPlanoId, setEditingPlanoId] = useState(null)
  const [formPlano, setFormPlano] = useState(CAMPOS_PLANO_VAZIOS)
  const [salvandoPlano, setSalvandoPlano] = useState(false)
  const [pesoOverride, setPesoOverride] = useState('')
  const [modoMeta, setModoMeta] = useState('g_kg') // 'g_kg' | 'percentual'
  const [modoNovoPlano, setModoNovoPlano] = useState('quantitativo') // 'quantitativo' | 'qualitativo'
  const [modalSubstitutos, setModalSubstitutos] = useState(null) // { refeicaoId, item } | null
  const [showGeradorPdf, setShowGeradorPdf] = useState(false)

  const [modelosRefeicoes, setModelosRefeicoes] = useState([])
  const [modelosPlanos, setModelosPlanos] = useState([])
  const [modalModeloRefeicao, setModalModeloRefeicao] = useState(null) // refeição selecionada | null
  const [modalModeloPlano, setModalModeloPlano] = useState(false)
  const [salvandoModelo, setSalvandoModelo] = useState(false)
  const [modeloBasePlanoId, setModeloBasePlanoId] = useState('')

  const pesoParaConversao = pesoOverride !== '' ? Number(pesoOverride) : (pesoAtual ? Number(pesoAtual) : null)

  const carregarPaciente = async () => {
    const { data } = await supabase.from('pacientes').select('*').eq('id', id).maybeSingle()
    setPaciente(data || null)
    return data || null
  }

  // Busca as 27 linhas de dri_referencias (uma por micronutriente) da
  // faixa de sexo/idade do paciente, pra comparar contra o plano.
  const carregarDriReferencias = async (pacienteData) => {
    const faixa = faixaDri(calcularIdade(pacienteData?.data_nascimento), pacienteData?.sexo)
    if (!faixa) { setDriReferencias([]); return }
    const { data } = await supabase
      .from('dri_referencias')
      .select('*')
      .eq('sexo', pacienteData.sexo)
      .eq('idade_min', faixa.idade_min)
    setDriReferencias(data || [])
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
      .select('*, itens_refeicao(*, tabela_alimentos(*), substitutos_item(*, tabela_alimentos(*)))')
      .eq('id_plano', planoId)
      .order('ordem')

    if (!error) setRefeicoes(data || [])
    setCarregandoRefeicoes(false)
  }

  const carregarModelos = async () => {
    const { data: mr } = await supabase.from('modelos_refeicoes').select('*').order('titulo')
    setModelosRefeicoes(mr || [])
    const { data: mp } = await supabase.from('modelos_planos').select('*').order('titulo')
    setModelosPlanos(mp || [])
  }

  useEffect(() => {
    const iniciar = async () => {
      setLoading(true)
      const pacienteData = await carregarPaciente()
      const listaPlanos = await carregarPlanos()
      await carregarDadosRecentes()
      await carregarModelos()
      await carregarDriReferencias(pacienteData)

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
    setModoNovoPlano('quantitativo')
    setModeloBasePlanoId('')
    setFormPlano({
      ...CAMPOS_PLANO_VAZIOS,
      vet_target: vetSugerido ? String(Math.round(vetSugerido)) : '',
    })
    setShowModalNovoPlano(true)
  }

  // Prefila título/metas a partir de um modelo de plano; a cópia das
  // refeições/itens em si só acontece depois, ao efetivamente criar o plano
  // (handleSalvarPlano), pra não duplicar nada se o usuário cancelar.
  const handleEscolherModeloPlano = (valor) => {
    setModeloBasePlanoId(valor)
    const modelo = modelosPlanos.find((m) => String(m.id) === valor)
    if (!modelo) return
    const usaPercentual = modelo.proteina_target_pct != null || modelo.carbo_target_pct != null || modelo.lipidio_target_pct != null
    setModoMeta(usaPercentual ? 'percentual' : 'g_kg')
    setFormPlano((prev) => ({
      ...prev,
      titulo: modelo.titulo,
      vet_target: modelo.vet_target ?? '',
      proteina_target_g_kg: modelo.proteina_target_g_kg ?? '',
      carbo_target_g_kg: modelo.carbo_target_g_kg ?? '',
      lipidio_target_g_kg: modelo.lipidio_target_g_kg ?? '',
      proteina_target_pct: modelo.proteina_target_pct ?? '',
      carbo_target_pct: modelo.carbo_target_pct ?? '',
      lipidio_target_pct: modelo.lipidio_target_pct ?? '',
    }))
  }

  // Copia as refeições + itens de um modelo de plano pro plano recém-criado.
  const copiarModeloParaPlano = async (modeloId, novoPlanoId) => {
    const { data: refsModelo } = await supabase
      .from('modelos_planos_refeicoes')
      .select('*, modelos_planos_itens(*, modelos_planos_itens_substitutos(*))')
      .eq('id_modelo_plano', modeloId)
      .order('ordem')

    for (const refModelo of refsModelo || []) {
      const { data: novaRefeicao, error } = await supabase
        .from('refeicoes_prescritas')
        .insert({
          id_plano: novoPlanoId,
          horario: refModelo.horario,
          nome_refeicao: refModelo.nome_refeicao,
          nota: refModelo.nota || null,
          ordem: refModelo.ordem,
        })
        .select()
        .single()
      if (error || !novaRefeicao) continue

      const itensModelo = refModelo.modelos_planos_itens || []
      if (itensModelo.length > 0) {
        await Promise.all(
          itensModelo.map(async (i) => {
            const { data: novoItem } = await supabase
              .from('itens_refeicao')
              .insert({
                id_refeicao: novaRefeicao.id,
                id_alimento: i.id_alimento,
                quantidade_g: i.quantidade_g,
                opcao_numero: i.opcao_numero,
                nome_customizado: i.nome_customizado,
                unidade_medida: i.unidade_medida,
                quantidade_medida: i.quantidade_medida,
              })
              .select()
              .single()

            const subsModelo = i.modelos_planos_itens_substitutos || []
            if (novoItem && subsModelo.length > 0) {
              await supabase.from('substitutos_item').insert(
                subsModelo.map((s) => ({
                  id_item_original: novoItem.id,
                  id_alimento: s.id_alimento,
                  quantidade_g: s.quantidade_g,
                  unidade_medida: s.unidade_medida || null,
                  quantidade_medida: s.quantidade_medida || null,
                  ordem: s.ordem,
                }))
              )
            }
          })
        )
      }
    }
  }

  const handleSalvarRefeicaoComoModelo = async (titulo) => {
    const refeicao = modalModeloRefeicao
    if (!refeicao) return
    setSalvandoModelo(true)

    const { data: modelo, error } = await supabase
      .from('modelos_refeicoes')
      .insert({ id_avaliador: userId, titulo: titulo || refeicao.nome_refeicao, nota: refeicao.nota || null })
      .select()
      .single()

    if (error || !modelo) {
      setSalvandoModelo(false)
      alert('Erro ao salvar modelo: ' + error?.message)
      return
    }

    await Promise.all(
      refeicao.itens_refeicao.map(async (i) => {
        const { data: itemModelo } = await supabase
          .from('modelos_refeicoes_itens')
          .insert({
            id_modelo: modelo.id,
            id_alimento: i.id_alimento,
            quantidade_g: i.quantidade_g,
            opcao_numero: i.opcao_numero,
            nome_customizado: i.nome_customizado || null,
            unidade_medida: i.unidade_medida || null,
            quantidade_medida: i.quantidade_medida || null,
          })
          .select()
          .single()

        const subsOrigem = i.substitutos_item || []
        if (itemModelo && subsOrigem.length > 0) {
          await supabase.from('modelos_refeicoes_itens_substitutos').insert(
            subsOrigem.map((s) => ({
              id_item_modelo: itemModelo.id,
              id_alimento: s.id_alimento,
              quantidade_g: s.quantidade_g,
              unidade_medida: s.unidade_medida || null,
              quantidade_medida: s.quantidade_medida || null,
              ordem: s.ordem,
            }))
          )
        }
      })
    )

    setSalvandoModelo(false)
    setModalModeloRefeicao(null)
    await carregarModelos()
  }

  const handleUsarModeloRefeicao = async (modeloIdStr) => {
    const modeloId = Number(modeloIdStr)
    const modelo = modelosRefeicoes.find((m) => m.id === modeloId)
    if (!modelo) return

    const { data: itensModelo } = await supabase
      .from('modelos_refeicoes_itens')
      .select('*, modelos_refeicoes_itens_substitutos(*)')
      .eq('id_modelo', modeloId)

    const { data: novaRefeicao, error } = await supabase
      .from('refeicoes_prescritas')
      .insert({ id_plano: planoSelecionadoId, nome_refeicao: modelo.titulo, nota: modelo.nota || null, ordem: refeicoes.length })
      .select('*, itens_refeicao(*, tabela_alimentos(*))')
      .single()

    if (error) { alert('Erro ao usar modelo: ' + error.message); return }

    let itensCriados = []
    if (itensModelo && itensModelo.length > 0) {
      const resultados = await Promise.all(
        itensModelo.map(async (i) => {
          const { data: novoItem } = await supabase
            .from('itens_refeicao')
            .insert({
              id_refeicao: novaRefeicao.id,
              id_alimento: i.id_alimento,
              quantidade_g: i.quantidade_g,
              opcao_numero: i.opcao_numero,
              nome_customizado: i.nome_customizado,
              unidade_medida: i.unidade_medida,
              quantidade_medida: i.quantidade_medida,
            })
            .select('*, tabela_alimentos(*)')
            .single()

          if (!novoItem) return null

          let substitutos = []
          const subsModelo = i.modelos_refeicoes_itens_substitutos || []
          if (subsModelo.length > 0) {
            const { data: novosSubs } = await supabase
              .from('substitutos_item')
              .insert(subsModelo.map((s) => ({
                id_item_original: novoItem.id,
                id_alimento: s.id_alimento,
                quantidade_g: s.quantidade_g,
                unidade_medida: s.unidade_medida || null,
                quantidade_medida: s.quantidade_medida || null,
                ordem: s.ordem,
              })))
              .select('*, tabela_alimentos(*)')
            substitutos = novosSubs || []
          }

          return { ...novoItem, substitutos_item: substitutos }
        })
      )
      itensCriados = resultados.filter(Boolean)
    }

    setRefeicoes((prev) => [...prev, { ...novaRefeicao, itens_refeicao: itensCriados }])
  }

  const handleSalvarPlanoComoModelo = async (titulo) => {
    if (!planoSelecionado) return
    setSalvandoModelo(true)

    const { data: modelo, error } = await supabase
      .from('modelos_planos')
      .insert({
        id_avaliador: userId,
        titulo: titulo || planoSelecionado.titulo,
        vet_target: planoSelecionado.vet_target,
        proteina_target_g_kg: planoSelecionado.proteina_target_g_kg,
        carbo_target_g_kg: planoSelecionado.carbo_target_g_kg,
        lipidio_target_g_kg: planoSelecionado.lipidio_target_g_kg,
        proteina_target_pct: planoSelecionado.proteina_target_pct,
        carbo_target_pct: planoSelecionado.carbo_target_pct,
        lipidio_target_pct: planoSelecionado.lipidio_target_pct,
      })
      .select()
      .single()

    if (error || !modelo) {
      setSalvandoModelo(false)
      alert('Erro ao salvar modelo: ' + error?.message)
      return
    }

    const listaOrdenada = [...refeicoes].sort(compararRefeicoes)
    for (const refeicao of listaOrdenada) {
      const { data: modeloRefeicao, error: errRef } = await supabase
        .from('modelos_planos_refeicoes')
        .insert({
          id_modelo_plano: modelo.id,
          horario: refeicao.horario,
          nome_refeicao: refeicao.nome_refeicao,
          nota: refeicao.nota || null,
          ordem: refeicao.ordem,
        })
        .select()
        .single()
      if (errRef || !modeloRefeicao) continue

      await Promise.all(
        refeicao.itens_refeicao.map(async (i) => {
          const { data: itemModelo } = await supabase
            .from('modelos_planos_itens')
            .insert({
              id_modelo_refeicao: modeloRefeicao.id,
              id_alimento: i.id_alimento,
              quantidade_g: i.quantidade_g,
              opcao_numero: i.opcao_numero,
              nome_customizado: i.nome_customizado || null,
              unidade_medida: i.unidade_medida || null,
              quantidade_medida: i.quantidade_medida || null,
            })
            .select()
            .single()

          const subsOrigem = i.substitutos_item || []
          if (itemModelo && subsOrigem.length > 0) {
            await supabase.from('modelos_planos_itens_substitutos').insert(
              subsOrigem.map((s) => ({
                id_item_modelo: itemModelo.id,
                id_alimento: s.id_alimento,
                quantidade_g: s.quantidade_g,
                unidade_medida: s.unidade_medida || null,
                quantidade_medida: s.quantidade_medida || null,
                ordem: s.ordem,
              }))
            )
          }
        })
      )
    }

    setSalvandoModelo(false)
    setModalModeloPlano(false)
    await carregarModelos()
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

    if (!editingPlanoId && modoNovoPlano === 'qualitativo') {
      const { data, error } = await supabase
        .from('planos_alimentares')
        .insert({
          id_paciente: id,
          id_avaliador: userId,
          id_avaliacao: idAvaliacaoRecente || null,
          titulo: formPlano.titulo || 'Plano Alimentar',
          modo: 'qualitativo',
          ativo: true,
        })
        .select()
        .single()

      setSalvandoPlano(false)
      if (error) { alert('Erro ao criar plano: ' + error.message); return }
      setShowModalNovoPlano(false)
      await carregarPlanos()
      setPlanoSelecionadoId(data.id)
      return
    }

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

    const { data, error } = await supabase
      .from('planos_alimentares')
      .insert({
        id_paciente: id,
        id_avaliador: userId,
        id_avaliacao: idAvaliacaoRecente || null,
        ...payload,
        modo: 'quantitativo',
        ativo: true,
      })
      .select()
      .single()

    setSalvandoPlano(false)
    if (error) {
      alert('Erro ao criar plano: ' + error.message)
      return
    }

    if (modeloBasePlanoId) {
      await copiarModeloParaPlano(modeloBasePlanoId, data.id)
      setModeloBasePlanoId('')
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

  const toggleVisivelPlano = async (plano) => {
    const novoValor = !plano.ativo
    const { error } = await supabase.from('planos_alimentares').update({ ativo: novoValor }).eq('id', plano.id)
    if (error) { alert('Erro ao atualizar visibilidade do plano: ' + error.message); return }
    setPlanos((prev) => prev.map((p) => (p.id === plano.id ? { ...p, ativo: novoValor } : p)))
  }

  const toggleMostrarMacros = async (plano) => {
    const novoValor = !plano.mostrar_macros
    const { error } = await supabase.from('planos_alimentares').update({ mostrar_macros: novoValor }).eq('id', plano.id)
    if (error) { alert('Erro ao atualizar exibição de macros do plano: ' + error.message); return }
    setPlanos((prev) => prev.map((p) => (p.id === plano.id ? { ...p, mostrar_macros: novoValor } : p)))
  }

  const toggleMostrarMicronutrientes = async (plano) => {
    const novoValor = !plano.mostrar_micronutrientes
    const { error } = await supabase.from('planos_alimentares').update({ mostrar_micronutrientes: novoValor }).eq('id', plano.id)
    if (error) { alert('Erro ao atualizar exibição de micronutrientes do plano: ' + error.message); return }
    setPlanos((prev) => prev.map((p) => (p.id === plano.id ? { ...p, mostrar_micronutrientes: novoValor } : p)))
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
        nota: refeicao.nota || null,
        ordem: refeicoes.length,
      })
      .select('*, itens_refeicao(*, tabela_alimentos(*), substitutos_item(*, tabela_alimentos(*)))')
      .single()

    if (erroRefeicao) { alert('Erro ao duplicar refeição: ' + erroRefeicao.message); return }

    if (refeicao.itens_refeicao.length > 0) {
      novaRefeicao.itens_refeicao = await duplicarItensComSubstitutos(refeicao.itens_refeicao, novaRefeicao.id)
    }

    setRefeicoes((prev) => [...prev, novaRefeicao])
  }

  const handleAtualizarSubstitutos = (refeicaoId, itemId, substitutos) => {
    setRefeicoes((prev) =>
      prev.map((r) =>
        r.id !== refeicaoId
          ? r
          : { ...r, itens_refeicao: r.itens_refeicao.map((i) => (i.id === itemId ? { ...i, substitutos_item: substitutos } : i)) }
      )
    )
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

  // Só troca 'ordem' entre vizinhos de MESMO horário — quando os horários
  // diferem, a posição já é ditada pela ordenação por horário sozinha
  // (refeicoesOrdenadas, no render), então as setas ficam desabilitadas.
  const handleMoverRefeicao = async (refeicaoId, direcao) => {
    const ordenadas = [...refeicoes].sort(compararRefeicoes)
    const idx = ordenadas.findIndex((r) => r.id === refeicaoId)
    const alvoIdx = direcao === 'cima' ? idx - 1 : idx + 1
    if (alvoIdx < 0 || alvoIdx >= ordenadas.length) return

    const atual = ordenadas[idx]
    const alvo = ordenadas[alvoIdx]
    if (atual.horario !== alvo.horario) return

    setRefeicoes((prev) => {
      const atualizadas = prev.map((r) => {
        if (r.id === atual.id) return { ...r, ordem: alvo.ordem }
        if (r.id === alvo.id) return { ...r, ordem: atual.ordem }
        return r
      })
      return atualizadas.sort(compararRefeicoes)
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
  const fibraRecomendada = calcularFibraRecomendada(planoSelecionado?.vet_target)

  // Consumido em g/kg — linha secundária, pra comparar na mesma unidade da
  // meta (que é digitada em g/kg de peso corporal). Null quando não há peso.
  const gKgAtual = (totalG) => (pesoParaConversao ? totalG / pesoParaConversao : null)
  const fmtGKg = (n) => (Number.isFinite(n) ? n.toFixed(2) : '-')

  // Exibição sempre por horário (sem horário vai pro fim); dentro do mesmo
  // horário, a ordem manual (setas ▲▼) continua valendo como desempate.
  const refeicoesOrdenadas = [...refeicoes].sort(compararRefeicoes)

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
      <SidebarPaciente paciente={paciente} itemAtivo={itemAtivo} onSelecionarItem={setItemAtivo} />

      <div className="flex-1 min-w-0 space-y-4">
        <>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Plano Alimentar — {paciente.nome_completo}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Prescrição de refeições e itens com cálculo de macros</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setShowGeradorPdf(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileDown size={15} /> Gerar PDF
            </button>
            <button
              onClick={abrirNovoPlano}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors"
            >
              + Novo Plano
            </button>
          </div>
        </div>

        {planos.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhum plano alimentar criado ainda.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {planos.map((p) => (
                <div key={p.id} className="flex items-center gap-1">
                  <button
                    onClick={() => setPlanoSelecionadoId(p.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      planoSelecionadoId === p.id
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p.modo === 'qualitativo' ? '📝 ' : ''}{p.titulo} · {formatarData(p.created_at)}
                  </button>
                  <InterruptorVisibilidade
                    ativo={p.ativo}
                    onToggle={(e) => { e.stopPropagation(); toggleVisivelPlano(p) }}
                    titulo={p.ativo ? 'Visível pro paciente — clique pra esconder' : 'Oculto pro paciente — clique pra mostrar'}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {planoSelecionado && planoSelecionado.modo === 'qualitativo' && (
          <BlocoQualitativo plano={planoSelecionado} onAtualizado={carregarPlanos} onExcluir={handleExcluirPlano} />
        )}

        {planoSelecionado && planoSelecionado.modo !== 'qualitativo' && (
          <>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Meta vs. Calculado (Opção 1 de cada refeição)
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 dark:text-slate-400">Macros pro paciente:</span>
                    <InterruptorVisibilidade
                      ativo={planoSelecionado.mostrar_macros !== false}
                      onToggle={() => toggleMostrarMacros(planoSelecionado)}
                      titulo={
                        planoSelecionado.mostrar_macros !== false
                          ? 'Paciente vê calorias e macros de cada refeição e do plano — clique pra esconder'
                          : 'Paciente vê só a lista de refeições, sem números — clique pra mostrar macros'
                      }
                    />
                  </div>
                  <button
                    onClick={() => setModalModeloPlano(true)}
                    className="text-xs font-semibold text-primary-600 hover:underline"
                  >
                    Salvar como modelo
                  </button>
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
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
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
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">
                    {fmtGKg(gKgAtual(totalDia.proteina))}
                    {planoSelecionado.proteina_target_g_kg ? ` / ${fmtGKg(planoSelecionado.proteina_target_g_kg)}` : ''} g/kg
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-slate-500 text-xs">Carboidrato</p>
                  <p className="font-black text-gray-800 dark:text-slate-100">
                    {fmt(totalDia.carbo)} {metaCarboG ? `/ ${fmt(metaCarboG)}` : ''} g
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">
                    {fmtGKg(gKgAtual(totalDia.carbo))}
                    {planoSelecionado.carbo_target_g_kg ? ` / ${fmtGKg(planoSelecionado.carbo_target_g_kg)}` : ''} g/kg
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-slate-500 text-xs">Lipídio</p>
                  <p className="font-black text-gray-800 dark:text-slate-100">
                    {fmt(totalDia.lipidio)} {metaLipidioG ? `/ ${fmt(metaLipidioG)}` : ''} g
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">
                    {fmtGKg(gKgAtual(totalDia.lipidio))}
                    {planoSelecionado.lipidio_target_g_kg ? ` / ${fmtGKg(planoSelecionado.lipidio_target_g_kg)}` : ''} g/kg
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 dark:text-slate-500 text-xs">Fibra</p>
                  <p className="font-black text-gray-800 dark:text-slate-100">
                    {fmt(totalDia.fibra)} {fibraRecomendada ? `/ ${fmt(fibraRecomendada)}` : ''} g
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500">
                    {fibraRecomendada ? 'Ref: 14g/1000kcal' : 'Defina o VET pra calcular a referência'}
                  </p>
                </div>
              </div>
              {!pesoParaConversao && (planoSelecionado.proteina_target_g_kg || planoSelecionado.carbo_target_g_kg || planoSelecionado.lipidio_target_g_kg) && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">
                  Sem peso de avaliação recente pra converter metas g/kg em gramas.
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setMicroExpandido((v) => !v)}
                  className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-slate-300"
                >
                  {microExpandido ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  Micronutrientes vs. Referências DRI (Opção 1 de cada refeição)
                  <span className="normal-case font-semibold text-primary-600 ml-1">
                    {microExpandido ? '— esconder' : '— mostrar'}
                  </span>
                </button>
                {driReferencias.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 dark:text-slate-400">Pro paciente:</span>
                    <InterruptorVisibilidade
                      ativo={!!planoSelecionado.mostrar_micronutrientes}
                      onToggle={() => toggleMostrarMicronutrientes(planoSelecionado)}
                      textoAtivo="Ver"
                      textoInativo="Não ver"
                      titulo={
                        planoSelecionado.mostrar_micronutrientes
                          ? 'Paciente vê o total de cada vitamina/mineral do plano — clique pra esconder'
                          : 'Paciente não vê micronutrientes — clique pra mostrar (só os números, sem a régua)'
                      }
                    />
                  </div>
                )}
              </div>
              {microExpandido && (
                driReferencias.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    Cadastre data de nascimento e sexo do paciente (19 a 120 anos) pra habilitar essa comparação.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                    {MICRONUTRIENTES.map((m) => {
                      const referencia = driReferencias.find((d) => d.chave === m.chave)
                      return (
                        <LinhaMicronutriente
                          key={m.chave}
                          referencia={referencia}
                          total={totalDia.micronutrientes[m.chave] || 0}
                          temDado={!!totalDia.temDado[m.chave]}
                        />
                      )
                    })}
                  </div>
                )
              )}
            </div>

            {carregandoRefeicoes ? (
              <p className="text-sm text-primary-600 font-semibold text-center py-6 animate-pulse">Carregando refeições...</p>
            ) : (
              <div className="space-y-3">
                {refeicoesOrdenadas.map((refeicao, index) => (
                  <RefeicaoCard
                    key={refeicao.id}
                    refeicao={refeicao}
                    onAtualizarCampo={handleAtualizarCampoRefeicao}
                    onExcluir={handleExcluirRefeicao}
                    onDuplicarRefeicao={handleDuplicarRefeicao}
                    onItensChange={(novosItens) => handleItensChange(refeicao.id, novosItens)}
                    onMover={(direcao) => handleMoverRefeicao(refeicao.id, direcao)}
                    onAbrirSubstitutos={(item) => setModalSubstitutos({ refeicaoId: refeicao.id, item })}
                    onSalvarComoModelo={setModalModeloRefeicao}
                    podeSubir={index > 0 && refeicoesOrdenadas[index - 1].horario === refeicao.horario}
                    podeDescer={index < refeicoesOrdenadas.length - 1 && refeicoesOrdenadas[index + 1].horario === refeicao.horario}
                  />
                ))}

                <div className="flex gap-2">
                  <button
                    onClick={handleNovaRefeicao}
                    className="flex-1 py-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-gray-500 dark:text-slate-400 hover:border-primary-400 hover:text-primary-600 transition-colors"
                  >
                    + Nova Refeição
                  </button>
                  {modelosRefeicoes.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) handleUsarModeloRefeicao(e.target.value) }}
                      title="Usar modelo de refeição"
                      className="px-3 py-3 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-500 dark:text-slate-400 bg-transparent outline-none focus:border-primary-400 hover:border-primary-400 hover:text-primary-600 transition-colors max-w-[45%]"
                    >
                      <option value="">Usar modelo...</option>
                      {modelosRefeicoes.map((m) => (
                        <option key={m.id} value={m.id}>{m.titulo}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            <p className="text-[11px] text-gray-400 dark:text-slate-500 text-center">
              O total do dia soma só a Opção 1 de cada refeição — as demais opções são alternativas de substituição.
            </p>
          </>
        )}
        </>
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
              {!editingPlanoId && (
                <p className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-2">
                  O novo plano já nasce visível pro paciente. Use o Liga/Desliga na lista de planos pra controlar quais ficam visíveis.
                </p>
              )}

              {!editingPlanoId && (
                <div>
                  <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setModoNovoPlano('quantitativo')}
                      className={`flex-1 py-1.5 rounded-md transition-colors ${modoNovoPlano === 'quantitativo' ? 'bg-white dark:bg-slate-900 text-primary-600 shadow' : 'text-gray-500 dark:text-slate-400'}`}
                    >
                      📊 Quantitativo
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoNovoPlano('qualitativo')}
                      className={`flex-1 py-1.5 rounded-md transition-colors ${modoNovoPlano === 'qualitativo' ? 'bg-white dark:bg-slate-900 text-primary-600 shadow' : 'text-gray-500 dark:text-slate-400'}`}
                    >
                      📝 Qualitativo
                    </button>
                  </div>
                  {modoNovoPlano === 'qualitativo' && (
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1.5">
                      Sem refeições nem cálculo de macros — depois de criar, você escreve a prescrição em texto livre.
                    </p>
                  )}
                </div>
              )}

              {!editingPlanoId && modoNovoPlano === 'quantitativo' && modelosPlanos.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Começar a partir de um modelo (opcional)
                  </label>
                  <select
                    value={modeloBasePlanoId}
                    onChange={(e) => handleEscolherModeloPlano(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Nenhum — plano em branco</option>
                    {modelosPlanos.map((m) => (
                      <option key={m.id} value={m.id}>{m.titulo}</option>
                    ))}
                  </select>
                </div>
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

              {(editingPlanoId || modoNovoPlano === 'quantitativo') && (
              <>
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

      {modalSubstitutos && (
        <SubstitutosModal
          item={modalSubstitutos.item}
          onFechar={() => setModalSubstitutos(null)}
          onSubstitutosChange={(novos) => handleAtualizarSubstitutos(modalSubstitutos.refeicaoId, modalSubstitutos.item.id, novos)}
        />
      )}

      {modalModeloRefeicao && (
        <ModalSalvarModelo
          tituloPadrao={modalModeloRefeicao.nome_refeicao}
          saving={salvandoModelo}
          aoConfirmar={handleSalvarRefeicaoComoModelo}
          aoFechar={() => setModalModeloRefeicao(null)}
        />
      )}

      {modalModeloPlano && planoSelecionado && (
        <ModalSalvarModelo
          tituloPadrao={planoSelecionado.titulo}
          saving={salvandoModelo}
          aoConfirmar={handleSalvarPlanoComoModelo}
          aoFechar={() => setModalModeloPlano(false)}
        />
      )}

      {showGeradorPdf && (
        <GeradorPdfNutricional
          paciente={paciente}
          avaliadorUserId={userId}
          aoFechar={() => setShowGeradorPdf(false)}
        />
      )}
    </div>
  )
}
