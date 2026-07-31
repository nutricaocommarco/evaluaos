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
  const [abaAtiva, setAbaAtiva] = useState('coleta') // 'coleta', 'preferencias', 'privacidade', 'backup'

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
    { id: 'privacidade', label: 'Link Público (WhatsApp)', icon: '👁️' },
    { id: 'backup', label: 'Backup & Dados', icon: '💾' }
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 w-full overflow-x-hidden px-1">
      <div>
        <h2 className="text-2xl font-black text-gray-800">Preferências do Sistema</h2>
        <p className="text-sm text-gray-500">Personalize regras de medição, campos de formulário e a experiência do aluno.</p>
      </div>

      {/* MENU DE ABAS - GRADE 2x2 NO MOBILE E LINHA NO DESKTOP (SEM SCROLL) */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 border-b border-gray-200 pb-3 w-full">
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
      <div className="space-y-6 min-w-0 w-full">
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
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
              🛠️
            </div>
            <h3 className="text-base font-bold text-gray-800">Configurações do Link Público (Em Breve)</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Em breve você poderá personalizar exatamente quais seções e gráficos seu paciente poderá visualizar ao acessar o laudo e a evolução pelo link interativo do WhatsApp.
            </p>
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded-full mt-2">
              Em Desenvolvimento
            </span>
          </div>
        )}

        {abaAtiva === 'backup' && (
          <ExportadorDadosCSV />
        )}
      </div>
    </div>
  )
}
