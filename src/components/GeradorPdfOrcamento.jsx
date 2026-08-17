import React, { useState, useEffect } from 'react'
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image, Link } from '@react-pdf/renderer'
import { supabase } from '../supabaseClient'
import { FileDown } from 'lucide-react'

// PDF de Orçamento/Protocolo — mesmo esqueleto do GeradorPdfRecibo.jsx
// (header com logo/empresa, rodapé com CRN), com uma tabela de itens no
// meio e a chave Pix do nutricionista em destaque no fim. `titulo` é
// texto livre (o nutri digita "Orçamento" ou "Protocolo de X") — a
// palavra usada na frase de validade só espelha o que ele escreveu.

function fmtMoeda(n) {
  return (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

function valorLiquidoItem(item) {
  return Math.max((Number(item.valor) || 0) - (Number(item.desconto) || 0), 0)
}

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 60, paddingLeft: 45, paddingRight: 45, backgroundColor: '#FFFFFF', fontFamily: 'Helvetica' },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 26 },
  logoImage: { height: 45, width: 'auto', objectFit: 'contain' },
  headerTexto: { marginLeft: 14 },
  headerEmpresa: { fontSize: 12, fontWeight: 'bold', color: '#1F2937' },
  headerNutri: { fontSize: 9, color: '#6B7280', marginTop: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  clienteTexto: { fontSize: 10, color: '#6B7280', marginBottom: 20 },
  tabelaHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1F2937', paddingBottom: 6, marginBottom: 4 },
  tabelaHeaderTexto: { fontSize: 9, fontWeight: 'bold', color: '#1F2937', textTransform: 'uppercase' },
  tabelaLinha: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingVertical: 8 },
  colDescricao: { flex: 1, fontSize: 10, color: '#374151' },
  colValor: { width: 90, fontSize: 10, color: '#374151', textAlign: 'right' },
  colValorRiscado: { fontSize: 8, color: '#9CA3AF', textDecoration: 'line-through', textAlign: 'right' },
  colValorFinal: { fontSize: 10, color: '#374151', textAlign: 'right' },
  subtotalLinha: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  subtotalLabel: { fontSize: 9, color: '#6B7280', marginRight: 10 },
  subtotalValor: { fontSize: 9, color: '#6B7280' },
  subtotalRiscado: { fontSize: 10, color: '#9CA3AF', textDecoration: 'line-through', marginRight: 10 },
  descontoValor: { fontSize: 10, color: '#DC2626', fontWeight: 'bold' },
  totalLinha: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1F2937' },
  totalLabel: { fontSize: 12, fontWeight: 'bold', color: '#1F2937', marginRight: 10 },
  totalValor: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  validadeTexto: { fontSize: 9, color: '#6B7280', marginTop: 14 },
  pixBox: { marginTop: 24, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 4 },
  pixLabel: { fontSize: 8, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', marginBottom: 2 },
  pixValor: { fontSize: 11, color: '#1F2937' },
  botaoPagar: { marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#1F2937', borderRadius: 4, textAlign: 'center' },
  botaoPagarTexto: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' },
  footer: { position: 'absolute', bottom: 25, left: 45, right: 45, fontSize: 7.5, color: '#9CA3AF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 6 },
})

// Exportado à parte pra ser reaproveitado direto na página pública
// (VisualizacaoPublicaOrcamento.jsx), que já busca o avaliador sozinha
// e não precisa do wrapper de modal/PDFDownloadLink abaixo.
export function DocumentoOrcamento({ orcamento, nomeCliente, avaliador }) {
  const crnTexto = avaliador?.crn_numep && avaliador.crn_numep !== 'Estudante' ? `CRN/CREF/NUMEP: ${avaliador.crn_numep}` : null
  const itens = Array.isArray(orcamento?.itens) ? orcamento.itens : []
  const hoje = formatarData(new Date().toISOString())
  const rotulo = orcamento?.titulo?.toLowerCase().includes('protocolo') ? 'Protocolo' : 'Orçamento'
  const subtotal = itens.reduce((s, item) => s + valorLiquidoItem(item), 0)
  const temDesconto = Number(orcamento?.desconto) > 0
  const valorDesconto = orcamento?.desconto_tipo === 'percentual' ? subtotal * ((Number(orcamento.desconto) || 0) / 100) : Number(orcamento?.desconto) || 0
  const rotuloDesconto = orcamento?.desconto_tipo === 'percentual' ? `Desconto (${orcamento.desconto}%):` : 'Desconto:'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {(avaliador?.logomarca_url || avaliador?.empresa || avaliador?.nome_completo) && (
          <View style={styles.headerContainer}>
            {avaliador?.logomarca_url && <Image src={avaliador.logomarca_url} style={styles.logoImage} />}
            {(avaliador?.empresa || avaliador?.nome_completo) && (
              <View style={styles.headerTexto}>
                {avaliador?.empresa && <Text style={styles.headerEmpresa}>{avaliador.empresa}</Text>}
                {avaliador?.nome_completo && <Text style={styles.headerNutri}>{avaliador.nome_completo}</Text>}
              </View>
            )}
          </View>
        )}

        <Text style={styles.title}>{orcamento?.titulo || 'Orçamento'}</Text>
        <Text style={styles.clienteTexto}>
          {nomeCliente ? `Para: ${nomeCliente} · ` : ''}Emitido em {hoje}
        </Text>

        <View style={styles.tabelaHeader}>
          <Text style={[styles.tabelaHeaderTexto, { flex: 1 }]}>Serviço / Item</Text>
          <Text style={[styles.tabelaHeaderTexto, styles.colValor]}>Valor</Text>
        </View>
        {itens.map((item, i) => (
          <View style={styles.tabelaLinha} key={i}>
            <Text style={styles.colDescricao}>{item.descricao}</Text>
            {Number(item.desconto) > 0 ? (
              <View style={{ width: 90 }}>
                <Text style={styles.colValorRiscado}>{fmtMoeda(item.valor)}</Text>
                <Text style={styles.colValorFinal}>{fmtMoeda(valorLiquidoItem(item))}</Text>
              </View>
            ) : (
              <Text style={styles.colValor}>{fmtMoeda(item.valor)}</Text>
            )}
          </View>
        ))}

        {temDesconto && (
          <>
            <View style={styles.subtotalLinha}>
              <Text style={styles.subtotalRiscado}>{fmtMoeda(subtotal)}</Text>
            </View>
            <View style={styles.subtotalLinha}>
              <Text style={styles.subtotalLabel}>{rotuloDesconto}</Text>
              <Text style={styles.descontoValor}>-{fmtMoeda(valorDesconto)}</Text>
            </View>
          </>
        )}

        <View style={styles.totalLinha}>
          <Text style={styles.totalLabel}>TOTAL:</Text>
          <Text style={styles.totalValor}>{fmtMoeda(orcamento?.valor_total)}</Text>
        </View>

        <Text style={styles.validadeTexto}>
          {rotulo} válido por {orcamento?.validade_dias || 7} dias. Agradecemos a confiança!
        </Text>

        {orcamento?.mostrar_pix !== false && avaliador?.chave_pix && (
          <View style={styles.pixBox}>
            <Text style={styles.pixLabel}>Chave Pix</Text>
            <Text style={styles.pixValor}>{avaliador.chave_pix}</Text>
          </View>
        )}

        {orcamento?.mostrar_cartao !== false && orcamento?.link_pagamento && (
          <Link src={orcamento.link_pagamento} style={styles.botaoPagar}>
            <Text style={styles.botaoPagarTexto}>Pagar com Cartão</Text>
          </Link>
        )}

        <Text style={styles.footer} fixed>
          Gerado em {hoje} via EvaluaOS{avaliador?.telefone ? ` · ${avaliador.telefone}` : ''}{crnTexto ? ` · ${crnTexto}` : ''}
        </Text>
      </Page>
    </Document>
  )
}

export default function GeradorPdfOrcamento({ orcamento, nomeCliente, avaliadorUserId, aoFechar }) {
  const [avaliador, setAvaliador] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      const { data } = await supabase
        .from('avaliadores')
        .select('nome_completo, empresa, logomarca_url, crn_numep, telefone, chave_pix')
        .eq('auth_id', avaliadorUserId)
        .maybeSingle()
      setAvaliador(data || null)
      setCarregando(false)
    }
    carregar()
  }, [avaliadorUserId])

  const nomeArquivo = `${(orcamento?.titulo || 'orcamento').trim().toLowerCase().replace(/\s+/g, '-')}-${(nomeCliente || 'cliente').trim().toLowerCase().replace(/\s+/g, '-')}.pdf`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Gerar PDF</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{orcamento?.titulo} · {fmtMoeda(orcamento?.valor_total)}</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={aoFechar}
            className="px-5 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Fechar
          </button>
          {carregando ? (
            <span className="px-5 py-2 text-sm text-gray-400 dark:text-slate-500">Carregando...</span>
          ) : (
            <PDFDownloadLink
              document={<DocumentoOrcamento orcamento={orcamento} nomeCliente={nomeCliente} avaliador={avaliador} />}
              fileName={nomeArquivo}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow"
            >
              {({ loading }) => (
                <>
                  <FileDown size={16} />
                  {loading ? 'Gerando...' : 'Baixar PDF'}
                </>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>
    </div>
  )
}
