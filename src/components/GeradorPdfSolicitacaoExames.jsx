import React, { useState, useEffect } from 'react'
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import { FileDown } from 'lucide-react'

// PDF da Solicitação de Exames — documento médico, precisa ser
// rastreável: carrega um QR Code que aponta pra /pedido-exames/:token
// (página pública, sem login) com o mesmo conteúdo, pra quem receber o
// papel impresso poder validar a origem. O CRN do nutricionista aparece
// junto — se for 'Estudante' (valor especial coletado no cadastro/Painel
// do Nutricionista), mostra "Pedido sem Validade - Estudante" no lugar
// do número, porque um pedido assinado por estudante não tem validade
// legal de prescrição.

function extrairLinhasExame(html) {
  if (!html) return []
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const linhas = []
  doc.body.querySelectorAll('p, li, div').forEach((el) => {
    if (el.querySelector('p, li, div')) return // só nó folha, evita duplicar texto de containers
    const texto = el.textContent.trim()
    if (texto) linhas.push(texto)
  })
  return linhas
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 60, paddingLeft: 45, paddingRight: 45, backgroundColor: '#FFFFFF', fontFamily: 'Helvetica' },
  logoImage: { height: 45, width: 'auto', marginBottom: 24, objectFit: 'contain' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  campoLabel: { fontSize: 10, fontWeight: 'bold', color: '#1F2937' },
  campoLinha: { flexDirection: 'row', marginBottom: 4 },
  campoValor: { fontSize: 10, color: '#374151' },
  listaExames: { marginTop: 18 },
  linhaExame: { fontSize: 10.5, color: '#1F2937', marginBottom: 6 },
  rodapeQr: { position: 'absolute', bottom: 70, left: 45, right: 45, flexDirection: 'row', alignItems: 'flex-end' },
  qrImage: { width: 72, height: 72 },
  avisoTexto: { fontSize: 8, color: '#6B7280', marginBottom: 2 },
  nutriInfo: { fontSize: 8, color: '#4B5563', marginTop: 4 },
  footer: { position: 'absolute', bottom: 25, left: 45, right: 45, fontSize: 7.5, color: '#9CA3AF', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 6 },
})

function DocumentoSolicitacao({ solicitacao, paciente, avaliador, qrDataUri }) {
  const linhas = extrairLinhasExame(solicitacao.conteudo)
  const crn = avaliador?.crn_numep
  const crnTexto = crn === 'Estudante' ? 'Pedido sem Validade - Estudante' : crn ? `CRN/CREF/NUMEP: ${crn}` : null
  const hoje = formatarData(new Date().toISOString())

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {avaliador?.logomarca_url && <Image src={avaliador.logomarca_url} style={styles.logoImage} />}

        <Text style={styles.title}>{solicitacao.titulo}</Text>

        <View style={styles.campoLinha}>
          <Text style={styles.campoLabel}>Paciente: </Text>
          <Text style={styles.campoValor}>{paciente?.nome_completo}</Text>
        </View>
        <View style={styles.campoLinha}>
          <Text style={styles.campoLabel}>Data: </Text>
          <Text style={styles.campoValor}>{formatarData(solicitacao.created_at)}</Text>
        </View>

        <View style={styles.listaExames}>
          {linhas.map((linha, i) => (
            <Text key={i} style={styles.linhaExame}>{linha}</Text>
          ))}
        </View>

        <View style={styles.rodapeQr} fixed>
          {qrDataUri && <Image src={qrDataUri} style={styles.qrImage} />}
          <View style={{ marginLeft: 14 }}>
            <Text style={styles.avisoTexto}>Escaneie o QR Code para acessar o documento original.</Text>
            <Text style={styles.avisoTexto}>Em caso de divergências, entre em contato com o profissional responsável.</Text>
            {(avaliador?.nome_completo || crnTexto) && (
              <Text style={styles.nutriInfo}>
                {avaliador?.nome_completo}{avaliador?.nome_completo && crnTexto ? ' — ' : ''}{crnTexto}
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.footer} fixed>
          Página 1/1  |  Gerado em {hoje}  |  Paciente: {paciente?.nome_completo}
        </Text>
      </Page>
    </Document>
  )
}

export default function GeradorPdfSolicitacaoExames({ solicitacao, paciente, avaliador, aoFechar }) {
  const [qrDataUri, setQrDataUri] = useState(null)

  useEffect(() => {
    const url = `${window.location.origin}/pedido-exames/${solicitacao.token_publico}`
    QRCode.toDataURL(url, { margin: 1, width: 240 })
      .then(setQrDataUri)
      .catch(() => setQrDataUri(null))
  }, [solicitacao.token_publico])

  const nomeArquivo = `solicitacao-de-exames-${(paciente?.nome_completo || 'paciente').trim().toLowerCase().replace(/\s+/g, '-')}.pdf`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Gerar PDF</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{solicitacao.titulo}</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={aoFechar}
            className="px-5 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            Fechar
          </button>
          {qrDataUri ? (
            <PDFDownloadLink
              document={<DocumentoSolicitacao solicitacao={solicitacao} paciente={paciente} avaliador={avaliador} qrDataUri={qrDataUri} />}
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
          ) : (
            <span className="px-5 py-2 text-sm text-gray-400 dark:text-slate-500">Gerando QR Code...</span>
          )}
        </div>
      </div>
    </div>
  )
}
