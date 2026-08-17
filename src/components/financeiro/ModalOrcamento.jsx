import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabaseClient'
import { X, Plus, Trash2 } from 'lucide-react'
import InterruptorVisibilidade from '../InterruptorVisibilidade'

const ITEM_VAZIO = { descricao: '', valor: '', desconto: '' }

function valorLiquidoItem(item) {
  return Math.max((Number(item.valor) || 0) - (Number(item.desconto) || 0), 0)
}

function fmtMoeda(n) {
  return (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function normalizarTexto(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Criar/editar um Orçamento ou Protocolo. Vínculo pode ser um paciente já
// cadastrado (busca por nome, mesmo padrão de CalculadoraGastoCalorico.jsx)
// ou um lead avulso (nome_lead + telefone_lead livres, sem registro em
// pacientes) — a integração mais profunda com uma lista de leads/CRM fica
// pra outra hora.
export default function ModalOrcamento({ userId, orcamento, aoFechar, aoSalvar }) {
  const dropdownRef = useRef(null)
  const editando = !!orcamento

  const [vinculo, setVinculo] = useState(orcamento?.id_paciente ? 'existente' : 'avulso')
  const [busca, setBusca] = useState('')
  const [pacientesFiltrados, setPacientesFiltrados] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [pacienteSelecionado, setPacienteSelecionado] = useState(
    orcamento?.id_paciente
      ? { id: orcamento.id_paciente, nome_completo: orcamento.pacientes?.nome_completo, telefone: orcamento.pacientes?.telefone }
      : null
  )
  const [nomeLead, setNomeLead] = useState(orcamento?.nome_lead || '')
  const [telefoneLead, setTelefoneLead] = useState(orcamento?.telefone_lead || '')
  const [titulo, setTitulo] = useState(orcamento?.titulo || 'Orçamento')
  const [itens, setItens] = useState(orcamento?.itens?.length ? orcamento.itens : [{ ...ITEM_VAZIO }])
  const [desconto, setDesconto] = useState(orcamento?.desconto || '')
  const [descontoTipo, setDescontoTipo] = useState(orcamento?.desconto_tipo || 'fixo')
  const [validadeDias, setValidadeDias] = useState(orcamento?.validade_dias ?? 7)
  const [linkPagamento, setLinkPagamento] = useState(orcamento?.link_pagamento || '')
  const [mostrarPix, setMostrarPix] = useState(orcamento?.mostrar_pix ?? true)
  const [mostrarCartao, setMostrarCartao] = useState(orcamento?.mostrar_cartao ?? true)
  const [chavePixPerfil, setChavePixPerfil] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const carregarChavePix = async () => {
      const { data } = await supabase.from('avaliadores').select('chave_pix').eq('auth_id', userId).maybeSingle()
      setChavePixPerfil(data?.chave_pix || null)
    }
    carregarChavePix()
  }, [userId])

  // Carrega a lista de pacientes uma vez só e filtra no cliente (em vez de
  // usar ilike no Supabase): "jessica" tem que achar "Jéssica" também, e o
  // Postgres ilike é sensível a acento por padrão.
  const [pacientesTodos, setPacientesTodos] = useState([])

  useEffect(() => {
    const carregarPacientes = async () => {
      const { data } = await supabase.from('pacientes').select('id, nome_completo, telefone').order('nome_completo')
      setPacientesTodos(data || [])
    }
    carregarPacientes()
  }, [])

  useEffect(() => {
    if (busca.length < 1) {
      setPacientesFiltrados([])
      return
    }
    const termo = normalizarTexto(busca)
    setPacientesFiltrados(pacientesTodos.filter((p) => normalizarTexto(p.nome_completo).includes(termo)).slice(0, 5))
  }, [busca, pacientesTodos])

  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClickFora)
    return () => document.removeEventListener('mousedown', handleClickFora)
  }, [])

  const selecionarPaciente = (p) => {
    setPacienteSelecionado(p)
    setBusca('')
    setShowDropdown(false)
  }

  const subtotal = itens.reduce((soma, item) => soma + valorLiquidoItem(item), 0)
  const valorDesconto = descontoTipo === 'percentual' ? subtotal * ((Number(desconto) || 0) / 100) : Number(desconto) || 0
  const valorTotal = Math.max(subtotal - valorDesconto, 0)

  const atualizarItem = (i, campo, valor) => {
    setItens((prev) => prev.map((item, idx) => (idx === i ? { ...item, [campo]: valor } : item)))
  }

  const adicionarItem = () => setItens((prev) => [...prev, { ...ITEM_VAZIO }])
  const removerItem = (i) => setItens((prev) => prev.filter((_, idx) => idx !== i))

  const handleSalvar = async (e) => {
    e.preventDefault()
    if (vinculo === 'existente' && !pacienteSelecionado) {
      return alert('Selecione um paciente ou troque para "Lead novo".')
    }
    if (vinculo === 'avulso' && !nomeLead.trim()) {
      return alert('Digite o nome do lead.')
    }
    const itensValidos = itens.filter((item) => item.descricao.trim())
    if (!itensValidos.length) {
      return alert('Adicione ao menos um item.')
    }

    setSaving(true)
    const payload = {
      id_avaliador: userId,
      id_paciente: vinculo === 'existente' ? pacienteSelecionado.id : null,
      nome_lead: vinculo === 'avulso' ? nomeLead.trim() : null,
      telefone_lead: vinculo === 'avulso' ? telefoneLead.trim() : null,
      titulo: titulo.trim() || 'Orçamento',
      itens: itensValidos.map((item) => ({ descricao: item.descricao.trim(), valor: Number(item.valor) || 0, desconto: Number(item.desconto) || 0 })),
      desconto: Number(desconto) || 0,
      desconto_tipo: descontoTipo,
      valor_total: valorTotal,
      validade_dias: Number(validadeDias) || 7,
      link_pagamento: linkPagamento.trim() || null,
      mostrar_pix: mostrarPix,
      mostrar_cartao: mostrarCartao,
    }

    const res = editando
      ? await supabase.from('orcamentos').update(payload).eq('id', orcamento.id).select('*, pacientes(nome_completo, telefone)').single()
      : await supabase.from('orcamentos').insert(payload).select('*, pacientes(nome_completo, telefone)').single()

    setSaving(false)

    if (res.error) {
      alert('Erro ao salvar orçamento: ' + res.error.message)
    } else {
      aoSalvar(res.data)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">{editando ? 'Editar Orçamento' : 'Novo Orçamento'}</h3>
          <button onClick={aoFechar} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSalvar} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Para quem?</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setVinculo('existente')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  vinculo === 'existente'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-700'
                }`}
              >
                Paciente existente
              </button>
              <button
                type="button"
                onClick={() => setVinculo('avulso')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  vinculo === 'avulso'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-700'
                }`}
              >
                Lead novo (avulso)
              </button>
            </div>

            {vinculo === 'existente' ? (
              pacienteSelecionado ? (
                <div className="flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{pacienteSelecionado.nome_completo}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">{pacienteSelecionado.telefone || 'sem telefone cadastrado'}</p>
                  </div>
                  <button type="button" onClick={() => setPacienteSelecionado(null)} className="text-xs text-primary-600 hover:underline font-semibold">
                    Trocar
                  </button>
                </div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => {
                      setBusca(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Digite o nome do paciente..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                  {showDropdown && pacientesFiltrados.length > 0 && (
                    <ul className="absolute z-30 w-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {pacientesFiltrados.map((p) => (
                        <li
                          key={p.id}
                          onClick={() => selecionarPaciente(p)}
                          className="px-3 py-2 cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm font-medium border-b border-gray-100 dark:border-slate-800 last:border-0"
                        >
                          {p.nome_completo}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={nomeLead}
                  onChange={(e) => setNomeLead(e.target.value)}
                  placeholder="Nome do lead"
                  className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <input
                  type="text"
                  value={telefoneLead}
                  onChange={(e) => setTelefoneLead(e.target.value)}
                  placeholder="WhatsApp (com DDD)"
                  className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Título</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Orçamento, Protocolo de Emagrecimento..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Itens</label>
              <button type="button" onClick={adicionarItem} className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline">
                <Plus size={14} /> Adicionar item
              </button>
            </div>
            <div className="space-y-2">
              {itens.map((item, i) => (
                <div key={i} className="border border-gray-200 dark:border-slate-700 rounded-lg p-2 space-y-2">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={item.descricao}
                      onChange={(e) => atualizarItem(i, 'descricao', e.target.value)}
                      placeholder="Ex: Consulta inicial"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                    {itens.length > 1 && (
                      <button type="button" onClick={() => removerItem(i)} className="text-gray-400 hover:text-red-600 shrink-0">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 mb-0.5">Valor (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.valor}
                        onChange={(e) => atualizarItem(i, 'valor', e.target.value)}
                        placeholder="0,00"
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 mb-0.5">Desconto (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.desconto}
                        onChange={(e) => atualizarItem(i, 'desconto', e.target.value)}
                        placeholder="0,00"
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 dark:text-slate-500 mb-0.5">Com desconto</label>
                      <p className="px-2 py-1.5 text-sm font-bold text-gray-800 dark:text-slate-100">{fmtMoeda(valorLiquidoItem(item))}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <label className="text-xs font-semibold text-gray-500 dark:text-slate-400">Desconto</label>
              <input
                type="number"
                step="0.01"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                placeholder="0"
                className="w-20 px-2 py-1 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-right bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <div className="flex rounded-lg border border-gray-300 dark:border-slate-700 overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setDescontoTipo('fixo')}
                  className={`px-2 py-1 text-xs font-semibold transition-colors ${
                    descontoTipo === 'fixo' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400'
                  }`}
                >
                  R$
                </button>
                <button
                  type="button"
                  onClick={() => setDescontoTipo('percentual')}
                  className={`px-2 py-1 text-xs font-semibold transition-colors ${
                    descontoTipo === 'percentual' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-900 text-gray-500 dark:text-slate-400'
                  }`}
                >
                  %
                </button>
              </div>
            </div>
            {Number(desconto) > 0 && (
              <div className="text-right text-xs text-gray-400 dark:text-slate-500 mt-1 space-x-2">
                <span className="line-through">{fmtMoeda(subtotal)}</span>
                <span>- {fmtMoeda(valorDesconto)} de desconto</span>
              </div>
            )}
            <p className="text-right text-sm font-bold text-gray-800 dark:text-slate-100 mt-1">Total: {fmtMoeda(valorTotal)}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Validade (dias)</label>
            <input
              type="number"
              value={validadeDias}
              onChange={(e) => setValidadeDias(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Formas de pagamento</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Chave Pix</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 truncate">
                    {chavePixPerfil || 'Nenhuma cadastrada no seu perfil (Nutricionista)'}
                  </p>
                </div>
                <InterruptorVisibilidade
                  ativo={mostrarPix}
                  onToggle={() => setMostrarPix((v) => !v)}
                  titulo="Mostrar Chave Pix no orçamento"
                  textoAtivo="Ver"
                  textoInativo="Não ver"
                />
              </div>

              <div className="px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">Pagar com Cartão</p>
                  <InterruptorVisibilidade
                    ativo={mostrarCartao}
                    onToggle={() => setMostrarCartao((v) => !v)}
                    titulo="Mostrar botão Pagar com Cartão no orçamento"
                    textoAtivo="Ver"
                    textoInativo="Não ver"
                  />
                </div>
                <input
                  type="url"
                  value={linkPagamento}
                  onChange={(e) => setLinkPagamento(e.target.value)}
                  placeholder="Link de checkout: Mercado Pago, PagBank..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={aoFechar}
              className="px-5 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
