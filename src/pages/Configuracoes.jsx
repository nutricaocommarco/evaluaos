import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Link2, Check, AlertTriangle } from 'lucide-react'

// Importação Modular dos Componentes Separados
import ToleranciasForm from '../components/configuracoes/ToleranciasForm'
import VisibilidadeCamposForm from '../components/configuracoes/VisibilidadeCamposForm'
import EquacaoPadraoForm from '../components/configuracoes/EquacaoPadraoForm'
import VisibilidadePublicaForm from '../components/configuracoes/VisibilidadePublicaForm'
import ExportadorDadosCSV from '../components/configuracoes/ExportadorDadosCSV'
import TemaForm from '../components/configuracoes/TemaForm'
import { DEFAULT_PRIMARY_HEX } from '../utils/colorTheme'

export default function Configuracoes() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('coleta') // 'coleta', 'preferencias', 'privacidade', 'backup', 'afiliados'
  
  const [config, setConfig] = useState({
    tolerancia_dobras: 5.0,
    tolerancia_perimetros: 1.0,
    tolerancia_diametros: 1.0,
    tolerancia_basicas: 1.0,
    campos_visiveis: null,
    equacao_padrao_masculina: 'Mitchell et al. (2020) - 7skf ISAK',
    equacao_padrao_feminina: 'Durnin et al. (1974) - 4skf',
    visibilidade_publica: null,
    dark_mode: false,
    cor_primaria: DEFAULT_PRIMARY_HEX
  })

  // 🔗 COLOQUE O SEU LINK DE AFILIADO DA HOTMART AQUI
  const LINK_AFILIADO_HOTMART = "https://affiliate.hotmart.com/affiliate-recruiting/view/2019E106982311"

  const EMAIL_ADMIN_INDICACOES = 'manjunior007@gmail.com'

  const [codigoIndicacao, setCodigoIndicacao] = useState(null)
  const [chavePixCadastrada, setChavePixCadastrada] = useState(null)
  const [indicados, setIndicados] = useState([])
  const [souAdminIndicacoes, setSouAdminIndicacoes] = useState(false)
  const [carregandoIndicados, setCarregandoIndicados] = useState(true)
  const [linkIndicacaoCopiado, setLinkIndicacaoCopiado] = useState(false)

  useEffect(() => {
    async function carregarConfiguracoes() {
      setLoading(true)
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('configuracoes_avaliador')
        .select('*')
        .eq('auth_id', authData.user.id)
        .maybeSingle()

      if (data) {
        setConfig(data)
      }

      const { data: avalData } = await supabase
        .from('avaliadores')
        .select('id, codigo_indicacao, chave_pix')
        .eq('auth_id', authData.user.id)
        .maybeSingle()

      if (avalData) {
        setCodigoIndicacao(avalData.codigo_indicacao)
        setChavePixCadastrada(avalData.chave_pix || '')

        const ehAdmin = authData.user.email === EMAIL_ADMIN_INDICACOES
        setSouAdminIndicacoes(ehAdmin)

        const query = ehAdmin
          ? supabase
              .from('avaliadores')
              .select('nome_completo, email, plano_status, periodicidade_plano, indicacao_virou_pro_em, indicacao_paga_em, created_at, indicador:indicado_por(nome_completo, email)')
              .not('indicado_por', 'is', null)
              .order('created_at', { ascending: false })
          : supabase
              .from('avaliadores')
              .select('nome_completo, email, plano_status, periodicidade_plano, indicacao_virou_pro_em, indicacao_paga_em, created_at')
              .eq('indicado_por', avalData.id)
              .order('created_at', { ascending: false })

        const { data: indicadosData } = await query

        setIndicados(indicadosData || [])
      }
      setCarregandoIndicados(false)

      setLoading(false)
    }

    carregarConfiguracoes()
  }, [])

  const handleCopiarLinkIndicacao = async () => {
    if (!codigoIndicacao) return
    const link = `${window.location.origin}/login?ref=${codigoIndicacao}`
    await navigator.clipboard.writeText(link)
    setLinkIndicacaoCopiado(true)
    setTimeout(() => setLinkIndicacaoCopiado(false), 2000)
  }

  function statusIndicacao(item) {
    if (item.indicacao_paga_em) {
      return { label: `Pago em ${new Date(item.indicacao_paga_em).toLocaleDateString('pt-BR')}`, cor: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' }
    }
    if (item.indicacao_virou_pro_em) {
      const valor = item.periodicidade_plano === 'mensal' ? 5 : item.periodicidade_plano === 'anual' ? 50 : null
      const liberadoEm = new Date(new Date(item.indicacao_virou_pro_em).getTime() + 7 * 24 * 60 * 60 * 1000)
      const jaLiberado = liberadoEm <= new Date()
      const valorTexto = valor ? `R$ ${valor.toFixed(2).replace('.', ',')}` : 'valor a confirmar'
      return jaLiberado
        ? { label: `Liberado pra pagamento — ${valorTexto}`, cor: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' }
        : { label: `Virou Pro — libera em ${liberadoEm.toLocaleDateString('pt-BR')}`, cor: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' }
    }
    return { label: 'Cadastrado (grátis)', cor: 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400' }
  }

  const handleSalvarTudo = async () => {
    setSaving(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) throw new Error('Usuário não autenticado.')

      const payload = {
        auth_id: authData.user.id,
        ...config
      }

      const { error } = await supabase
        .from('configuracoes_avaliador')
        .upsert(payload, { onConflict: 'auth_id' })

      if (error) throw error
      alert('Configurações salvas com sucesso!')
    } catch (err) {
      alert('Erro ao salvar configurações: ' + err.message)
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="p-8 text-center text-primary-600 font-bold">Carregando preferências...</div>
  }

  const abas = [
    { id: 'coleta', label: 'Formulário & Coleta', icon: '📝' },
    { id: 'preferencias', label: 'Protocolos & Margens', icon: '⚡' },
    { id: 'privacidade', label: 'Visibilidade', icon: '👁️' },
    { id: 'aparencia', label: 'Aparência', icon: '🎨' },
    { id: 'afiliados', label: 'Indique & Ganhe', icon: '🤝' },
    { id: 'backup', label: 'Backup & Dados', icon: '💾' }
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 w-full max-w-full overflow-x-hidden min-w-0 px-1">
      <div>
        <h2 className="text-2xl font-black text-gray-800 dark:text-slate-100">Preferências do Sistema</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400">Personalize regras de medição, campos de formulário e a experiência do aluno.</p>
      </div>

      {/* MENU DE ABAS */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 border-b border-gray-200 dark:border-slate-800 pb-3 w-full min-w-0">
        {abas.map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 font-bold text-[11px] sm:text-xs rounded-lg transition-colors w-full sm:w-auto text-center ${
              abaAtiva === aba.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            <span>{aba.icon}</span>
            <span className="truncate">{aba.label}</span>
          </button>
        ))}
      </div>

      {/* RENDERIZAÇÃO MODULAR DO CONTEÚDO */}
      <div className="space-y-6 w-full min-w-0">
        {abaAtiva === 'coleta' && (
          <VisibilidadeCamposForm config={config} setConfig={setConfig} onSave={handleSalvarTudo} saving={saving} />
        )}

        {abaAtiva === 'preferencias' && (
          <>
            <ToleranciasForm config={config} setConfig={setConfig} onSave={handleSalvarTudo} saving={saving} />
            <EquacaoPadraoForm config={config} setConfig={setConfig} onSave={handleSalvarTudo} saving={saving} />
          </>
        )}

        {abaAtiva === 'privacidade' && (
          <VisibilidadePublicaForm config={config} setConfig={setConfig} onSave={handleSalvarTudo} saving={saving} />
        )}

        {abaAtiva === 'aparencia' && (
          <TemaForm config={config} setConfig={setConfig} onSave={handleSalvarTudo} saving={saving} />
        )}

        {/* 🤝 ABA: PROGRAMA DE INDICAÇÃO / AFILIADOS */}
        {abaAtiva === 'afiliados' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="border-b dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                <span>🤝</span> Programa de Parceria & Indicação EvaluaOS
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Indique o EvaluaOS para colegas nutricionistas, estudantes e antropometristas e receba comissões diretas a cada assinatura.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-slate-100">Seu link de indicação EvaluaOS</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Você ganha <strong>R$ 5</strong> quando quem você indicou assina o Mensal, ou <strong>R$ 50</strong> no Anual — pago via Pix 7 dias depois dele virar Pro.
                </p>
              </div>
              {!carregandoIndicados && !chavePixCadastrada ? (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-lg p-3.5">
                  <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Cadastre sua chave Pix pra liberar seu link</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                      É pra onde a recompensa das suas indicações é paga — sem chave cadastrada, o link fica desativado.
                    </p>
                    <Link
                      to="/avaliador"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-amber-800 dark:text-amber-300 hover:underline"
                    >
                      Cadastrar Chave Pix agora →
                    </Link>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCopiarLinkIndicacao}
                  disabled={!codigoIndicacao}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 shadow-sm disabled:opacity-50 transition-colors"
                >
                  {linkIndicacaoCopiado ? <Check size={14} /> : <Link2 size={14} />}
                  {linkIndicacaoCopiado ? 'Link copiado!' : 'Copiar meu link de indicação'}
                </button>
              )}

              {!carregandoIndicados && indicados.length > 0 && (
                <div className="pt-2 border-t border-gray-200 dark:border-slate-700 space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    {souAdminIndicacoes ? 'Todas as indicações do sistema' : 'Quem você já indicou'}
                  </p>
                  {indicados.map((item, i) => {
                    const status = statusIndicacao(item)
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-gray-100 dark:border-slate-800">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 truncate block">{item.nome_completo || item.email}</span>
                          {souAdminIndicacoes && (
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate block">indicado por {item.indicador?.nome_completo || item.indicador?.email || '?'}</span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${status.cor}`}>{status.label}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary-50/60 dark:bg-primary-900/20 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-900/40 rounded-xl space-y-1">
                <span className="text-2xl">💰</span>
                <h4 className="text-xs font-bold text-primary-900 dark:text-primary-300">Comissões Recorrentes</h4>
                <p className="text-[11px] text-primary-700 dark:text-primary-400">Ganhe por cada mensalidade ou anuidade gerada pelas suas indicações.</p>
              </div>

              <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-xl space-y-1">
                <span className="text-2xl">⚡</span>
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300">Gestão via Hotmart</h4>
                <p className="text-[11px] text-blue-700 dark:text-blue-400">Acompanhamento transparente de cliques, conversões e pagamentos garantidos.</p>
              </div>

              <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/40 rounded-xl space-y-1">
                <span className="text-2xl">📊</span>
                <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300">Indicação Natural</h4>
                <p className="text-[11px] text-purple-700 dark:text-purple-400">Mostre seus laudos interativos para colegas do consultório ou da faculdade.</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-slate-100">Como se tornar um parceiro?</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Ao se cadastrar no programa via Hotmart, você obtém seu link exclusivo de divulgação para indicar quando quiser.
                </p>
              </div>

              <a
                href={LINK_AFILIADO_HOTMART}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 shadow-sm flex items-center justify-center gap-2 transition-all shrink-0"
              >
                <span>🚀</span> Quero me Tornar um Afiliado
              </a>
            </div>
          </div>
        )}

        {abaAtiva === 'backup' && (
          <ExportadorDadosCSV />
        )}
      </div>
    </div>
  )
}