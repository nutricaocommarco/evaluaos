import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer'
import { baixarPdf, converterHtmlParaPdf, styles, fmt } from './GeradorPdfNutricional'

// PDF de UMA receita pro paciente baixar do Portal — reaproveita o
// conversor de HTML (modo_preparo já vem sanitizado pelo RichTextEditor) e
// o mecanismo de download já usados no PDF do Plano Alimentar, sem
// duplicar nada (ver GeradorPdfNutricional.jsx).

const estilosReceita = StyleSheet.create({
  foto: { width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 10 },
  descricao: { fontSize: 9, color: '#6B7280', lineHeight: 1.5, marginBottom: 10, fontStyle: 'italic' },
  infoRow: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  infoItem: { fontSize: 9, color: '#4B5563', fontWeight: 'bold' },
})

const CAMPOS_MACRO = [
  ['Energia', 'energia_kcal', 'kcal'],
  ['Proteína', 'proteina_g', 'g'],
  ['Lipídios', 'lipidios_g', 'g'],
  ['Carboidrato', 'carboidrato_g', 'g'],
  ['Fibra', 'fibra_g', 'g'],
]

function DocumentoReceita({ receita }) {
  const rendimento = Number(receita.rendimento_porcoes) || 0
  const porcaoG = rendimento > 0 && receita.peso_final_g ? Number(receita.peso_final_g) / rendimento : null

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{receita.nome}</Text>
        <Text style={styles.subtitle}>Receita</Text>

        {receita.imagem_url && <Image src={receita.imagem_url} style={estilosReceita.foto} />}

        <View style={estilosReceita.infoRow}>
          {receita.tempo_preparo_min ? <Text style={estilosReceita.infoItem}>Tempo de preparo: {receita.tempo_preparo_min} min</Text> : null}
          {receita.rendimento_porcoes ? (
            <Text style={estilosReceita.infoItem}>Rendimento: {fmt(receita.rendimento_porcoes)} porç{rendimento === 1 ? 'ão' : 'ões'}</Text>
          ) : null}
          {receita.peso_final_g ? <Text style={estilosReceita.infoItem}>Peso final: {fmt(receita.peso_final_g)}g</Text> : null}
        </View>

        {receita.descricao ? <Text style={estilosReceita.descricao}>{receita.descricao}</Text> : null}

        <Text style={styles.sectionTitle}>Ingredientes e Modo de Preparo</Text>
        <View style={styles.docCard}>
          {converterHtmlParaPdf(receita.modo_preparo, 'preparo', styles.textoBase)}
        </View>

        {receita.energia_kcal ? (
          <View wrap={false}>
            <Text style={styles.sectionTitle}>
              Nutrientes {porcaoG ? `(por porção — ${fmt(porcaoG)}g)` : '(receita inteira)'}
            </Text>
            <View style={styles.metaGrid}>
              {CAMPOS_MACRO.map(([label, campo, unidade]) => {
                const total = Number(receita[campo]) || 0
                const valor = porcaoG ? total / rendimento : total
                return (
                  <View key={campo} style={styles.metaItem} wrap={false}>
                    <Text style={styles.metaLabel}>{label}</Text>
                    <Text style={styles.metaValue}>{fmt(valor)}{unidade}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        ) : null}

        <Text style={styles.footer} fixed>Gerado via EvaluaOS</Text>
      </Page>
    </Document>
  )
}

// O <Image> do react-pdf busca a URL via fetch() pra embutir no PDF. Fotos
// que o próprio nutri subiu (R2) já têm CORS liberado no bucket, mas o
// Cloudflare pode ter em cache uma resposta ANTERIOR à liberação (sem o
// cabeçalho de CORS) pra essa mesma URL — daí a busca falha mesmo com a
// política certa. Um parâmetro extra na URL evita bater nesse cache velho.
// Se mesmo assim não der (ex: bucket antigo sem CORS nenhum), gera o PDF
// sem a foto em vez de derrubar o documento inteiro.
function comCacheBust(url) {
  if (!url) return url
  const separador = url.includes('?') ? '&' : '?'
  return `${url}${separador}v=${Date.now()}`
}

async function imagemEhCarregavel(url) {
  if (!url) return false
  try {
    const resposta = await fetch(url, { mode: 'cors', cache: 'no-store' })
    return resposta.ok
  } catch {
    return false
  }
}

export async function baixarPdfReceita(receita) {
  const urlComCacheBust = comCacheBust(receita.imagem_url)
  const podeUsarFoto = await imagemEhCarregavel(urlComCacheBust)
  const receitaParaPdf = { ...receita, imagem_url: podeUsarFoto ? urlComCacheBust : null }
  try {
    await baixarPdf(<DocumentoReceita receita={receitaParaPdf} />, `${receita.nome.replace(/\s+/g, '_')}.pdf`)
  } catch (erro) {
    alert('Não deu pra gerar o PDF dessa receita: ' + erro.message)
  }
}
