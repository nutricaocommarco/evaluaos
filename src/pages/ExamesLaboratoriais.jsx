import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from '../components/SidebarPaciente'
import RichTextEditor, { sanitizarHtmlEditor } from '../components/RichTextEditor'
import GeradorPdfSolicitacaoExames from '../components/GeradorPdfSolicitacaoExames'
import { CATALOGO_EXAMES, GRUPOS_CATALOGO } from '../data/catalogoExames'
import { ChevronDown, ChevronRight, FileDown, Eye, Pencil, Bookmark, Trash2, Plus } from 'lucide-react'

const CAMPOS_VAZIOS_SOLICITACAO = { titulo: '1ª Solicitação de exames', conteudo: '', salvarComoModelo: false }

function formatarDataHora(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleString('pt-BR')
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  // data_coleta é "date" puro (sem hora) — evita o desvio de fuso ao
  // converter direto pra Date (que interpretaria como UTC meia-noite).
  const [ano, mes, dia] = dataStr.split('-')
  return `${dia}/${mes}/${ano}`
}

// Classificação é sempre calculada na hora (nunca salva) — o valor obtido
// pode ser texto puro ("Não Reagente", "Indetectável"), não só número.
function classificar(valorObtido, min, max) {
  if (valorObtido == null || valorObtido === '') return null
  const v = parseFloat(String(valorObtido).replace(',', '.'))
  if (!Number.isFinite(v)) return null
  if (min != null && v < min) return 'abaixo'
  if (max != null && v > max) return 'acima'
  return 'normal'
}

const CLASSIFICACAO_ESTILO = {
  abaixo: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  normal: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
  acima: 'text-red-600 bg-red-50 dark:bg-red-900/20',
}
const CLASSIFICACAO_LABEL = { abaixo: 'Abaixo', normal: 'Normal', acima: 'Acima' }

function BadgeClassificacao({ valorObtido, min, max }) {
  const c = classificar(valorObtido, min, max)
  if (!c) return <span className="text-xs text-gray-300 dark:text-slate-600">—</span>
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CLASSIFICACAO_ESTILO[c]}`}>
      {CLASSIFICACAO_LABEL[c]}
    </span>
  )
}

// Autocomplete local (sem round-trip ao banco) sobre CATALOGO_EXAMES —
// só sugere nome/unidade/intervalo padrão; tudo fica editável depois.
function BuscaExameCatalogo({ onSelecionar, onCancelar }) {
  const [busca, setBusca] = useState('')
  const [mostrarLista, setMostrarLista] = useState(true)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickFora = (e) => { if (ref.current && !ref.current.contains(e.target)) onCancelar() }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const termo = busca.trim().toLowerCase()
  const resultados = termo
    ? CATALOGO_EXAMES.filter((e) => e.nome.toLowerCase().includes(termo)).slice(0, 8)
    : []

  const confirmarLivre = () => {
    if (!busca.trim()) return
    onSelecionar({ nome: busca.trim(), unidade: '', min: null, max: null })
  }

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        autoFocus
        value={busca}
        onChange={(e) => { setBusca(e.target.value); setMostrarLista(true) }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); resultados[0] ? onSelecionar(resultados[0]) : confirmarLivre() } }}
        placeholder="Nome do exame..."
        className="w-56 px-2 py-1 border border-gray-300 rounded text-xs outline-none focus:ring-2 focus:ring-primary-500"
      />
      {mostrarLista && busca.trim() && (
        <ul className="absolute z-20 w-64 mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {resultados.map((r) => (
            <li key={r.nome}>
              <button
                type="button"
                onClick={() => onSelecionar(r)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-primary-50 dark:hover:bg-primary-900/20 border-b border-gray-100 dark:border-slate-800 last:border-0"
              >
                <span className="font-semibold">{r.nome}</span>
                <span className="text-gray-400 dark:text-slate-500 ml-2">{r.unidade || 'sem unidade'}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={confirmarLivre}
              className="w-full text-left px-3 py-2 text-xs text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
            >
              + Usar "{busca.trim()}" (exame fora do catálogo)
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}

// Sugere os grupos do catálogo (Biomarcadores de desnutrição, Exame de
// carências nutricionais etc.) como atalho de um clique — mas sempre com
// opção de digitar um nome livre, já que o registro pode não seguir
// exatamente essas categorias.
function SeletorGrupo({ onSelecionar, onCancelar }) {
  const [personalizando, setPersonalizando] = useState(false)
  const [nomeLivre, setNomeLivre] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handleClickFora = (e) => { if (ref.current && !ref.current.contains(e.target)) onCancelar() }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (personalizando) {
    return (
      <div className="relative flex items-center gap-1.5" ref={ref}>
        <input
          type="text"
          autoFocus
          value={nomeLivre}
          onChange={(e) => setNomeLivre(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onSelecionar(nomeLivre.trim() || 'Novo grupo') } }}
          placeholder="Nome do grupo..."
          className="w-48 px-2 py-1 border border-gray-300 rounded text-xs outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button type="button" onClick={() => onSelecionar(nomeLivre.trim() || 'Novo grupo')} className="text-xs font-semibold text-primary-600">OK</button>
      </div>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <ul className="absolute z-20 w-64 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
        {GRUPOS_CATALOGO.map((nome) => (
          <li key={nome}>
            <button
              type="button"
              onClick={() => onSelecionar(nome)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-primary-50 dark:hover:bg-primary-900/20 border-b border-gray-100 dark:border-slate-800"
            >
              {nome}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => setPersonalizando(true)}
            className="w-full text-left px-3 py-2 text-xs text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
          >
            + Nome personalizado
          </button>
        </li>
      </ul>
    </div>
  )
}

function LinhaExame({ item, onAtualizar, onExcluir }) {
  return (
    <div className="grid grid-cols-[2fr_1fr_0.8fr_0.7fr_0.7fr_1fr_auto] gap-2 items-center px-2 py-1.5 text-xs border-b border-gray-50 dark:border-slate-800/50 last:border-0">
      <span className="font-semibold text-gray-700 dark:text-slate-300 truncate">{item.nome_exame}</span>
      <input
        type="text"
        value={item.valor_obtido ?? ''}
        onChange={(e) => onAtualizar({ valor_obtido: e.target.value })}
        placeholder="Valor obtido"
        className="px-2 py-1 border border-gray-200 dark:border-slate-700 rounded text-xs bg-transparent outline-none focus:ring-1 focus:ring-primary-500 w-full"
      />
      <input
        type="text"
        list="unidades-exames"
        value={item.unidade ?? ''}
        onChange={(e) => onAtualizar({ unidade: e.target.value })}
        placeholder="Unidade"
        className="px-2 py-1 border border-gray-200 dark:border-slate-700 rounded text-xs bg-transparent outline-none focus:ring-1 focus:ring-primary-500 w-full"
      />
      <input
        type="number" step="any"
        value={item.intervalo_min ?? ''}
        onChange={(e) => onAtualizar({ intervalo_min: e.target.value === '' ? null : Number(e.target.value) })}
        placeholder="Mín."
        className="px-2 py-1 border border-gray-200 dark:border-slate-700 rounded text-xs bg-transparent outline-none focus:ring-1 focus:ring-primary-500 w-full"
      />
      <input
        type="number" step="any"
        value={item.intervalo_max ?? ''}
        onChange={(e) => onAtualizar({ intervalo_max: e.target.value === '' ? null : Number(e.target.value) })}
        placeholder="Máx."
        className="px-2 py-1 border border-gray-200 dark:border-slate-700 rounded text-xs bg-transparent outline-none focus:ring-1 focus:ring-primary-500 w-full"
      />
      <div className="flex justify-center">
        <BadgeClassificacao valorObtido={item.valor_obtido} min={item.intervalo_min} max={item.intervalo_max} />
      </div>
      <button onClick={onExcluir} className="text-gray-300 dark:text-slate-600 hover:text-red-600 p-1" title="Remover exame">
        <Trash2 size={13} />
      </button>
    </div>
  )
}

export default function ExamesLaboratoriais({ userId }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [paciente, setPaciente] = useState(null)
  const [avaliador, setAvaliador] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('solicitacoes')

  // --- Solicitações ---
  const [solicitacoes, setSolicitacoes] = useState([])
  const [modelosSolicitacoes, setModelosSolicitacoes] = useState([])
  const [abertosSolicitacoes, setAbertosSolicitacoes] = useState(new Set())
  const [showModalSolicitacao, setShowModalSolicitacao] = useState(false)
  const [editingSolicitacaoId, setEditingSolicitacaoId] = useState(null)
  const [formSolicitacao, setFormSolicitacao] = useState(CAMPOS_VAZIOS_SOLICITACAO)
  const [savingSolicitacao, setSavingSolicitacao] = useState(false)
  const [pdfSolicitacaoAtiva, setPdfSolicitacaoAtiva] = useState(null)

  // --- Registros ---
  const [registros, setRegistros] = useState([])
  const [registroSelecionadoId, setRegistroSelecionadoId] = useState(null)
  const [grupos, setGrupos] = useState([])
  const [itens, setItens] = useState([])
  const [buscandoExameParaGrupo, setBuscandoExameParaGrupo] = useState(null) // id do grupo, ou 'avulso', ou null
  const [escolhendoGrupo, setEscolhendoGrupo] = useState(false)

  const carregarBase = async () => {
    setLoading(true)
    const { data: pac } = await supabase.from('pacientes').select('*').eq('id', id).maybeSingle()
    setPaciente(pac || null)

    const { data: avaliadorData } = await supabase
      .from('avaliadores')
      .select('nome_completo, empresa, logomarca_url, crn_numep')
      .eq('auth_id', userId)
      .maybeSingle()
    setAvaliador(avaliadorData || null)

    if (pac) {
      const { data: sol } = await supabase
        .from('exames_solicitacoes')
        .select('*')
        .eq('id_paciente', id)
        .order('created_at', { ascending: false })
      setSolicitacoes(sol || [])

      const { data: mods } = await supabase
        .from('modelos_exames_solicitacoes')
        .select('*')
        .order('titulo')
      setModelosSolicitacoes(mods || [])

      const { data: regs } = await supabase
        .from('exames_registros')
        .select('*')
        .eq('id_paciente', id)
        .order('data_coleta', { ascending: false })
      setRegistros(regs || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarBase()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const carregarDetalheRegistro = async (registroId) => {
    const { data: gs } = await supabase
      .from('exames_registros_grupos')
      .select('*')
      .eq('id_registro', registroId)
      .order('ordem')
    setGrupos(gs || [])

    const { data: its } = await supabase
      .from('exames_registros_itens')
      .select('*')
      .eq('id_registro', registroId)
      .order('ordem')
    setItens(its || [])
  }

  useEffect(() => {
    if (registroSelecionadoId) carregarDetalheRegistro(registroSelecionadoId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registroSelecionadoId])

  // ============================================================
  // Solicitações
  // ============================================================
  const abrirNovaSolicitacao = () => {
    setEditingSolicitacaoId(null)
    const proximoNumero = solicitacoes.length + 1
    setFormSolicitacao({ ...CAMPOS_VAZIOS_SOLICITACAO, titulo: `${proximoNumero}ª Solicitação de exames` })
    setShowModalSolicitacao(true)
  }

  const abrirEdicaoSolicitacao = (s) => {
    setEditingSolicitacaoId(s.id)
    setFormSolicitacao({ titulo: s.titulo, conteudo: s.conteudo || '', salvarComoModelo: false })
    setShowModalSolicitacao(true)
  }

  const toggleAbertoSolicitacao = (sid) => {
    setAbertosSolicitacoes((prev) => {
      const novo = new Set(prev)
      if (novo.has(sid)) novo.delete(sid)
      else novo.add(sid)
      return novo
    })
  }

  const handleEscolherModeloSolicitacao = (modelo) => {
    setFormSolicitacao((prev) => ({ ...prev, titulo: prev.titulo || modelo.titulo }))
  }

  const handleSubmitSolicitacao = async (e) => {
    e.preventDefault()
    setSavingSolicitacao(true)

    const conteudoLimpo = sanitizarHtmlEditor(formSolicitacao.conteudo)
    const payload = {
      titulo: formSolicitacao.titulo || 'Solicitação de exames',
      conteudo: conteudoLimpo,
      updated_at: new Date().toISOString(),
    }

    if (editingSolicitacaoId) {
      const { error } = await supabase.from('exames_solicitacoes').update(payload).eq('id', editingSolicitacaoId)
      if (error) { setSavingSolicitacao(false); alert('Erro ao atualizar solicitação: ' + error.message); return }
    } else {
      const { error } = await supabase
        .from('exames_solicitacoes')
        .insert({ ...payload, id_paciente: id, id_avaliador: userId })
      if (error) { setSavingSolicitacao(false); alert('Erro ao criar solicitação: ' + error.message); return }
    }

    if (formSolicitacao.salvarComoModelo) {
      await supabase
        .from('modelos_exames_solicitacoes')
        .insert({ id_avaliador: userId, titulo: formSolicitacao.titulo || 'Modelo', conteudo: conteudoLimpo })
    }

    setSavingSolicitacao(false)
    setShowModalSolicitacao(false)
    carregarBase()
  }

  const handleExcluirSolicitacao = async (sid) => {
    if (!window.confirm('Excluir esta solicitação? Essa ação não pode ser desfeita.')) return
    const { error } = await supabase.from('exames_solicitacoes').delete().eq('id', sid)
    if (error) { alert('Erro ao excluir solicitação: ' + error.message); return }
    setSolicitacoes((prev) => prev.filter((s) => s.id !== sid))
  }

  const handleSalvarComoModelo = async (s) => {
    const { error } = await supabase
      .from('modelos_exames_solicitacoes')
      .insert({ id_avaliador: userId, titulo: s.titulo, conteudo: s.conteudo })
    if (error) { alert('Erro ao salvar modelo: ' + error.message); return }
    alert('Salvo como modelo!')
    carregarBase()
  }

  const handleExcluirModeloSolicitacao = async (modeloId) => {
    const modelo = modelosSolicitacoes.find((m) => m.id === modeloId)
    if (modelo && !modelo.id_avaliador) { alert('Modelos do sistema não podem ser excluídos.'); return }
    if (!window.confirm('Excluir este modelo? Isso não afeta solicitações já criadas a partir dele.')) return
    const { error } = await supabase.from('modelos_exames_solicitacoes').delete().eq('id', modeloId)
    if (error) { alert('Erro ao excluir modelo: ' + error.message); return }
    setModelosSolicitacoes((prev) => prev.filter((m) => m.id !== modeloId))
  }

  // ============================================================
  // Registros
  // ============================================================
  const handleNovoRegistro = async () => {
    const proximoNumero = registros.length + 1
    const { data, error } = await supabase
      .from('exames_registros')
      .insert({ id_paciente: id, id_avaliador: userId, titulo: `${proximoNumero}º Registro de exames` })
      .select()
      .single()
    if (error) { alert('Erro ao criar registro: ' + error.message); return }
    setRegistros((prev) => [data, ...prev])
    setRegistroSelecionadoId(data.id)
  }

  const handleExcluirRegistro = async (registroId) => {
    if (!window.confirm('Excluir este registro de exames? Essa ação não pode ser desfeita.')) return
    const { error } = await supabase.from('exames_registros').delete().eq('id', registroId)
    if (error) { alert('Erro ao excluir registro: ' + error.message); return }
    setRegistros((prev) => prev.filter((r) => r.id !== registroId))
    if (registroSelecionadoId === registroId) setRegistroSelecionadoId(null)
  }

  const handleRenomearRegistro = async (registroId, novoTitulo) => {
    setRegistros((prev) => prev.map((r) => (r.id === registroId ? { ...r, titulo: novoTitulo } : r)))
    await supabase.from('exames_registros').update({ titulo: novoTitulo, updated_at: new Date().toISOString() }).eq('id', registroId)
  }

  const handleNovaData = async (registroId, novaData) => {
    setRegistros((prev) => prev.map((r) => (r.id === registroId ? { ...r, data_coleta: novaData } : r)))
    await supabase.from('exames_registros').update({ data_coleta: novaData }).eq('id', registroId)
  }

  const handleAdicionarGrupo = async (nome = 'Novo grupo') => {
    const { data, error } = await supabase
      .from('exames_registros_grupos')
      .insert({ id_registro: registroSelecionadoId, nome, ordem: grupos.length })
      .select()
      .single()
    if (error) { alert('Erro ao criar grupo: ' + error.message); return }
    setGrupos((prev) => [...prev, data])
    setEscolhendoGrupo(false)
  }

  const handleRenomearGrupo = async (grupoId, novoNome) => {
    setGrupos((prev) => prev.map((g) => (g.id === grupoId ? { ...g, nome: novoNome } : g)))
    await supabase.from('exames_registros_grupos').update({ nome: novoNome }).eq('id', grupoId)
  }

  const handleExcluirGrupo = async (grupoId) => {
    if (!window.confirm('Excluir este grupo e todos os exames dentro dele?')) return
    const { error } = await supabase.from('exames_registros_grupos').delete().eq('id', grupoId)
    if (error) { alert('Erro ao excluir grupo: ' + error.message); return }
    setGrupos((prev) => prev.filter((g) => g.id !== grupoId))
    setItens((prev) => prev.filter((i) => i.id_grupo !== grupoId))
  }

  const handleAdicionarExame = async (grupoId, exameCatalogo) => {
    const itensDoGrupo = itens.filter((i) => i.id_grupo === grupoId)
    const { data, error } = await supabase
      .from('exames_registros_itens')
      .insert({
        id_registro: registroSelecionadoId,
        id_grupo: grupoId === 'avulso' ? null : grupoId,
        nome_exame: exameCatalogo.nome,
        unidade: exameCatalogo.unidade || null,
        intervalo_min: exameCatalogo.min,
        intervalo_max: exameCatalogo.max,
        ordem: itensDoGrupo.length,
      })
      .select()
      .single()
    if (error) { alert('Erro ao adicionar exame: ' + error.message); return }
    setItens((prev) => [...prev, data])
    setBuscandoExameParaGrupo(null)
  }

  const handleAtualizarItem = async (itemId, patch) => {
    setItens((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...patch } : i)))
    await supabase.from('exames_registros_itens').update(patch).eq('id', itemId)
  }

  const handleExcluirItem = async (itemId) => {
    const { error } = await supabase.from('exames_registros_itens').delete().eq('id', itemId)
    if (error) { alert('Erro ao remover exame: ' + error.message); return }
    setItens((prev) => prev.filter((i) => i.id !== itemId))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-primary-600 font-bold animate-pulse">Carregando exames laboratoriais...</p>
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

  const registroSelecionado = registros.find((r) => r.id === registroSelecionadoId)
  const itensAvulsos = itens.filter((i) => i.id_grupo === null)

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
      <datalist id="unidades-exames">
        <option value="mg/dL" /><option value="g/dL" /><option value="ng/mL" /><option value="pg/mL" />
        <option value="µg/dL" /><option value="mEq/L" /><option value="mmol/L" /><option value="U/L" />
        <option value="µUI/mL" /><option value="%" /><option value="/mm³" /><option value="fL" /><option value="pg" />
      </datalist>

      <SidebarPaciente paciente={paciente} itemAtivo="exames" onSelecionarItem={() => {}} />

      <div className="flex-1 min-w-0 space-y-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Exames Laboratoriais — {paciente.nome_completo}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Solicite exames e registre resultados com valores de referência</p>
          </div>
          <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold w-fit shrink-0">
            <button
              type="button"
              onClick={() => setAba('solicitacoes')}
              className={`px-3 py-1.5 rounded-md transition-colors ${aba === 'solicitacoes' ? 'bg-white dark:bg-slate-900 text-primary-600 shadow' : 'text-gray-500 dark:text-slate-400'}`}
            >
              Solicitações
            </button>
            <button
              type="button"
              onClick={() => setAba('resultados')}
              className={`px-3 py-1.5 rounded-md transition-colors ${aba === 'resultados' ? 'bg-white dark:bg-slate-900 text-primary-600 shadow' : 'text-gray-500 dark:text-slate-400'}`}
            >
              Resultados
            </button>
          </div>
        </div>

        {aba === 'solicitacoes' && (
          <>
            <div className="flex justify-end">
              <button
                onClick={abrirNovaSolicitacao}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors"
              >
                <Plus size={15} /> Nova Solicitação
              </button>
            </div>

            {solicitacoes.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhuma solicitação de exames ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {solicitacoes.map((s) => {
                  const aberto = abertosSolicitacoes.has(s.id)
                  return (
                    <div key={s.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="flex flex-wrap justify-between items-center gap-3 p-4">
                        <button
                          type="button"
                          onClick={() => toggleAbertoSolicitacao(s.id)}
                          className="flex-1 flex items-center gap-2 text-left min-w-0"
                        >
                          {aberto ? (
                            <ChevronDown size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                          ) : (
                            <ChevronRight size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span className="text-sm font-black text-gray-800 dark:text-slate-100 truncate block">{s.titulo}</span>
                            <p className="text-[10px] text-gray-400 dark:text-slate-500">Criada em {formatarDataHora(s.created_at)}</p>
                          </div>
                        </button>
                        <div className="flex items-center gap-3 shrink-0 text-xs font-semibold">
                          <button onClick={() => toggleAbertoSolicitacao(s.id)} className="flex items-center gap-1 text-gray-600 dark:text-slate-400 hover:underline">
                            <Eye size={13} /> Visualizar pedido
                          </button>
                          <button onClick={() => abrirEdicaoSolicitacao(s)} className="flex items-center gap-1 text-primary-600 hover:underline">
                            <Pencil size={13} /> Editar
                          </button>
                          <button onClick={() => setPdfSolicitacaoAtiva(s)} className="flex items-center gap-1 text-primary-600 hover:underline">
                            <FileDown size={13} /> Gerar PDF
                          </button>
                          <button onClick={() => handleSalvarComoModelo(s)} className="flex items-center gap-1 text-gray-600 dark:text-slate-400 hover:underline">
                            <Bookmark size={13} /> Salvar modelo
                          </button>
                          <button onClick={() => handleExcluirSolicitacao(s.id)} className="flex items-center gap-1 text-red-600 hover:underline">
                            <Trash2 size={13} /> Excluir
                          </button>
                        </div>
                      </div>
                      {aberto && (
                        <div className="px-4 pb-4">
                          {s.conteudo ? (
                            <div className="rte-html text-sm text-gray-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: s.conteudo }} />
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-slate-500">-</p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {aba === 'resultados' && (
          <>
            {!registroSelecionado ? (
              <>
                <div className="flex justify-end">
                  <button
                    onClick={handleNovoRegistro}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors"
                  >
                    <Plus size={15} /> Novo Registro
                  </button>
                </div>
                {registros.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
                    <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhum registro de exames ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {registros.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setRegistroSelecionadoId(r.id)}
                        className="w-full flex justify-between items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:border-primary-300 dark:hover:border-primary-700 text-left transition-colors"
                      >
                        <div className="min-w-0">
                          <span className="text-sm font-black text-gray-800 dark:text-slate-100 truncate block">{r.titulo}</span>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500">Coleta em {formatarData(r.data_coleta)}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <button onClick={() => setRegistroSelecionadoId(null)} className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:underline shrink-0">
                    ← Voltar
                  </button>
                  <input
                    type="text"
                    value={registroSelecionado.titulo}
                    onChange={(e) => handleRenomearRegistro(registroSelecionado.id, e.target.value)}
                    className="flex-1 min-w-[160px] text-sm font-black text-gray-800 dark:text-slate-100 bg-transparent outline-none border-b border-transparent focus:border-primary-500"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-xs text-gray-500 dark:text-slate-400">Coleta:</label>
                    <input
                      type="date"
                      value={registroSelecionado.data_coleta}
                      onChange={(e) => handleNovaData(registroSelecionado.id, e.target.value)}
                      className="px-2 py-1 border border-gray-300 dark:border-slate-700 rounded text-xs bg-transparent outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <button onClick={() => handleExcluirRegistro(registroSelecionado.id)} className="text-xs font-semibold text-red-600 hover:underline shrink-0">
                    Excluir registro
                  </button>
                </div>

                {grupos.map((g) => {
                  const itensDoGrupo = itens.filter((i) => i.id_grupo === g.id)
                  return (
                    <div key={g.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                        <input
                          type="text"
                          value={g.nome}
                          onChange={(e) => handleRenomearGrupo(g.id, e.target.value)}
                          className="text-sm font-black text-gray-800 dark:text-slate-100 bg-transparent outline-none border-b border-transparent focus:border-primary-500 flex-1 min-w-0"
                        />
                        <button onClick={() => handleExcluirGrupo(g.id)} className="text-gray-300 dark:text-slate-600 hover:text-red-600 p-1 shrink-0" title="Excluir grupo">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {itensDoGrupo.length > 0 && (
                        <div className="grid grid-cols-[2fr_1fr_0.8fr_0.7fr_0.7fr_1fr_auto] gap-2 px-2 pt-2 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">
                          <span>Parâmetro</span><span>Valor obtido</span><span>Unidade</span><span>Mín.</span><span>Máx.</span><span className="text-center">Classificação</span><span />
                        </div>
                      )}
                      <div>
                        {itensDoGrupo.map((item) => (
                          <LinhaExame
                            key={item.id}
                            item={item}
                            onAtualizar={(patch) => handleAtualizarItem(item.id, patch)}
                            onExcluir={() => handleExcluirItem(item.id)}
                          />
                        ))}
                      </div>
                      <div className="p-3">
                        {buscandoExameParaGrupo === g.id ? (
                          <BuscaExameCatalogo
                            onSelecionar={(exame) => handleAdicionarExame(g.id, exame)}
                            onCancelar={() => setBuscandoExameParaGrupo(null)}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => setBuscandoExameParaGrupo(g.id)}
                            className="text-xs font-semibold text-primary-600 hover:underline"
                          >
                            + Adicionar exame
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 p-4 space-y-3">
                  {itensAvulsos.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase mb-1">Exames avulsos</p>
                      <div className="grid grid-cols-[2fr_1fr_0.8fr_0.7fr_0.7fr_1fr_auto] gap-2 px-2 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase">
                        <span>Parâmetro</span><span>Valor obtido</span><span>Unidade</span><span>Mín.</span><span>Máx.</span><span className="text-center">Classificação</span><span />
                      </div>
                      {itensAvulsos.map((item) => (
                        <LinhaExame
                          key={item.id}
                          item={item}
                          onAtualizar={(patch) => handleAtualizarItem(item.id, patch)}
                          onExcluir={() => handleExcluirItem(item.id)}
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-4">
                    {escolhendoGrupo ? (
                      <SeletorGrupo
                        onSelecionar={(nome) => handleAdicionarGrupo(nome)}
                        onCancelar={() => setEscolhendoGrupo(false)}
                      />
                    ) : (
                      <button type="button" onClick={() => setEscolhendoGrupo(true)} className="text-xs font-semibold text-primary-600 hover:underline">
                        + Adicionar grupo
                      </button>
                    )}
                    {buscandoExameParaGrupo === 'avulso' ? (
                      <BuscaExameCatalogo
                        onSelecionar={(exame) => handleAdicionarExame('avulso', exame)}
                        onCancelar={() => setBuscandoExameParaGrupo(null)}
                      />
                    ) : (
                      <button type="button" onClick={() => setBuscandoExameParaGrupo('avulso')} className="text-xs font-semibold text-primary-600 hover:underline">
                        + Adicionar exame avulso
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModalSolicitacao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                {editingSolicitacaoId ? 'Editar Solicitação' : 'Nova Solicitação de Exames'}
              </h3>
              <button onClick={() => setShowModalSolicitacao(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmitSolicitacao} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={formSolicitacao.titulo}
                  onChange={(e) => setFormSolicitacao({ ...formSolicitacao, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Conteúdo <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  initialHtml={formSolicitacao.conteudo}
                  onChange={(html) => setFormSolicitacao((f) => ({ ...f, conteudo: html }))}
                  modelos={modelosSolicitacoes}
                  onEscolherModelo={handleEscolherModeloSolicitacao}
                  onExcluirModelo={handleExcluirModeloSolicitacao}
                  placeholder="Ex.: liste os exames solicitados..."
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={formSolicitacao.salvarComoModelo}
                  onChange={(e) => setFormSolicitacao({ ...formSolicitacao, salvarComoModelo: e.target.checked })}
                  className="w-4 h-4 accent-primary-600"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Salvar também como modelo (reutilizável em outros pacientes)</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalSolicitacao(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSolicitacao}
                  className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
                >
                  {savingSolicitacao ? 'Salvando...' : editingSolicitacaoId ? 'Atualizar Solicitação' : 'Criar Solicitação de Exames'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pdfSolicitacaoAtiva && (
        <GeradorPdfSolicitacaoExames
          solicitacao={pdfSolicitacaoAtiva}
          paciente={paciente}
          avaliador={avaliador}
          aoFechar={() => setPdfSolicitacaoAtiva(null)}
        />
      )}
    </div>
  )
}
