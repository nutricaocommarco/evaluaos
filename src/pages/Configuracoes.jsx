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
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-black text-gray-800">Preferências do Sistema</h2>
        <p className="text-sm text-gray-500">Personalize regras de medição, campos de formulário e a experiência do aluno.</p>
      </div>

      {/* MENU DE ABAS */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-1 hide-scrollbar">
        {abas.map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-lg transition-colors whitespace-nowrap ${
              abaAtiva === aba.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{aba.icon}</span>
            <span>{aba.label}</span>
          </button>
        ))}
      </div>

      {/* RENDERIZAÇÃO MODULAR DO CONTEÚDO */}
      <div className="space-y-6">
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

        {abaAtiva === 'backup' && (
          <ExportadorDadosCSV />
        )}
      </div>
    </div>
  )
}