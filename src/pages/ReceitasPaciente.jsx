import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useTheme } from '../contexts/ThemeContext'
import CabecalhoPortalPaciente from '../components/CabecalhoPortalPaciente'
import NavegacaoPortalPaciente from '../components/NavegacaoPortalPaciente'
import { baixarPdfReceita } from '../components/GeradorPdfReceita'
import { ChevronDown, ChevronRight, ChefHat, Clock, Layers, FileDown } from 'lucide-react'

function fmtNum(n) {
  const v = Number(n)
  return Number.isFinite(v) ? (Math.round(v * 10) / 10).toString().replace('.', ',') : '-'
}

export default function ReceitasPaciente() {
  const { tokenUrl } = useParams()
  const navigate = useNavigate()
  const { setDarkMode, setCorPrimaria } = useTheme()

  const [loading, setLoading] = useState(true)
  const [paciente, setPaciente] = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [nomeAvaliador, setNomeAvaliador] = useState('')
  const [logomarcaUrl, setLogomarcaUrl] = useState('')
  const [receitas, setReceitas] = useState([])
  const [abertas, setAbertas] = useState(new Set())
  const [sessaoAtiva, setSessaoAtiva] = useState(false)
  const [tokenLaudo, setTokenLaudo] = useState('')
  const [baixandoId, setBaixandoId] = useState(null)

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
            setDarkMode(pacData.tema_dark_mode != null ? pacData.tema_dark_mode : !!configData.dark_mode)
            if (configData.cor_primaria) setCorPrimaria(configData.cor_primaria)
          }
        }
      }

      const [receitasRes, avalRes] = await Promise.all([
        supabase
          .from('receitas_pacientes')
          .select('id, receitas(*)')
          .eq('id_paciente', pacData.id)
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

      const lista = (receitasRes.data || []).map((rp) => rp.receitas).filter(Boolean)
      setReceitas(lista)
      if (lista.length === 1) setAbertas(new Set([lista[0].id]))
      setTokenLaudo(avalRes.data?.token_publico || '')
      setLoading(false)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenUrl])

  const toggleAberta = (id) => {
    setAbertas((prev) => {
      const novo = new Set(prev)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  const handleBaixarPdf = async (receita) => {
    setBaixandoId(receita.id)
    try {
      await baixarPdfReceita(receita)
    } finally {
      setBaixandoId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-primary-600 font-bold animate-pulse">Carregando receitas...</p>
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
          <NavegacaoPortalPaciente tokenPaciente={tokenUrl} tokenLaudo={tokenLaudo} ativo="receitas" />
        )}

        <div>
          <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">Receitas</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{paciente.nome_completo}</p>
        </div>

        {receitas.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm text-center">
            <p className="text-gray-500 dark:text-slate-400 text-sm">Nenhuma receita disponível ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receitas.map((r) => {
              const aberta = abertas.has(r.id)
              const rendimento = Number(r.rendimento_porcoes) || 0
              const porcaoG = rendimento > 0 && r.peso_final_g ? Number(r.peso_final_g) / rendimento : null
              return (
                <div key={r.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <button type="button" onClick={() => toggleAberta(r.id)} className="w-full flex items-center gap-3 text-left p-4">
                    {aberta ? (
                      <ChevronDown size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400 dark:text-slate-500 shrink-0" />
                    )}
                    {r.imagem_url ? (
                      <img src={r.imagem_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <ChefHat size={18} className="text-gray-300 dark:text-slate-600" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-black text-gray-800 dark:text-slate-100 truncate block">{r.nome}</span>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-slate-500">
                        {r.tempo_preparo_min ? (
                          <span className="flex items-center gap-0.5"><Clock size={11} /> {r.tempo_preparo_min} min</span>
                        ) : null}
                        {r.rendimento_porcoes ? (
                          <span className="flex items-center gap-0.5"><Layers size={11} /> {fmtNum(r.rendimento_porcoes)} porç{rendimento === 1 ? 'ão' : 'ões'}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                  {aberta && (
                    <div className="px-4 pb-4 space-y-3">
                      {r.imagem_url && (
                        <img src={r.imagem_url} alt="" className="w-full max-w-xs rounded-xl border border-gray-100 dark:border-slate-800 object-cover" />
                      )}
                      {r.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {r.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {r.descricao && <p className="text-sm text-gray-600 dark:text-slate-300 italic">{r.descricao}</p>}
                      {r.modo_preparo ? (
                        <div className="rte-html text-sm text-gray-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: r.modo_preparo }} />
                      ) : null}
                      {r.energia_kcal ? (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                          {[
                            ['Energia', 'energia_kcal', 'kcal'],
                            ['Proteína', 'proteina_g', 'g'],
                            ['Lipídios', 'lipidios_g', 'g'],
                            ['Carboidrato', 'carboidrato_g', 'g'],
                            ['Fibra', 'fibra_g', 'g'],
                          ].map(([label, campo, unidade]) => {
                            const total = Number(r[campo]) || 0
                            const valor = porcaoG ? total / rendimento : total
                            return (
                              <div key={campo}>
                                <p className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
                                <p className="text-sm font-black text-gray-800 dark:text-slate-100">{fmtNum(valor)}{unidade}</p>
                              </div>
                            )
                          })}
                          <p className="col-span-full text-[10px] text-gray-400 dark:text-slate-500 -mt-1">
                            {porcaoG ? `Por porção (${fmtNum(porcaoG)}g)` : 'Receita inteira'}
                          </p>
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleBaixarPdf(r)}
                        disabled={baixandoId === r.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50"
                      >
                        <FileDown size={14} /> {baixandoId === r.id ? 'Gerando...' : 'Baixar PDF'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
