import React, { useState, useEffect } from 'react'
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer'
import { supabase } from '../supabaseClient'
import { FileDown } from 'lucide-react'

// Recibo simples de uma movimentação já paga/recebida — nome, valor, data,
// referente a quê. Sem CPF/CNPJ do consultório nem valor por extenso (não
// prometido no escopo); dá pra formalizar depois se algum nutri pedir.
// Só faz sentido pra receita já marcada como paga (ver botão condicional
// em Financeiro.jsx) — não emite recibo de algo ainda não recebido.

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(`${dataStr}T00:00:00`).toLocaleDateString('pt-BR')
}

function fmtMoeda(n) {
  return (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 60, paddingLeft: 45, paddingRight: 45, backgroundColor: '#FFFFFF', fontFamily: 'Helvetica' },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 26 },
  logoImage: { height: 45, width: 'auto', objectFit: 'contain' },
  headerTexto: { marginLeft: 14 },
  headerEmpresa: { fontSize: 12, fontWeight: 'bold', color: '#1F2937' },
  headerNutri: { fontSize: 9, color: '#6B7280', marginTop: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  valorDestaque: { fontSize: 26, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 },
  corpo: { fontSize: 11, color: '#374151', lineHeight: 1.6, marginBottom: 30 },
  destaque: { fontWeight: 'bold', color: '#1F2937' },
  assinaturaLinha: { marginTop: 60, borderTopWidth: 1, borderTopColor: '#9CA3AF', width: 260, paddingTop: 6 },
  assinaturaTexto: { fontSize: 10, color: '#1F2937' },
  assinaturaSub: { fontSize: 8.5, color: '#6B7280', marginTop: 1 },
  footer: { position: 'absolute', bottom: 25, left: 45, right: 45, fontSize: 7.5, color: '#9CA3AF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 6 },
})

function DocumentoRecibo({ movimentacao, nomePaciente, avaliador }) {
  const crnTexto = avaliador?.crn_numep && avaliador.crn_numep !== 'Estudante' ? `CRN/CREF/NUMEP: ${avaliador.crn_numep}` : null
  const hoje = formatarData(new Date().toISOString())
  const nomeEmissor = avaliador?.empresa || avaliador?.nome_completo || 'Consultório'

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

        <Text style={styles.title}>RECIBO</Text>
        <Text style={styles.valorDestaque}>{fmtMoeda(movimentacao.valor)}</Text>

        <Text style={styles.corpo}>
          Recebi de <Text style={styles.destaque}>{nomePaciente || 'Cliente'}</Text> a quantia de{' '}
          <Text style={styles.destaque}>{fmtMoeda(movimentacao.valor)}</Text>, referente a{' '}
          <Text style={styles.destaque}>{movimentacao.descricao}</Text> ({movimentacao.categoria}), em{' '}
          <Text style={styles.destaque}>{formatarData(movimentacao.data)}</Text>.
        </Text>

        <View style={styles.assinaturaLinha}>
          <Text style={styles.assinaturaTexto}>{nomeEmissor}</Text>
          {avaliador?.telefone && <Text style={styles.assinaturaSub}>{avaliador.telefone}</Text>}
          {crnTexto && <Text style={styles.assinaturaSub}>{crnTexto}</Text>}
        </View>

        <Text style={styles.footer} fixed>
          Gerado em {hoje} via EvaluaOS
        </Text>
      </Page>
    </Document>
  )
}

export default function GeradorPdfRecibo({ movimentacao, avaliadorUserId, aoFechar }) {
  const [avaliador, setAvaliador] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const carregar = async () => {
      const { data } = await supabase
        .from('avaliadores')
        .select('nome_completo, empresa, logomarca_url, crn_numep, telefone')
        .eq('auth_id', avaliadorUserId)
        .maybeSingle()
      setAvaliador(data || null)
      setCarregando(false)
    }
    carregar()
  }, [avaliadorUserId])

  const nomePaciente = movimentacao.pacientes?.nome_completo || null
  const nomeArquivo = `recibo-${(nomePaciente || movimentacao.descricao || 'movimentacao').trim().toLowerCase().replace(/\s+/g, '-')}.pdf`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Gerar Recibo</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{movimentacao.descricao} · {fmtMoeda(movimentacao.valor)}</p>
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
              document={<DocumentoRecibo movimentacao={movimentacao} nomePaciente={nomePaciente} avaliador={avaliador} />}
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
