import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SidebarPaciente from '../components/SidebarPaciente'
import InterruptorVisibilidade from '../components/InterruptorVisibilidade'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { calcularMacrosItem, somarMacros } from '../utils/calculoNutricional'

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Diferença aceitável entre kcal real (registrado pelo paciente) e kcal
// prescrito daquela refeição pra considerar "dentro da meta" (carinha
// verde). Fácil de ajustar se 20% ficar rígido/solto demais na prática.
const TOLERANCIA_KCAL = 0.20

function diasNoMes(ano, mes) {
  return new Date(ano, mes + 1, 0).getDate()
}

function formatarDataISO(ano, mes, dia) {
  return `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

export default function DiarioAlimentarNutri({ userId }) {
  const { id } = useParams()

  const [paciente, setPaciente] = useState(null)
  const [itemAtivo, setItemAtivo] = useState('diario_alimentar')
  const [loading, setLoading] = useState(true)
  const [refeicoes, setRefeicoes] = useState([]) // [{ nome_refeicao, kcalPrescrito }]
  const [registros, setRegistros] = useState([])
  const [observacoes, setObservacoes] = useState([])
  const [ano, setAno] = useState(new Date().getFullYear())
  const [mes, setMes] = useState(new Date().getMonth())
  const [celulaSelecionada, setCelulaSelecionada] = useState(null) // { dia, nomeRefeicao }

  useEffect(() => {
    const carregar = async () => {
      const { data: pacData } = await supabase.from('pacientes').select('*').eq('id', id).maybeSingle()
      setPaciente(pacData || null)

      const { data: planoData } = await supabase
        .from('planos_alimentares')
        .select('id, refeicoes_prescritas(id, nome_refeicao, horario, ordem, itens_refeicao(*, tabela_alimentos(*)))')
        .eq('id_paciente', id)
        .eq('ativo', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const listaRefeicoes = (planoData?.refeicoes_prescritas || [])
        .slice()
        .sort((a, b) => {
          if (a.horario && b.horario) return a.horario.localeCompare(b.horario)
          if (a.horario) return -1
          if (b.horario) return 1
          return (a.ordem || 0) - (b.ordem || 0)
        })
        .map((r) => ({
          nome_refeicao: r.nome_refeicao,
          horario: r.horario,
          kcalPrescrito: somarMacros((r.itens_refeicao || []).map(calcularMacrosItem)).kcal,
        }))
      setRefeicoes(listaRefeicoes)
      setLoading(false)
    }
    carregar()
  }, [id])

  const toggleDiarioAtivo = async () => {
    const novoValor = paciente.diario_alimentar_ativo === false
    const { error } = await supabase.from('pacientes').update({ diario_alimentar_ativo: novoValor }).eq('id', paciente.id)
    if (error) return alert('Erro ao atualizar: ' + error.message)
    setPaciente((prev) => ({ ...prev, diario_alimentar_ativo: novoValor }))
  }

  useEffect(() => {
    const carregarRegistros = async () => {
      const inicio = formatarDataISO(ano, mes, 1)
      const fim = formatarDataISO(ano, mes, diasNoMes(ano, mes))
      const [registrosRes, observacoesRes] = await Promise.all([
        supabase
          .from('diario_alimentar_itens')
          .select('id, data, nome_refeicao, quantidade_g, quantidade_medida, unidade_medida, tabela_alimentos(*)')
          .eq('id_paciente', id)
          .gte('data', inicio)
          .lte('data', fim),
        supabase
          .from('diario_alimentar_observacoes')
          .select('data, nome_refeicao, observacao')
          .eq('id_paciente', id)
          .gte('data', inicio)
          .lte('data', fim)
          .neq('observacao', ''),
      ])
      setRegistros(registrosRes.data || [])
      setObservacoes(observacoesRes.data || [])
      setCelulaSelecionada(null)
    }
    carregarRegistros()
  }, [id, ano, mes])

  const registrosPorCelula = useMemo(() => {
    const mapa = {}
    for (const r of registros) {
      const chave = `${r.data}__${r.nome_refeicao}`
      if (!mapa[chave]) mapa[chave] = []
      mapa[chave].push(r)
    }
    return mapa
  }, [registros])

  const observacoesPorCelula = useMemo(() => {
    const mapa = {}
    for (const o of observacoes) mapa[`${o.data}__${o.nome_refeicao}`] = o.observacao
    return mapa
  }, [observacoes])

  // Refeições "extras" — o paciente pode registrar algo fora do plano (ver
  // "Comi algo fora do plano" em DiarioAlimentarPaciente.jsx). Entram como
  // coluna também, só que sem meta pra comparar (semMeta), então não tem
  // carinha verde/vermelha, só o kcal registrado mesmo.
  const colunas = useMemo(() => {
    const nomesPlano = new Set(refeicoes.map((r) => r.nome_refeicao))
    const nomesExtras = [...new Set(registros.map((r) => r.nome_refeicao).filter((n) => !nomesPlano.has(n)))]
    return [...refeicoes, ...nomesExtras.map((nome) => ({ nome_refeicao: nome, horario: null, kcalPrescrito: 0, semMeta: true }))]
  }, [refeicoes, registros])

  const totalDias = diasNoMes(ano, mes)
  const hojeISO = new Date().toISOString().slice(0, 10)

  // Grade de calendário de verdade: preenche com células vazias antes do
  // dia 1 (alinhado no dia da semana certo) e depois do último dia (pra
  // fechar semanas completas de 7).
  const offsetPrimeiroDia = new Date(ano, mes, 1).getDay()
  const celulasCalendario = [
    ...Array.from({ length: offsetPrimeiroDia }, () => null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ]
  while (celulasCalendario.length % 7 !== 0) celulasCalendario.push(null)

  const mudarMes = (delta) => {
    let novoMes = mes + delta
    let novoAno = ano
    if (novoMes < 0) { novoMes = 11; novoAno -= 1 }
    if (novoMes > 11) { novoMes = 0; novoAno += 1 }
    setMes(novoMes)
    setAno(novoAno)
  }

  const itensCelula = celulaSelecionada
    ? registrosPorCelula[`${formatarDataISO(ano, mes, celulaSelecionada.dia)}__${celulaSelecionada.nomeRefeicao}`] || []
    : []
  const observacaoCelula = celulaSelecionada
    ? observacoesPorCelula[`${formatarDataISO(ano, mes, celulaSelecionada.dia)}__${celulaSelecionada.nomeRefeicao}`]
    : null

  if (loading) {
    return <div className="p-8 text-center text-primary-600 font-bold">Carregando...</div>
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
      <SidebarPaciente paciente={paciente} itemAtivo={itemAtivo} onSelecionarItem={setItemAtivo} />

      <div className="flex-1 min-w-0 space-y-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-black text-gray-800 dark:text-slate-100">Diário Alimentar — {paciente?.nome_completo}</h2>
            <InterruptorVisibilidade
              ativo={paciente?.diario_alimentar_ativo !== false}
              onToggle={toggleDiarioAtivo}
              titulo={paciente?.diario_alimentar_ativo !== false ? 'Diário ativo pro paciente — clique pra desativar' : 'Diário desativado pro paciente — clique pra ativar'}
              textoAtivo="Diário ativo"
              textoInativo="Diário desativado"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Cada bolinha é uma refeição registrada naquele dia:</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> até {TOLERANCIA_KCAL * 100}% da meta</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> acima disso</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" /> fora do plano (sem meta)</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> só observação (sem comida)</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> tem observação do paciente</span>
          </p>
        </div>

        {paciente?.diario_alimentar_ativo === false ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-sm text-gray-400 dark:text-slate-500">Diário desativado pra esse paciente — ative acima pra ele voltar a registrar e você ver o comparativo aqui.</p>
          </div>
        ) : refeicoes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-sm text-gray-400 dark:text-slate-500">Esse paciente não tem um plano alimentar ativo — o diário precisa de um plano pra comparar.</p>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center justify-center gap-3 p-3 border-b border-gray-100 dark:border-slate-800">
                <button onClick={() => mudarMes(-1)} className="p-1.5 text-gray-400 hover:text-primary-600">
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm font-bold text-gray-800 dark:text-slate-100">{MESES[mes]} {ano}</span>
                <button onClick={() => mudarMes(1)} className="p-1.5 text-gray-400 hover:text-primary-600">
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="p-2 sm:p-3">
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DIAS_SEMANA.map((d) => (
                    <div key={d} className="text-center text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider py-1">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {celulasCalendario.map((dia, i) => {
                    if (dia === null) return <div key={`vazio-${i}`} />
                    const dataISO = formatarDataISO(ano, mes, dia)
                    const futuro = dataISO > hojeISO
                    const ehHoje = dataISO === hojeISO
                    return (
                      <div
                        key={dia}
                        className={`min-h-[64px] sm:min-h-[76px] rounded-lg border p-1.5 flex flex-col gap-1 ${
                          ehHoje
                            ? 'border-primary-400 bg-primary-50/40 dark:bg-primary-900/10'
                            : 'border-gray-100 dark:border-slate-800'
                        } ${futuro ? 'opacity-40' : ''}`}
                      >
                        <span className="text-[11px] font-bold text-gray-600 dark:text-slate-400">{dia}</span>
                        <div className="flex flex-wrap gap-1">
                          {colunas.map((r) => {
                            const chaveCelula = `${dataISO}__${r.nome_refeicao}`
                            const itens = registrosPorCelula[chaveCelula] || []
                            const temObservacao = !!observacoesPorCelula[chaveCelula]
                            // Uma refeição pode ter só observação, sem nenhum alimento
                            // registrado (paciente quis avisar algo sem logar comida) —
                            // ainda precisa de uma bolinha clicável pra não ficar invisível.
                            if (itens.length === 0 && !temObservacao) return null
                            const kcalReal = somarMacros(itens.map(calcularMacrosItem)).kcal
                            const dentro = r.kcalPrescrito > 0 && Math.abs(kcalReal - r.kcalPrescrito) / r.kcalPrescrito <= TOLERANCIA_KCAL
                            const ativa = celulaSelecionada?.dia === dia && celulaSelecionada?.nomeRefeicao === r.nome_refeicao
                            const cor = itens.length === 0 ? 'bg-sky-400' : r.semMeta ? 'bg-purple-400' : dentro ? 'bg-emerald-500' : 'bg-red-500'
                            return (
                              <button
                                key={r.nome_refeicao}
                                onClick={() => setCelulaSelecionada(ativa ? null : { dia, nomeRefeicao: r.nome_refeicao })}
                                title={`${r.nome_refeicao}${itens.length > 0 ? `: ${Math.round(kcalReal)} kcal${r.semMeta ? '' : ` · meta ${Math.round(r.kcalPrescrito)} kcal`}` : ''}${temObservacao ? ' · com observação' : ''}`}
                                className={`relative w-3 h-3 rounded-full ${cor} transition-transform ${ativa ? 'ring-2 ring-offset-1 ring-primary-500 scale-125' : ''}`}
                              >
                                {temObservacao && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 border border-white dark:border-slate-900" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {celulaSelecionada && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  {celulaSelecionada.nomeRefeicao} · dia {celulaSelecionada.dia}/{mes + 1}
                </p>
                <div className="space-y-1.5">
                  {itensCelula.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg text-sm">
                      <span className="text-gray-700 dark:text-slate-300">{item.tabela_alimentos?.nome}</span>
                      <span className="text-gray-400 dark:text-slate-500 shrink-0">{Math.round(item.quantidade_g)}g</span>
                    </div>
                  ))}
                  {itensCelula.length === 0 && !observacaoCelula && (
                    <p className="text-xs text-gray-400 dark:text-slate-500">Nada registrado.</p>
                  )}
                </div>
                {observacaoCelula && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Observação do paciente</p>
                    <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">{observacaoCelula}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
