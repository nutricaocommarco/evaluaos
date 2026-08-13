import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useTheme } from '../contexts/ThemeContext'
import CabecalhoPortalPaciente from '../components/CabecalhoPortalPaciente'
import NavegacaoPortalPaciente from '../components/NavegacaoPortalPaciente'
import GeradorPdfSolicitacaoExames from '../components/GeradorPdfSolicitacaoExames'
import { ChevronDown, ChevronRight, FileDown } from 'lucide-react'

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

function formatarDataColeta(dataStr) {
  if (!dataStr) return '-'
  const [ano, mes, dia] = dataStr.split('-')
  return `${dia}/${mes}/${ano}`
}

// Mesma lógica de classificação de PlanoAlimentar/ExamesLaboratoriais
// (nutri) — nunca salva, calculada na hora comparando o valor obtido
// (que pode ser texto puro, tipo "Não Reagente") contra o intervalo.
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

// Grid (não flex justify-between) — com justify-between o valor "flutua"
// numa posição diferente em cada linha dependendo do próprio tamanho do
// texto; em grid, nome/valor/classificação sempre alinham em colunas.
function LinhaExameLeitura({ item }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_72px] items-center gap-3 px-3 py-2 text-xs">
      <span className="font-semibold text-gray-700 dark:text-slate-300 truncate">{item.nome_exame}</span>
      <span className="text-gray-500 dark:text-slate-400 text-right whitespace-nowrap">
        {item.valor_obtido || '-'} {item.unidade}
      </span>
      <span className="flex justify-end">
        <BadgeClassificacao valorObtido={item.valor_obtido} min={item.intervalo_min} max={item.intervalo_max} />
      </span>
    </div>
  )
}

export default function ExamesLaboratoriaisPaciente() {
  const { tokenUrl } = useParams()
  const navigate = useNavigate()
  const { setDarkMode, setCorPrimaria } = useTheme()

  const [loading, setLoading] = useState(true)
  const [paciente, setPaciente] = useState(null)
  const [avaliador, setAvaliador] = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [nomeAvaliador, setNomeAvaliador] = useState('')
  const [logomarcaUrl, setLogomarcaUrl] = useState('')
  const [sessaoAtiva, setSessaoAtiva] = useState(false)
  const [tokenLaudo, setTokenLaudo] = useState('')

  const [aba, setAba] = useState('solicitacoes')
  const [solicitacoes, setSolicitacoes] = useState([])
  const [registros, setRegistros] = useState([])
  const [gruposPorRegistro, setGruposPorRegistro] = useState({})
  const [itensPorRegistro, setItensPorRegistro] = useState({})
  const [abertos, setAbertos] = useState(new Set())
  const [pdfSolicitacaoAtiva, setPdfSolicitacaoAtiva] = useState(null)

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
          .select('auth_id, empresa, nome_completo, logomarca_url, crn_numep')
          .eq('auth_id', pacData.id_avaliador)
          .maybeSingle()

        if (avalData) {
          setAvaliador(avalData)
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

      const [solRes, regRes, avalRes] = await Promise.all([
        supabase
          .from('exames_solicitacoes')
          .select('*')
          .eq('id_paciente', pacData.id)
          .eq('visivel_paciente', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('exames_registros')
          .select('*')
          .eq('id_paciente', pacData.id)
          .eq('visivel_paciente', true)
          .order('data_coleta', { ascending: false }),
        supabase
          .from('avaliacoes')
          .select('token_publico')
          .eq('id_paciente', pacData.id)
          .eq('visivel_paciente', true)
          .order('data_avaliacao', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      setSolicitacoes(solRes.data || [])
      const listaRegistros = regRes.data || []
      setRegistros(listaRegistros)
      setTokenLaudo(avalRes.data?.token_publico || '')

      if (listaRegistros.length > 0) {
        const idsRegistros = listaRegistros.map((r) => r.id)
        const [gruposRes, itensRes] = await Promise.all([
          supabase.from('exames_registros_grupos').select('*').in('id_registro', idsRegistros).order('ordem'),
          supabase.from('exames_registros_itens').select('*').in('id_registro', idsRegistros).order('ordem'),
        ])
        const grupos = {}
        ;(gruposRes.data || []).forEach((g) => {
          if (!grupos[g.id_registro]) grupos[g.id_registro] = []
          grupos[g.id_registro].push(g)
        })
        const itens = {}
        ;(itensRes.data || []).forEach((i) => {
          if (!itens[i.id_registro]) itens[i.id_registro] = []
          itens[i.id_registro].push(i)
        })
        setGruposPorRegistro(grupos)
        setItensPorRegistro(itens)
      }

      setLoading(false)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenUrl])

  const toggleAberto = (chave) => {
    setAbertos((prev) => {
      const novo = new Set(prev)
      if (novo.has(chave)) novo.delete(chave)
      else novo.add(chave)
      return novo
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-primary-600 font-bold animate-pulse">Carregando exames laboratoriais...</p>
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
          <NavegacaoPortalPaciente tokenPaciente={tokenUrl} tokenLaudo={tokenLaudo} ativo="exames" />
        )}

        <div>
          <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">Exames Laboratoriais</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{paciente.nome_completo}</p>
        </div>

        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold w-fit">
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

        {aba === 'solicitacoes' && (
          solicitacoes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
              <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhuma solicitação de exames liberada aqui ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {solicitacoes.map((s) => {
                const chave = `sol-${s.id}`
                const aberto = abertos.has(chave)
                return (
                  <div key={s.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <button type="button" onClick={() => toggleAberto(chave)} className="flex-1 flex items-center gap-2 text-left min-w-0">
                        {aberto ? (
                          <ChevronDown size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="text-sm font-black text-gray-800 dark:text-slate-100 truncate block">{s.titulo}</span>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500">{formatarData(s.created_at)}</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setPdfSolicitacaoAtiva(s)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-semibold rounded-lg hover:bg-primary-100 shrink-0"
                      >
                        <FileDown size={13} /> Gerar PDF
                      </button>
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
          )
        )}

        {aba === 'resultados' && (
          !Object.values(itensPorRegistro).some((lista) => lista.some((i) => (i.valor_obtido || '').trim() !== '')) ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
              <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhum resultado de exames liberado aqui ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {registros.map((r) => {
                const chave = `reg-${r.id}`
                const aberto = abertos.has(chave)
                const grupos = gruposPorRegistro[r.id] || []
                // Exame sem valor obtido ainda é rascunho do nutri (ex: grupo
                // recém-adicionado do catálogo, ninguém preencheu nada) — não
                // é resultado de verdade, não faz sentido mostrar pro paciente.
                const itensDoRegistro = (itensPorRegistro[r.id] || []).filter((i) => (i.valor_obtido || '').trim() !== '')
                const itensAvulsos = itensDoRegistro.filter((i) => i.id_grupo === null)
                if (itensDoRegistro.length === 0) return null
                return (
                  <div key={r.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <button type="button" onClick={() => toggleAberto(chave)} className="w-full flex items-center gap-2 text-left p-4">
                      {aberto ? (
                        <ChevronDown size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="text-sm font-black text-gray-800 dark:text-slate-100 truncate block">{r.titulo}</span>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500">Coleta em {formatarDataColeta(r.data_coleta)}</p>
                      </div>
                    </button>
                    {aberto && (
                      <div className="px-4 pb-4 space-y-3">
                        {grupos.map((g) => {
                          const itensDoGrupo = itensDoRegistro.filter((i) => i.id_grupo === g.id)
                          if (itensDoGrupo.length === 0) return null
                          return (
                            <div key={g.id} className="rounded-lg border border-gray-100 dark:border-slate-800 overflow-hidden">
                              <p className="text-xs font-black text-gray-700 dark:text-slate-300 px-3 py-2 bg-gray-50 dark:bg-slate-800/50">{g.nome}</p>
                              <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
                                {itensDoGrupo.map((item) => (
                                  <LinhaExameLeitura key={item.id} item={item} />
                                ))}
                              </div>
                            </div>
                          )
                        })}
                        {itensAvulsos.length > 0 && (
                          <div className="rounded-lg border border-gray-100 dark:border-slate-800 overflow-hidden">
                            <p className="text-xs font-black text-gray-700 dark:text-slate-300 px-3 py-2 bg-gray-50 dark:bg-slate-800/50">Outros exames</p>
                            <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
                              {itensAvulsos.map((item) => (
                                <LinhaExameLeitura key={item.id} item={item} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

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
