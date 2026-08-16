import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useTheme } from '../contexts/ThemeContext'
import CabecalhoPortalPaciente from '../components/CabecalhoPortalPaciente'
import NavegacaoPortalPaciente from '../components/NavegacaoPortalPaciente'
import { ChevronDown, ChevronRight, StickyNote } from 'lucide-react'

// Mesmas funções puras de src/pages/PlanoAlimentar.jsx (duplicadas de
// propósito em vez de importadas — essa página é pública/paciente e não
// deveria puxar o bundle inteiro do editor do nutri).
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

function calcularMacrosItem(item) {
  const alimento = item.tabela_alimentos
  if (!alimento || item.ignorar_nos_calculos) return { kcal: 0, proteina: 0, carbo: 0, lipidio: 0, fibra: 0 }
  const fator = (Number(item.quantidade_g) || 0) / 100
  return {
    kcal: (alimento.energia_kcal || 0) * fator,
    proteina: (alimento.proteina_g || 0) * fator,
    carbo: (alimento.carboidrato_g || 0) * fator,
    lipidio: (alimento.lipidios_g || 0) * fator,
    fibra: (alimento.fibra_g || 0) * fator,
  }
}

function somarMacros(lista) {
  return lista.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      proteina: acc.proteina + m.proteina,
      carbo: acc.carbo + m.carbo,
      lipidio: acc.lipidio + m.lipidio,
      fibra: acc.fibra + (m.fibra || 0),
    }),
    { kcal: 0, proteina: 0, carbo: 0, lipidio: 0, fibra: 0 }
  )
}

function fmt(n) {
  return Number.isFinite(n) ? n.toFixed(1).replace(/\.0$/, '') : '0'
}

function compararRefeicoes(a, b) {
  const ha = a.horario || '99:99'
  const hb = b.horario || '99:99'
  if (ha !== hb) return ha < hb ? -1 : 1
  return a.ordem - b.ordem
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

function BlocoRefeicao({ refeicao, aberta, aoAlternar, mostrarMacros }) {
  const opcoes = [...new Set((refeicao.itens_refeicao || []).map((i) => i.opcao_numero))].sort((a, b) => a - b)
  return (
    <div className="border border-gray-100 dark:border-slate-800 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={aoAlternar}
        className="w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50"
      >
        {aberta ? (
          <ChevronDown size={15} className="text-gray-400 dark:text-slate-500 shrink-0" />
        ) : (
          <ChevronRight size={15} className="text-gray-400 dark:text-slate-500 shrink-0" />
        )}
        {refeicao.horario && <span className="text-sm font-semibold text-gray-400 dark:text-slate-500">{refeicao.horario.slice(0, 5)}</span>}
        <h3 className="text-base font-black text-gray-800 dark:text-slate-100">{refeicao.nome_refeicao}</h3>
      </button>
      {aberta && (
        <div className="px-3 pb-3 space-y-3">
          {refeicao.imagem_url && (
            <img src={refeicao.imagem_url} alt="" className="w-full h-32 object-cover rounded-lg border border-gray-100 dark:border-slate-800" />
          )}
          <div className="flex flex-wrap gap-3">
            {(opcoes.length > 0 ? opcoes : [1]).map((n) => {
              const itensOpcao = (refeicao.itens_refeicao || []).filter((i) => i.opcao_numero === n)
              const macrosOpcao = mostrarMacros ? somarMacros(itensOpcao.map(calcularMacrosItem)) : null
              return (
                <div key={n} className="rounded-lg border border-gray-100 dark:border-slate-800 p-3 flex-1 min-w-[220px]">
                  {opcoes.length > 1 && (
                    <p className="text-xs font-black text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Opção {n}</p>
                  )}
                  <ul className="space-y-2.5">
                    {itensOpcao.map((item) => {
                      const substitutos = [...(item.substitutos_item || [])].sort((a, b) => a.ordem - b.ordem)
                      return (
                        <li key={item.id} className="text-sm text-gray-700 dark:text-slate-300">
                          <span className="font-semibold text-gray-800 dark:text-slate-100">{item.nome_customizado || item.tabela_alimentos?.nome || 'Alimento'}</span>
                          <span className="text-gray-400 dark:text-slate-500">
                            {' '}— {item.unidade_medida === 'a_vontade'
                              ? 'à vontade'
                              : item.unidade_medida && item.quantidade_medida
                                ? `${item.quantidade_medida} ${labelUnidade(item.unidade_medida)} (≈${item.quantidade_g}g)`
                                : `${item.quantidade_g}g`}
                          </span>
                          {substitutos.length > 0 && (
                            <ul className="mt-1 pl-3 border-l-2 border-gray-200 dark:border-slate-700 space-y-0.5">
                              {substitutos.map((s) => (
                                <li key={s.id} className="text-xs text-gray-500 dark:text-slate-400">
                                  <span className="font-bold text-gray-400 dark:text-slate-500">OU</span>{' '}
                                  {s.tabela_alimentos?.nome || 'Alimento'} —{' '}
                                  {s.unidade_medida === 'a_vontade'
                                    ? 'à vontade'
                                    : s.unidade_medida && s.quantidade_medida
                                      ? `${s.quantidade_medida} ${labelUnidade(s.unidade_medida)} (≈${s.quantidade_g}g)`
                                      : `${s.quantidade_g}g`}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                  {mostrarMacros && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800">
                      {fmt(macrosOpcao.kcal)}kcal · Prt. {fmt(macrosOpcao.proteina)}g · Carbo. {fmt(macrosOpcao.carbo)}g · Lip. {fmt(macrosOpcao.lipidio)}g
                    </p>
                  )}
                </div>
              )
            })}
          </div>
          {refeicao.nota && (
            <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 rounded-lg flex items-start gap-2">
              <StickyNote size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-300 whitespace-pre-wrap">{refeicao.nota}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BlocoPlano({ plano, aberto, aoAlternar, refeicoesAbertas, aoAlternarRefeicao }) {
  const mostrarMacros = plano.mostrar_macros !== false
  const refeicoesOrdenadas = [...(plano.refeicoes_prescritas || [])].sort(compararRefeicoes)
  const totalDia = mostrarMacros
    ? somarMacros(refeicoesOrdenadas.flatMap((r) => (r.itens_refeicao || []).filter((i) => i.opcao_numero === 1).map(calcularMacrosItem)))
    : null

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={aoAlternar}
        className="w-full flex items-center gap-2 p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50"
      >
        {aberto ? (
          <ChevronDown size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <span className="text-base font-black text-gray-800 dark:text-slate-100 truncate block">{plano.titulo}</span>
          <p className="text-xs text-gray-400 dark:text-slate-500">Criado em {formatarData(plano.created_at)}</p>
        </div>
      </button>

      {aberto && (
        <div className="px-4 pb-4 space-y-3">
          {mostrarMacros && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-base bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3">
              <div>
                <p className="text-gray-400 dark:text-slate-500 text-sm">Calorias</p>
                <p className="font-black text-gray-800 dark:text-slate-100">
                  {fmt(totalDia.kcal)} {plano.vet_target ? `/ ${plano.vet_target}` : ''} kcal
                </p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-slate-500 text-sm">Proteína</p>
                <p className="font-black text-gray-800 dark:text-slate-100">{fmt(totalDia.proteina)}g</p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-slate-500 text-sm">Carboidrato</p>
                <p className="font-black text-gray-800 dark:text-slate-100">{fmt(totalDia.carbo)}g</p>
              </div>
              <div>
                <p className="text-gray-400 dark:text-slate-500 text-sm">Lipídio</p>
                <p className="font-black text-gray-800 dark:text-slate-100">{fmt(totalDia.lipidio)}g</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {refeicoesOrdenadas.map((refeicao) => (
              <BlocoRefeicao
                key={refeicao.id}
                refeicao={refeicao}
                aberta={refeicoesAbertas.has(refeicao.id)}
                aoAlternar={() => aoAlternarRefeicao(refeicao.id)}
                mostrarMacros={mostrarMacros}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlanoAlimentarPaciente() {
  const { tokenUrl } = useParams()
  const navigate = useNavigate()
  const { setDarkMode, setCorPrimaria } = useTheme()

  const [loading, setLoading] = useState(true)
  const [paciente, setPaciente] = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [nomeAvaliador, setNomeAvaliador] = useState('')
  const [logomarcaUrl, setLogomarcaUrl] = useState('')
  const [planos, setPlanos] = useState([])
  const [planosAbertos, setPlanosAbertos] = useState(new Set())
  const [refeicoesAbertas, setRefeicoesAbertas] = useState(new Set())
  const [sessaoAtiva, setSessaoAtiva] = useState(false)
  const [tokenLaudo, setTokenLaudo] = useState('')

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)

      const { data: authData } = await supabase.auth.getUser()
      setSessaoAtiva(!!authData?.user)

      const { data: pacData } = await supabase
        .from('pacientes')
        .select('*')
        .eq('token_publico', tokenUrl)
        .maybeSingle()

      if (!pacData) { setLoading(false); return }
      setPaciente(pacData)

      if (pacData.id_avaliador) {
        const { data: avalData } = await supabase
          .from('avaliadores')
          .select('auth_id, empresa, nome_completo, logomarca_url')
          .eq('auth_id', pacData.id_avaliador)
          .maybeSingle()

        if (avalData) {
          setNomeEmpresa(avalData.empresa || '')
          setNomeAvaliador(avalData.nome_completo || '')
          setLogomarcaUrl(avalData.logomarca_url || '')

          const { data: configData } = await supabase
            .from('configuracoes_avaliador')
            .select('dark_mode, cor_primaria')
            .eq('auth_id', avalData.auth_id)
            .maybeSingle()

          if (configData) {
            setDarkMode(!!configData.dark_mode)
            if (configData.cor_primaria) setCorPrimaria(configData.cor_primaria)
          }
        }
      }

      const [planosRes, avalRes] = await Promise.all([
        supabase
          .from('planos_alimentares')
          .select('*, refeicoes_prescritas(*, itens_refeicao(*, tabela_alimentos(*), substitutos_item(*, tabela_alimentos(*))))')
          .eq('id_paciente', pacData.id)
          .eq('ativo', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('avaliacoes')
          .select('token_publico')
          .eq('id_paciente', pacData.id)
          .eq('visivel_paciente', true)
          .order('data_avaliacao', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      const listaPlanos = planosRes.data || []
      setPlanos(listaPlanos)
      if (listaPlanos.length > 0) setPlanosAbertos(new Set([listaPlanos[0].id]))
      setTokenLaudo(avalRes.data?.token_publico || '')
      setLoading(false)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenUrl])

  const alternarPlano = (id) => {
    setPlanosAbertos((prev) => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  const alternarRefeicao = (id) => {
    setRefeicoesAbertas((prev) => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-primary-600 font-bold animate-pulse">Carregando plano alimentar...</p>
      </div>
    )
  }

  if (!paciente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-gray-700 dark:text-slate-300 font-semibold">Link inválido.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <CabecalhoPortalPaciente
          logomarcaUrl={logomarcaUrl}
          nomeEmpresa={nomeEmpresa}
          nomeAvaliador={nomeAvaliador}
          aoVoltar={() => navigate(`/area/${tokenUrl}`)}
        />

        {!sessaoAtiva && (
          <NavegacaoPortalPaciente tokenPaciente={tokenUrl} tokenLaudo={tokenLaudo} ativo="plano" />
        )}

        <div>
          <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">Plano Alimentar</h2>
          <p className="text-base text-gray-500 dark:text-slate-400 mt-0.5">{paciente.nome_completo}</p>
        </div>

        {planos.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhum plano alimentar visível no momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {planos.map((plano) => (
              <BlocoPlano
                key={plano.id}
                plano={plano}
                aberto={planosAbertos.has(plano.id)}
                aoAlternar={() => alternarPlano(plano.id)}
                refeicoesAbertas={refeicoesAbertas}
                aoAlternarRefeicao={alternarRefeicao}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
