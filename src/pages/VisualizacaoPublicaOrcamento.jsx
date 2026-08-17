import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import CabecalhoPortalPaciente from '../components/CabecalhoPortalPaciente'
import GeradorPdfOrcamento from '../components/GeradorPdfOrcamento'
import { useTheme } from '../contexts/ThemeContext'
import { Copy, Check, CreditCard, FileDown } from 'lucide-react'

// Destino do link enviado por WhatsApp (AbaOrcamentos.jsx) — página
// pública (sem login), um token por orçamento. Mesmo padrão de
// VisualizacaoPublicaSolicitacao.jsx.

function fmtMoeda(n) {
  return (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

export default function VisualizacaoPublicaOrcamento() {
  const { tokenUrl } = useParams()
  const { setDarkMode, setCorPrimaria } = useTheme()

  const [loading, setLoading] = useState(true)
  const [orcamento, setOrcamento] = useState(null)
  const [nomeCliente, setNomeCliente] = useState('')
  const [avaliador, setAvaliador] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const [mostrarPdf, setMostrarPdf] = useState(false)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)

      const { data: orc } = await supabase.from('orcamentos').select('*').eq('token_publico', tokenUrl).maybeSingle()

      if (!orc) {
        setLoading(false)
        return
      }
      setOrcamento(orc)

      const [pacRes, avalRes, configRes] = await Promise.all([
        orc.id_paciente
          ? supabase.from('pacientes').select('nome_completo, tema_dark_mode').eq('id', orc.id_paciente).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('avaliadores').select('empresa, nome_completo, logomarca_url, crn_numep, chave_pix').eq('auth_id', orc.id_avaliador).maybeSingle(),
        supabase.from('configuracoes_avaliador').select('dark_mode, cor_primaria').eq('auth_id', orc.id_avaliador).maybeSingle(),
      ])

      setNomeCliente(pacRes.data?.nome_completo || orc.nome_lead || '')
      setAvaliador(avalRes.data || null)
      if (configRes.data) {
        const temaPaciente = pacRes.data?.tema_dark_mode
        setDarkMode(temaPaciente != null ? temaPaciente : !!configRes.data.dark_mode)
        if (configRes.data.cor_primaria) setCorPrimaria(configRes.data.cor_primaria)
      }
      setLoading(false)
    }
    carregar()
  }, [tokenUrl])

  const copiarPix = async () => {
    if (!avaliador?.chave_pix) return
    await navigator.clipboard.writeText(avaliador.chave_pix)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const rotulo = orcamento?.titulo?.toLowerCase().includes('protocolo') ? 'Protocolo' : 'Orçamento'
  const itens = Array.isArray(orcamento?.itens) ? orcamento.itens : []
  const valorLiquidoItem = (item) => Math.max((Number(item.valor) || 0) - (Number(item.desconto) || 0), 0)
  const subtotal = itens.reduce((s, item) => s + valorLiquidoItem(item), 0)
  const temDesconto = Number(orcamento?.desconto) > 0
  const valorDesconto = orcamento?.desconto_tipo === 'percentual' ? subtotal * ((Number(orcamento.desconto) || 0) / 100) : Number(orcamento?.desconto) || 0
  const rotuloDesconto = orcamento?.desconto_tipo === 'percentual' ? `Desconto (${orcamento.desconto}%)` : 'Desconto'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <p className="text-primary-600 font-bold animate-pulse">Carregando documento...</p>
      </div>
    )
  }

  if (!orcamento) {
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
        <CabecalhoPortalPaciente
          logomarcaUrl={avaliador?.logomarca_url}
          nomeEmpresa={avaliador?.empresa}
          nomeAvaliador={avaliador?.nome_completo}
        />

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-xl font-black text-gray-800 dark:text-slate-100">{orcamento.titulo}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {nomeCliente && (
                <>
                  Para: <span className="font-semibold text-gray-700 dark:text-slate-300">{nomeCliente}</span>
                  {' · '}
                </>
              )}
              Emitido em <span className="font-semibold text-gray-700 dark:text-slate-300">{formatarData(orcamento.created_at)}</span>
            </p>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {itens.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-700 dark:text-slate-300">{item.descricao}</span>
                {Number(item.desconto) > 0 ? (
                  <span className="text-right">
                    <span className="block text-xs text-gray-400 dark:text-slate-500 line-through">{fmtMoeda(item.valor)}</span>
                    <span className="block font-semibold text-gray-800 dark:text-slate-100">{fmtMoeda(valorLiquidoItem(item))}</span>
                  </span>
                ) : (
                  <span className="font-semibold text-gray-800 dark:text-slate-100">{fmtMoeda(item.valor)}</span>
                )}
              </div>
            ))}
          </div>

          {temDesconto && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-400 dark:text-slate-500 line-through">{fmtMoeda(subtotal)}</span>
              <span className="text-sm font-bold text-red-600 dark:text-red-400">{rotuloDesconto}: -{fmtMoeda(valorDesconto)}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t-2 border-gray-800 dark:border-slate-200">
            <span className="text-sm font-black text-gray-800 dark:text-slate-100">TOTAL</span>
            <span className="text-xl font-black text-gray-800 dark:text-slate-100">{fmtMoeda(orcamento.valor_total)}</span>
          </div>

          <p className="text-xs text-gray-400 dark:text-slate-500">
            {rotulo} válido por {orcamento.validade_dias} dias. Agradecemos a confiança!
          </p>

          {((orcamento.mostrar_pix !== false && avaliador?.chave_pix) || (orcamento.mostrar_cartao !== false && orcamento.link_pagamento)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {orcamento.mostrar_pix !== false && avaliador?.chave_pix && (
                <button
                  onClick={copiarPix}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-100 text-sm font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {copiado ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  {copiado ? 'Copiado!' : 'Copiar chave Pix'}
                </button>
              )}
              {orcamento.mostrar_cartao !== false && orcamento.link_pagamento && (
                <a
                  href={orcamento.link_pagamento}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <CreditCard size={16} /> Pagar com Cartão
                </a>
              )}
            </div>
          )}

          <button
            onClick={() => setMostrarPdf(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:underline"
          >
            <FileDown size={13} /> Baixar em PDF
          </button>

          <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
            <p className="text-[11px] text-gray-400 dark:text-slate-500">
              Em caso de divergências, entre em contato com o profissional responsável.
            </p>
          </div>
        </div>
      </div>

      {mostrarPdf && (
        <GeradorPdfOrcamento
          orcamento={orcamento}
          nomeCliente={nomeCliente}
          avaliadorUserId={orcamento.id_avaliador}
          aoFechar={() => setMostrarPdf(false)}
        />
      )}
    </div>
  )
}
