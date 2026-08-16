import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../supabaseClient'
import { useTheme } from '../contexts/ThemeContext'
import { ChevronLeft, ChevronRight, Pencil, Trash2, TrendingUp, TrendingDown, Wallet, Repeat, AlertTriangle, Check, Receipt, X } from 'lucide-react'
import GeradorPdfRecibo from '../components/GeradorPdfRecibo'

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
  recorrente: false,
  data_vencimento: '',
  numero_parcelas: 1,
}

function fmtMoeda(n) {
  return (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(`${dataStr}T00:00:00`).toLocaleDateString('pt-BR')
}

export default function Financeiro({ userId }) {
  const { darkMode } = useTheme()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [movimentacoes, setMovimentacoes] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [ano, setAno] = useState(new Date().getFullYear())
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth()) // null = ano todo
  const [abaAtiva, setAbaAtiva] = useState('movimentacoes') // 'movimentacoes' | 'pendencias' | 'fluxo'
  const [pendencias, setPendencias] = useState([])
  const [carregandoPendencias, setCarregandoPendencias] = useState(true)
  const [movimentacaoParaRecibo, setMovimentacaoParaRecibo] = useState(null)
  // Vindo do botão "Pagamentos" na Ficha do Paciente (mesmo padrão de
  // pacientePreSelecionado já usado pra Agenda) — filtra tudo por esse
  // paciente até o nutri limpar o filtro.
  const [pacienteFiltro, setPacienteFiltro] = useState(location.state?.pacientePreSelecionado || null)

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

  // Pendências não são filtradas por ano/mês — um boleto vencido do ano
  // passado continua pendente e precisa aparecer aqui até ser resolvido.
  const carregarPendencias = async () => {
    setCarregandoPendencias(true)
    const { data } = await supabase
      .from('movimentacoes_financeiras')
      .select('*, pacientes(nome_completo)')
      .eq('pago', false)
      .order('data_vencimento', { ascending: true, nullsFirst: false })
    setPendencias(data || [])
    setCarregandoPendencias(false)
  }

  useEffect(() => {
    carregarMovimentacoes(ano)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano])

  useEffect(() => {
    carregarPendencias()
  }, [])

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

  const movimentacoesDoPaciente = pacienteFiltro
    ? movimentacoes.filter((m) => m.id_paciente === pacienteFiltro.id)
    : movimentacoes

  const movimentacoesDoPeriodo = movimentacoesDoPaciente.filter((m) => {
    if (mesSelecionado === null) return true
    return new Date(`${m.data}T00:00:00`).getMonth() === mesSelecionado
  })

  const totalReceitas = movimentacoesDoPeriodo.filter((m) => m.tipo === 'receita').reduce((acc, m) => acc + Number(m.valor), 0)
  const totalDespesas = movimentacoesDoPeriodo.filter((m) => m.tipo === 'despesa').reduce((acc, m) => acc + Number(m.valor), 0)
  const saldo = totalReceitas - totalDespesas

  const pendenciasFiltradas = pacienteFiltro
    ? pendencias.filter((p) => p.id_paciente === pacienteFiltro.id)
    : pendencias

  // Fluxo de caixa: receitas x despesas de cada mês do ano inteiro, pra
  // comparar de relance — independe do mês selecionado no seletor acima.
  const dadosFluxoCaixa = MESES.map((mes, idx) => {
    const doMes = movimentacoesDoPaciente.filter((m) => new Date(`${m.data}T00:00:00`).getMonth() === idx)
    return {
      mes,
      Receitas: doMes.filter((m) => m.tipo === 'receita').reduce((acc, m) => acc + Number(m.valor), 0),
      Despesas: doMes.filter((m) => m.tipo === 'despesa').reduce((acc, m) => acc + Number(m.valor), 0),
    }
  })

  const abrirNova = () => {
    setEditingId(null)
    setForm({ ...CAMPOS_VAZIOS, id_paciente: pacienteFiltro ? String(pacienteFiltro.id) : '' })
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
      recorrente: m.recorrente,
      data_vencimento: m.data_vencimento || '',
      numero_parcelas: 1,
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

    const numParcelas = editingId ? 1 : Number(form.numero_parcelas) || 1

    if (numParcelas > 1) {
      const valorTotal = Number(form.valor)
      const valorParcela = Math.floor((valorTotal / numParcelas) * 100) / 100
      const grupo = crypto.randomUUID()
      const linhas = []
      let somaParcelas = 0
      for (let i = 0; i < numParcelas; i++) {
        const dataParcela = new Date(`${form.data}T00:00:00`)
        dataParcela.setMonth(dataParcela.getMonth() + i)
        const ehUltima = i === numParcelas - 1
        const valor = ehUltima ? Number((valorTotal - somaParcelas).toFixed(2)) : valorParcela
        somaParcelas += valor
        linhas.push({
          id_avaliador: userId,
          id_paciente: form.id_paciente || null,
          tipo: form.tipo,
          descricao: `${form.descricao} (${i + 1}/${numParcelas})`,
          categoria: form.categoria,
          valor,
          data: dataParcela.toISOString().slice(0, 10),
          pago: false,
          recorrente: false,
          data_vencimento: null,
          parcela_numero: i + 1,
          parcela_total: numParcelas,
          grupo_parcelamento: grupo,
        })
      }
      const { error } = await supabase.from('movimentacoes_financeiras').insert(linhas)
      setSalvando(false)
      if (error) { alert('Erro ao registrar parcelas: ' + error.message); return }
      setShowModal(false)
      carregarMovimentacoes(ano)
      carregarPendencias()
      return
    }

    const payload = {
      tipo: form.tipo,
      descricao: form.descricao,
      categoria: form.categoria,
      id_paciente: form.id_paciente || null,
      valor: Number(form.valor),
      data: form.data,
      pago: form.pago,
      recorrente: form.recorrente,
      data_vencimento: form.pago ? null : (form.data_vencimento || null),
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
    carregarPendencias()
  }

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir esta movimentação?')) return
    const { error } = await supabase.from('movimentacoes_financeiras').delete().eq('id', id)
    if (error) { alert('Erro ao excluir: ' + error.message); return }
    setMovimentacoes((prev) => prev.filter((m) => m.id !== id))
    setPendencias((prev) => prev.filter((m) => m.id !== id))
  }

  const handleMarcarPago = async (m) => {
    const { error } = await supabase
      .from('movimentacoes_financeiras')
      .update({ pago: true, data_vencimento: null })
      .eq('id', m.id)
    if (error) { alert('Erro ao atualizar: ' + error.message); return }
    setPendencias((prev) => prev.filter((p) => p.id !== m.id))
    setMovimentacoes((prev) => prev.map((mv) => (mv.id === m.id ? { ...mv, pago: true, data_vencimento: null } : mv)))
  }

  const hojeStr = new Date().toISOString().slice(0, 10)
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

      {pacienteFiltro && (
        <div className="flex items-center gap-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-semibold px-3 py-2 rounded-lg w-fit">
          Filtrando por: {pacienteFiltro.nome_completo}
          <button onClick={() => setPacienteFiltro(null)} title="Limpar filtro" className="hover:text-primary-900 dark:hover:text-primary-200">
            <X size={13} />
          </button>
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200 dark:border-slate-800">
        <button
          onClick={() => setAbaAtiva('movimentacoes')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            abaAtiva === 'movimentacoes'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
          }`}
        >
          Movimentações
        </button>
        <button
          onClick={() => setAbaAtiva('pendencias')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            abaAtiva === 'pendencias'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
          }`}
        >
          Pendências
          {pendenciasFiltradas.length > 0 && (
            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full px-1.5 py-0.5">
              {pendenciasFiltradas.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAbaAtiva('fluxo')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            abaAtiva === 'fluxo'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
          }`}
        >
          Fluxo de Caixa
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

      {abaAtiva === 'movimentacoes' && (
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
                  <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                    {m.descricao}
                    {(m.recorrente || m.id_origem) && (
                      <Repeat size={11} className="text-gray-400 dark:text-slate-500 shrink-0" title="Movimentação recorrente" />
                    )}
                  </p>
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
                  {m.tipo === 'receita' && m.pago && (
                    <button onClick={() => setMovimentacaoParaRecibo(m)} title="Gerar recibo" className="text-gray-400 hover:text-emerald-600 p-1">
                      <Receipt size={14} />
                    </button>
                  )}
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
      )}

      {abaAtiva === 'pendencias' && (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {carregandoPendencias ? (
          <p className="text-sm text-primary-600 font-semibold text-center py-8 animate-pulse">Carregando...</p>
        ) : pendenciasFiltradas.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-8">Nenhuma pendência — tudo pago e recebido.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {pendenciasFiltradas.map((m) => {
              const atrasado = m.data_vencimento && m.data_vencimento < hojeStr
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-800 dark:text-slate-100 truncate">{m.descricao}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      {m.categoria}
                      {m.pacientes?.nome_completo && <> · {m.pacientes.nome_completo}</>}
                      {m.data_vencimento && (
                        <span className={atrasado ? 'text-red-600 dark:text-red-400 font-semibold' : ''}>
                          {' '}· vence {formatarData(m.data_vencimento)}{atrasado ? ' (atrasado)' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {atrasado && <AlertTriangle size={14} className="text-red-500" />}
                    <span className={`text-sm font-black ${m.tipo === 'receita' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {m.tipo === 'receita' ? '+' : '-'} {fmtMoeda(m.valor)}
                    </span>
                    <button
                      onClick={() => handleMarcarPago(m)}
                      title={m.tipo === 'receita' ? 'Marcar como recebido' : 'Marcar como pago'}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    >
                      <Check size={13} /> {m.tipo === 'receita' ? 'Recebido' : 'Pago'}
                    </button>
                    <button onClick={() => abrirEdicao(m)} className="text-gray-400 hover:text-primary-600 p-1">
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      )}

      {abaAtiva === 'fluxo' && (
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-black text-gray-800 dark:text-slate-100">Fluxo de Caixa</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 mb-4">
          Quanto entrou e saiu do caixa em cada mês de {ano}.
        </p>
        {loading ? (
          <p className="text-sm text-primary-600 font-semibold text-center py-8 animate-pulse">Carregando...</p>
        ) : (
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosFluxoCaixa} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => fmtMoeda(v).replace(/,00$/, '')}
                  width={80}
                />
                <Tooltip formatter={(v) => fmtMoeda(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Receitas" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      )}

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

              {!editingId && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">Número de parcelas</label>
                  <select
                    value={form.numero_parcelas}
                    onChange={(e) => setForm({ ...form, numero_parcelas: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}x{n > 1 ? ` de ${fmtMoeda(Number(form.valor || 0) / n)}` : ''}</option>
                    ))}
                  </select>
                  {form.numero_parcelas > 1 && (
                    <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
                      Cria {form.numero_parcelas} movimentações, uma por mês a partir da data abaixo, cada uma pendente até você marcar como paga.
                    </p>
                  )}
                </div>
              )}

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

              {form.numero_parcelas <= 1 && (
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
              )}

              {form.numero_parcelas <= 1 && !form.pago && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Data de vencimento (opcional)
                  </label>
                  <input
                    type="date"
                    value={form.data_vencimento}
                    onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Alimenta a aba Pendências, com alerta pro que estiver atrasado.</p>
                </div>
              )}

              {form.numero_parcelas <= 1 && (
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={form.recorrente}
                  onChange={(e) => setForm({ ...form, recorrente: e.target.checked })}
                  className="w-4 h-4 accent-primary-600"
                />
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                  <Repeat size={13} /> Se repete todo mês
                </span>
              </label>
              )}
              {form.numero_parcelas <= 1 && form.recorrente && (
                <p className="text-[11px] text-gray-500 dark:text-slate-400 -mt-2">
                  Todo dia 1, uma cópia é gerada automaticamente pro mês, com o mesmo dia e valor (você pode editar cada cópia depois).
                </p>
              )}

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

      {movimentacaoParaRecibo && (
        <GeradorPdfRecibo
          movimentacao={movimentacaoParaRecibo}
          avaliadorUserId={userId}
          aoFechar={() => setMovimentacaoParaRecibo(null)}
        />
      )}
    </div>
  )
}
