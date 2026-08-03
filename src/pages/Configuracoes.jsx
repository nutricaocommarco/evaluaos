import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

// Importação Modular dos Componentes Separados
import ToleranciasForm from '../components/configuracoes/ToleranciasForm'
import VisibilidadeCamposForm from '../components/configuracoes/VisibilidadeCamposForm'
import EquacaoPadraoForm from '../components/configuracoes/EquacaoPadraoForm'
import VisibilidadePublicaForm from '../components/configuracoes/VisibilidadePublicaForm'
import ExportadorDadosCSV from '../components/configuracoes/ExportadorDadosCSV'

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
    visibilidade_publica: null
  })

  // 🔗 COLOQUE O SEU LINK DE AFILIADO DA HOTMART AQUI
  const LINK_AFILIADO_HOTMART = "https://affiliate.hotmart.com/affiliate-recruiting/view/2019E106982311" 

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
      setLoading(false)
    }

    carregarConfiguracoes()
  }, [])

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
    return <div className="p-8 text-center text-emerald-600 font-bold">Carregando preferências...</div>
  }

  const abas = [
    { id: 'coleta', label: 'Formulário & Coleta', icon: '📝' },
    { id: 'preferencias', label: 'Protocolos & Margens', icon: '⚡' },
    { id: 'privacidade', label: 'Visibilidade', icon: '👁️' },
    { id: 'afiliados', label: 'Indique & Ganhe', icon: '🤝' },
    { id: 'backup', label: 'Backup & Dados', icon: '💾' }
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 w-full max-w-full overflow-x-hidden min-w-0 px-1">
      <div>
        <h2 className="text-2xl font-black text-gray-800">Preferências do Sistema</h2>
        <p className="text-sm text-gray-500">Personalize regras de medição, campos de formulário e a experiência do aluno.</p>
      </div>

      {/* MENU DE ABAS */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 border-b border-gray-200 pb-3 w-full min-w-0">
        {abas.map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 font-bold text-[11px] sm:text-xs rounded-lg transition-colors w-full sm:w-auto text-center ${
              abaAtiva === aba.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
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

        {/* 🤝 ABA: PROGRAMA DE INDICAÇÃO / AFILIADOS */}
        {abaAtiva === 'afiliados' && (
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <span>🤝</span> Programa de Parceria & Indicação EvaluaOS
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Indique o EvaluaOS para colegas nutricionistas, estudantes e antropometristas e receba comissões diretas a cada assinatura.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1">
                <span className="text-2xl">💰</span>
                <h4 className="text-xs font-bold text-emerald-900">Comissões Recorrentes</h4>
                <p className="text-[11px] text-emerald-700">Ganhe por cada mensalidade ou anuidade gerada pelas suas indicações.</p>
              </div>

              <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
                <span className="text-2xl">⚡</span>
                <h4 className="text-xs font-bold text-blue-900">Gestão via Hotmart</h4>
                <p className="text-[11px] text-blue-700">Acompanhamento transparente de cliques, conversões e pagamentos garantidos.</p>
              </div>

              <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-xl space-y-1">
                <span className="text-2xl">📊</span>
                <h4 className="text-xs font-bold text-purple-900">Indicação Natural</h4>
                <p className="text-[11px] text-purple-700">Mostre seus laudos interativos para colegas do consultório ou da faculdade.</p>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h4 className="text-xs font-bold text-gray-800">Como se tornar um parceiro?</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ao se cadastrar no programa via Hotmart, você obtém seu link exclusivo de divulgação para indicar quando quiser.
                </p>
              </div>
              
              <a
                href={LINK_AFILIADO_HOTMART}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-2 transition-all shrink-0"
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