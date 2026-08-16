import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { ChevronLeft, ChevronRight, Pencil, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const CATEGORIAS_RECEITA = ['Consultas', 'Venda de produtos', 'Outro']
const CATEGORIAS_DESPESA = ['Aluguel e contas', 'Software', 'Marketing', 'Impostos e taxas', 'Material de consultório', 'Outro']

const CAMPOS_VAZIOS = {
  tipo: 'receita',
  descricao: '',
  categoria: CATEGORIAS_RECEITA[0],
  id_paciente: '',
  valor: '',
  data: new Date().toISOString().slice(0, 10),
  pago: false,
}

function fmtMoeda(n) {
  return (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(`${dataStr}T00:00:00`).toLocaleDateString('pt-BR')
}

export default function Financeiro({ userId }) {
  const [loading, setLoading] = useState(true)
  const [movimentacoes, setMovimentacoes] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [ano, setAno] = useState(new Date().getFullYear())
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth()) // null = ano todo

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(CAMPOS_VAZIOS)
  const [salvando, setSalvando] = useState(false)

  const carregarMovimentacoes = async (anoAlvo) => {
    setLoading(true)
    const { data } = await supabase
      .from('movimentacoes_financeiras')
      .select('*, pacientes(nome_completo)')
      .gte('data', `${anoAlvo}-01-01`)
      .lte('data', `${anoAlvo}-12-31`)
      .order('data', { ascending: false })
    setMovimentacoes(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarMovimentacoes(ano)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano])

  useEffect(() => {
    const carregarPacientes = async () => {
      const { data } = await supabase
        .from('pacientes')
        .select('id, nome_completo')
        .eq('id_avaliador', userId)
        .order('nome_completo')
      setPacientes(data || [])
    }
    carregarPacientes()
  }, [userId])

  const movimentacoesDoPeriodo = movimentacoes.filter((m) => {
    if (mesSelecionado === null) return true
    return new Date(`${m.data}T00:00:00`).getMonth() === mesSelecionado
  })

  const totalReceitas = movimentacoesDoPeriodo.filter((m) => m.tipo === 'receita').reduce((acc, m) => acc + Number(m.valor), 0)
  const totalDespesas = movimentacoesDoPeriodo.filter((m) => m.tipo === 'despesa').reduce((acc, m) => acc + Number(m.valor), 0)
  const saldo = totalReceitas - totalDespesas

  const abrirNova = () => {
    setEditingId(null)
    setForm(CAMPOS_VAZIOS)
    setShowModal(true)
  }

  const abrirEdicao = (m) => {
    setEditingId(m.id)
    setForm({
      tipo: m.tipo,
      descricao: m.descricao,
      categoria: m.categoria,
      id_paciente: m.id_paciente ? String(m.id_paciente) : '',
      valor: String(m.valor),
      data: m.data,
      pago: m.pago,
    })
    setShowModal(true)
  }

  const handleTrocarTipo = (tipo) => {
    const categorias = tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA
    setForm((prev) => ({ ...prev, tipo, categoria: categorias[0] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.descricao || !form.valor) return
    setSalvando(true)

    const payload = {
      tipo: form.tipo,
      descricao: form.descricao,
      categoria: form.categoria,
      id_paciente: form.id_paciente || null,
      valor: Number(form.valor),
      data: form.data,
      pago: form.pago,
    }

    if (editingId) {
      const { error } = await supabase.from('movimentacoes_financeiras').update(payload).eq('id', editingId)
      setSalvando(false)
      if (error) { alert('Erro ao atualizar movimentação: ' + error.message); return }
    } else {
      const { error } = await supabase.from('movimentacoes_financeiras').insert({ ...payload, id_avaliador: userId })
      setSalvando(false)
      if (error) { alert('Erro ao registrar movimentação: ' + error.message); return }
    }

    setShowModal(false)
    carregarMovimentacoes(ano)
  }

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir esta movimentação?')) return
    const { error } = await supabase.from('movimentacoes_financeiras').delete().eq('id', id)
    if (error) { alert('Erro ao excluir: ' + error.message); return }
    setMovimentacoes((prev) => prev.filter((m) => m.id !== id))
  }

  const categoriasDoForm = form.tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Wallet size={20} /> Controle Financeiro
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Receitas e despesas do seu consultório</p>
        </div>
        <button
          onClick={abrirNova}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow transition-colors shrink-0"
        >
          + Registrar movimentação
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setAno((a) => a - 1)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-black text-gray-800 dark:text-slate-100">{ano}</span>
          <button onClick={() => setAno((a) => a + 1)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          <button
            onClick={() => setMesSelecionado(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              mesSelecionado === null
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            Ano todo
          </button>
          {MESES.map((m, idx) => (
            <button
              key={m}
              onClick={() => setMesSelecionado(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                mesSelecionado === idx
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5"><TrendingUp size={13} className="text-emerald-500" /> Receitas</p>
          <p className="text-xl font-black text-gray-800 dark:text-slate-100 mt-1">{fmtMoeda(totalReceitas)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5"><TrendingDown size={13} className="text-red-500" /> Despesas</p>
          <p className="text-xl font-black text-gray-800 dark:text-slate-100 mt-1">{fmtMoeda(totalDespesas)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-gray-500 dark:text-slate-400">Saldo</p>
          <p className={`text-xl font-black mt-1 ${saldo >= 0 ? 'text-gray-800 dark:text-slate-100' : 'text-red-600 dark:text-red-400'}`}>{fmtMoeda(saldo)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-sm text-primary-600 font-semibold text-center py-8 animate-pulse">Carregando...</p>
        ) : movimentacoesDoPeriodo.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-8">Nenhuma movimentação no período selecionado.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {movimentacoesDoPeriodo.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate">{m.descricao}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {formatarData(m.data)} · {m.categoria}
                    {m.pacientes?.nome_completo && <> · {m.pacientes.nome_completo}</>}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.pago ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'}`}>
                    {m.pago ? (m.tipo === 'receita' ? 'Recebido' : 'Pago') : 'Pendente'}
                  </span>
                  <span className={`text-sm font-black ${m.tipo === 'receita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {m.tipo === 'receita' ? '+' : '-'} {fmtMoeda(m.valor)}
                  </span>
                  <button onClick={() => abrirEdicao(m)} className="text-gray-400 hover:text-primary-600 p-1">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleExcluir(m.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
                {editingId ? 'Editar Movimentação' : 'Registrar Movimentação'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleTrocarTipo('receita')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${form.tipo === 'receita' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow' : 'text-gray-500 dark:text-slate-400'}`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => handleTrocarTipo('despesa')}
                  className={`flex-1 py-1.5 rounded-md transition-colors ${form.tipo === 'despesa' ? 'bg-white dark:bg-slate-900 text-red-600 shadow' : 'text-gray-500 dark:text-slate-400'}`}
                >
                  Despesa
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Categoria</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {categoriasDoForm.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.valor}
                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={form.data}
                    onChange={(e) => setForm({ ...form, data: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Paciente (opcional)</label>
                  <select
                    value={form.id_paciente}
                    onChange={(e) => setForm({ ...form, id_paciente: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome_completo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={form.pago}
                  onChange={(e) => setForm({ ...form, pago: e.target.checked })}
                  className="w-4 h-4 accent-primary-600"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                  {form.tipo === 'receita' ? 'O paciente já pagou' : 'Já foi pago'}
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
                >
                  {salvando ? 'Salvando...' : editingId ? 'Salvar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
