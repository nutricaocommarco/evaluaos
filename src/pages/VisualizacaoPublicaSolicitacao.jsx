import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import CabecalhoPortalPaciente from '../components/CabecalhoPortalPaciente'

// Destino do QR Code impresso no PDF de solicitação de exames — página
// pública (sem login), um token por solicitação (não é o token geral do
// paciente). Só leitura: mostra o mesmo conteúdo do PDF, pra quem recebeu
// o papel poder validar a origem do pedido.

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

export default function VisualizacaoPublicaSolicitacao() {
  const { tokenUrl } = useParams()

  const [loading, setLoading] = useState(true)
  const [solicitacao, setSolicitacao] = useState(null)
  const [paciente, setPaciente] = useState(null)
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [nomeAvaliador, setNomeAvaliador] = useState('')
  const [logomarcaUrl, setLogomarcaUrl] = useState('')
  const [crnNumep, setCrnNumep] = useState('')

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)

      const { data: sol } = await supabase
        .from('exames_solicitacoes')
        .select('*')
        .eq('token_publico', tokenUrl)
        .maybeSingle()

      if (!sol) { setLoading(false); return }
      setSolicitacao(sol)

      const [pacRes, avalRes] = await Promise.all([
        supabase.from('pacientes').select('nome_completo').eq('id', sol.id_paciente).maybeSingle(),
        supabase.from('avaliadores').select('empresa, nome_completo, logomarca_url, crn_numep').eq('auth_id', sol.id_avaliador).maybeSingle(),
      ])

      setPaciente(pacRes.data || null)
      if (avalRes.data) {
        setNomeEmpresa(avalRes.data.empresa || '')
        setNomeAvaliador(avalRes.data.nome_completo || '')
        setLogomarcaUrl(avalRes.data.logomarca_url || '')
        setCrnNumep(avalRes.data.crn_numep || '')
      }

      setLoading(false)
    }
    carregar()
  }, [tokenUrl])

  const crnTexto = crnNumep === 'Estudante'
    ? 'Pedido sem Validade - Estudante'
    : crnNumep
      ? `CRN/CREF/NUMEP: ${crnNumep}`
      : 'Pedido sem Validade - Sem CRN cadastrado'
  // Mesmo formato do rodapé do PDF (GeradorPdfSolicitacaoExames.jsx): nome
  // do nutricionista sempre junto do CRN, não só o CRN sozinho.
  const nutriTexto = [nomeAvaliador, crnTexto].filter(Boolean).join(' — ')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-primary-600 font-bold animate-pulse">Carregando documento...</p>
      </div>
    )
  }

  if (!solicitacao) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md text-center">
          <p className="text-gray-700 dark:text-slate-300 font-semibold">Documento não encontrado ou link inválido.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <CabecalhoPortalPaciente logomarcaUrl={logomarcaUrl} nomeEmpresa={nomeEmpresa} nomeAvaliador={nomeAvaliador} />

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">{solicitacao.titulo}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Paciente: <span className="font-semibold text-gray-700 dark:text-slate-300">{paciente?.nome_completo || '-'}</span>
              {' · '}Data: <span className="font-semibold text-gray-700 dark:text-slate-300">{formatarData(solicitacao.created_at)}</span>
            </p>
          </div>

          {solicitacao.conteudo ? (
            <div className="rte-html text-sm text-gray-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: solicitacao.conteudo }} />
          ) : (
            <p className="text-sm text-gray-400 dark:text-slate-500">-</p>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 space-y-1">
            <p className="text-[11px] text-gray-400 dark:text-slate-500">
              Em caso de divergências, entre em contato com o profissional responsável.
            </p>
            {nutriTexto && <p className="text-[11px] text-gray-400 dark:text-slate-500">{nutriTexto}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
