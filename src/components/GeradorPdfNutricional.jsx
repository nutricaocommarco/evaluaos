import React, { useState, useEffect } from 'react'
import { Document, Page, Text, View, StyleSheet, pdf, Image, Link } from '@react-pdf/renderer'
import { supabase } from '../supabaseClient'
import { ArrowUp, ArrowDown, FileDown } from 'lucide-react'

// Gera o PDF uma única vez, no momento do clique, e dispara o download via
// blob. Importante NÃO usar PDFDownloadLink aqui: ele mantém o documento
// "vivo" e regenera o PDF em segundo plano a cada re-render do componente
// (inclusive a cada clique nas setinhas de reordenar) — com vários blocos e
// reordenações em sequência, gerações assíncronas se sobrepõem e o motor de
// paginação do react-pdf duplica/triplica blocos de conteúdo no resultado
// final. Gerando sob demanda (pdf().toBlob()) isso não acontece: só existe
// uma geração, com o estado exato de `blocos` no momento do clique.
export async function baixarPdf(documento, nomeArquivo) {
  const blob = await pdf(documento).toBlob()
  const url = URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  window.document.body.appendChild(link)
  link.click()
  window.document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Gerador de PDF nutricional — junta num só documento o que o nutricionista
// escolher: Plano Alimentar (refeições + macros + fibra), Orientações
// Nutricionais e Listas de Recomendações, cada um podendo ser incluído ou
// não, na ordem que o nutricionista quiser (setas ▲▼, mesmo padrão já usado
// pra reordenar refeições em PlanoAlimentar.jsx).
//
// Autocontido de propósito: recebe só { paciente, avaliadorUserId, aoFechar }
// e busca tudo (plano ativo, orientações, listas, dados do avaliador) — assim
// o mesmo modal é chamado de 3 telas diferentes (Plano Alimentar, Orientações,
// Listas de Recomendações) sem duplicar lógica de fetch em cada uma.

export function fmt(n) {
  return Number.isFinite(n) ? n.toFixed(1).replace(/\.0$/, '') : '0'
}

export function calcularMacrosItem(item) {
  const alimento = item.tabela_alimentos
  if (!alimento || item.ignorar_nos_calculos) return { kcal: 0, proteina: 0, carbo: 0, lipidio: 0, fibra: 0 }
  const fator = (Number(item.quantidade_g) || 0) / 100
  return {
    kcal: (alimento.energia_kcal || 0) * fator,
    proteina: (alimento.proteina_g || 0) * fator,
    carbo: (alimento.carboidrato_g || 0) * fator,
    lipidio: (alimento.lipidios_g || 0) * fator,
    fibra: (alimento.fibra_g || 0) * fator,
  }
}

export function somarMacros(lista) {
  return lista.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      proteina: acc.proteina + m.proteina,
      carbo: acc.carbo + m.carbo,
      lipidio: acc.lipidio + m.lipidio,
      fibra: acc.fibra + (m.fibra || 0),
    }),
    { kcal: 0, proteina: 0, carbo: 0, lipidio: 0, fibra: 0 }
  )
}

export function calcularFibraRecomendada(vetTarget) {
  const vet = Number(vetTarget)
  return vet > 0 ? (vet / 1000) * 14 : null
}

const LABEL_UNIDADE = {
  g: 'g', unidade: 'unidade(s)', ml: 'ml', colher_sopa: 'colher(es) de sopa', colher_cha: 'colher(es) de chá',
  colher_cafe: 'colher(es) de café', copo_americano: 'copo(s) americano', xicara_cha: 'xícara(s) de chá', concha: 'concha(s)',
}

function textoQuantidade(item) {
  if (item.unidade_medida === 'a_vontade') return 'à vontade'
  if (item.unidade_medida && item.quantidade_medida) {
    return `${item.quantidade_medida} ${LABEL_UNIDADE[item.unidade_medida] || item.unidade_medida} (~${item.quantidade_g}g)`
  }
  return `${item.quantidade_g}g`
}

function compararRefeicoes(a, b) {
  const ha = a.horario || '99:99'
  const hb = b.horario || '99:99'
  if (ha !== hb) return ha < hb ? -1 : 1
  return (a.ordem || 0) - (b.ordem || 0)
}

// --- HTML do RichTextEditor (já sanitizado antes de salvar) -> elementos react-pdf ---
function estiloInline(tag, atual) {
  switch (tag) {
    case 'B': case 'STRONG': return { ...atual, fontWeight: 'bold' }
    case 'I': case 'EM': return { ...atual, fontStyle: 'italic' }
    case 'U': return { ...atual, textDecoration: atual.textDecoration === 'line-through' ? 'underline line-through' : 'underline' }
    case 'S': case 'STRIKE': return { ...atual, textDecoration: atual.textDecoration === 'underline' ? 'underline line-through' : 'line-through' }
    default: return atual
  }
}

function corDoSpan(node, atual) {
  const style = node.getAttribute ? node.getAttribute('style') : null
  if (style) {
    const m = /color\s*:\s*([^;]+)/i.exec(style)
    if (m) return { ...atual, color: m[1].trim() }
  }
  return atual
}

function renderInlinePdf(node, estilo, keyBase) {
  const partes = []
  node.childNodes.forEach((filho, idx) => {
    const key = `${keyBase}-${idx}`
    if (filho.nodeType === Node.TEXT_NODE) {
      if (filho.textContent) partes.push(<Text key={key} style={estilo}>{filho.textContent}</Text>)
    } else if (filho.nodeType === Node.ELEMENT_NODE) {
      const tag = filho.tagName
      if (tag === 'BR') { partes.push(<Text key={key}>{'\n'}</Text>); return }
      if (tag === 'A') {
        const href = filho.getAttribute('href')
        const estiloLink = { ...estilo, color: '#2563eb', textDecoration: 'underline' }
        const conteudoLink = renderInlinePdf(filho, estiloLink, key)
        if (href) partes.push(<Link key={key} src={href} style={estiloLink}>{conteudoLink}</Link>)
        else partes.push(...conteudoLink)
        return
      }
      let novoEstilo = estiloInline(tag, estilo)
      if (tag === 'SPAN') novoEstilo = corDoSpan(filho, novoEstilo)
      partes.push(...renderInlinePdf(filho, novoEstilo, key))
    }
  })
  return partes
}

export function converterHtmlParaPdf(html, keyPrefix, estiloTexto) {
  const vazio = [<Text key={`${keyPrefix}-vazio`} style={estiloTexto}>-</Text>]
  if (!html || !html.trim()) return vazio

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const blocos = []
  let idx = 0

  Array.from(doc.body.childNodes).forEach((node) => {
    const key = `${keyPrefix}-${idx++}`
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.trim()) blocos.push(<Text key={key} style={estiloTexto}>{node.textContent}</Text>)
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return

    const tag = node.tagName
    if (tag === 'UL' || tag === 'OL') {
      Array.from(node.children).forEach((li, i) => {
        const marcador = tag === 'OL' ? `${i + 1}.` : '•'
        blocos.push(
          <View key={`${key}-li-${i}`} style={{ flexDirection: 'row', marginBottom: 3 }}>
            <Text style={[estiloTexto, { width: 14 }]}>{marcador}</Text>
            <Text style={[estiloTexto, { flex: 1 }]}>{renderInlinePdf(li, estiloTexto, `${key}-li-${i}`)}</Text>
          </View>
        )
      })
      return
    }
    if (tag === 'BR') { blocos.push(<Text key={key}>{'\n'}</Text>); return }

    const conteudo = renderInlinePdf(node, estiloTexto, key)
    if (conteudo.length === 0) return
    blocos.push(<Text key={key} style={[estiloTexto, { marginBottom: 6 }]}>{conteudo}</Text>)
  })

  return blocos.length > 0 ? blocos : vazio
}

// --- ESTILOS DO PDF ---
export const styles = StyleSheet.create({
  page: { paddingTop: 35, paddingBottom: 50, paddingLeft: 40, paddingRight: 40, backgroundColor: '#FAFAFA', fontFamily: 'Helvetica' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end', justifyContent: 'center' },
  logoImage: { height: 40, width: 'auto', marginBottom: 5, objectFit: 'contain' },
  watermark: { fontSize: 8, color: '#9CA3AF' },
  watermarkBold: { color: '#059669', fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 },
  subtitle: { fontSize: 9, color: '#6B7280', textTransform: 'uppercase' },

  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#1F2937', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4, marginTop: 14 },
  sectionSubtitle: { fontSize: 9, color: '#6B7280', marginBottom: 8, marginTop: -4 },

  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
  metaItem: { width: '19%', minWidth: 90 },
  metaLabel: { fontSize: 8, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 },
  metaValue: { fontSize: 11, fontWeight: 'bold', color: '#1F2937' },
  metaRef: { fontSize: 7, color: '#9CA3AF', marginTop: 2 },

  refeicaoCard: { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8, overflow: 'hidden' },
  refeicaoHeader: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  refeicaoNome: { fontSize: 10, fontWeight: 'bold', color: '#1F2937' },
  refeicaoHorario: { fontSize: 8, color: '#6B7280' },
  itemRow: { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemNome: { flex: 2, fontSize: 9, color: '#374151' },
  itemQtd: { flex: 1, fontSize: 9, color: '#6B7280', textAlign: 'right' },
  itemMacro: { flex: 1.6, fontSize: 8, color: '#9CA3AF', textAlign: 'right' },
  itemSubstitutos: { paddingHorizontal: 10, paddingBottom: 4, fontSize: 8, color: '#9CA3AF', fontStyle: 'italic' },
  refeicaoSubtotal: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#FAFAFA' },
  refeicaoSubtotalTexto: { fontSize: 8, fontWeight: 'bold', color: '#4B5563' },
  opcaoLabel: { fontSize: 8, fontWeight: 'bold', color: '#059669', textTransform: 'uppercase', paddingHorizontal: 10, paddingTop: 6, paddingBottom: 2 },
  opcaoBloco: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  refeicaoNota: { fontSize: 8, color: '#92400E', backgroundColor: '#FFFBEB', borderTopWidth: 1, borderTopColor: '#FDE68A', paddingHorizontal: 10, paddingVertical: 6, lineHeight: 1.4 },

  docTitulo: { fontSize: 13, fontWeight: 'bold', color: '#1F2937', marginBottom: 8, marginTop: 10 },
  docCard: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
  textoBase: { fontSize: 10, color: '#374151', lineHeight: 1.5 },

  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, textAlign: 'center', fontSize: 8, color: '#9CA3AF' },
})

// --- BLOCO: Plano Alimentar (meta vs consumido + refeições) ---
export function BlocoPlanoAlimentar({ plano, refeicoes, pesoAtual, incluirMacros = true, incluirFibra }) {
  const itensOpcao1 = refeicoes.flatMap((r) => r.itens_refeicao.filter((i) => i.opcao_numero === 1))
  const totalDia = somarMacros(itensOpcao1.map(calcularMacrosItem))
  const fibraRecomendada = calcularFibraRecomendada(plano?.vet_target)

  const metaProteinaG = plano?.proteina_target_g_kg && pesoAtual ? plano.proteina_target_g_kg * pesoAtual : null
  const metaCarboG = plano?.carbo_target_g_kg && pesoAtual ? plano.carbo_target_g_kg * pesoAtual : null
  const metaLipidioG = plano?.lipidio_target_g_kg && pesoAtual ? plano.lipidio_target_g_kg * pesoAtual : null

  const refeicoesOrdenadas = [...refeicoes].sort(compararRefeicoes)

  return (
    <View>
      <Text style={styles.docTitulo}>🍽️ Plano Alimentar — {plano?.titulo || 'Plano'}</Text>

      {(incluirMacros || incluirFibra) && (
        <View style={styles.metaGrid}>
          {incluirMacros && (
            <>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Calorias</Text>
                <Text style={styles.metaValue}>{fmt(totalDia.kcal)}{plano?.vet_target ? ` / ${plano.vet_target}` : ''} kcal</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Proteína</Text>
                <Text style={styles.metaValue}>{fmt(totalDia.proteina)}{metaProteinaG ? ` / ${fmt(metaProteinaG)}` : ''} g</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Carboidrato</Text>
                <Text style={styles.metaValue}>{fmt(totalDia.carbo)}{metaCarboG ? ` / ${fmt(metaCarboG)}` : ''} g</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Lipídio</Text>
                <Text style={styles.metaValue}>{fmt(totalDia.lipidio)}{metaLipidioG ? ` / ${fmt(metaLipidioG)}` : ''} g</Text>
              </View>
            </>
          )}
          {incluirFibra && (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Fibra</Text>
              <Text style={styles.metaValue}>{fmt(totalDia.fibra)}{fibraRecomendada ? ` / ${fmt(fibraRecomendada)}` : ''} g</Text>
              {fibraRecomendada && <Text style={styles.metaRef}>Ref: 14g/1000kcal</Text>}
            </View>
          )}
        </View>
      )}

      {refeicoesOrdenadas.map((refeicao) => {
        // Todas as opções da refeição (não só a 1) — a Opção 1 segue sendo a
        // única usada na meta vs. calculado do topo (mesmo critério do
        // Portal do Paciente), mas quando o nutri cadastra mais de uma opção
        // como alternativas de verdade (não só substituição pontual), o PDF
        // precisa mostrar todas, senão a impressão sai incompleta.
        const opcoes = [...new Set(refeicao.itens_refeicao.map((i) => i.opcao_numero))].sort((a, b) => a - b)
        // Com só 1 opção o card inteiro é pequeno e cabe junto numa página
        // (wrap={false}); com várias opções (5, no caso da Raquel) o card
        // pode passar de uma página inteira — cada opção já tem seu próprio
        // wrap={false} logo abaixo, então o card em si pode quebrar entre
        // opções sem cortar uma opção ao meio.
        return (
          <View key={refeicao.id} style={styles.refeicaoCard} wrap={opcoes.length > 1}>
            <View style={styles.refeicaoHeader}>
              <Text style={styles.refeicaoNome}>{refeicao.nome_refeicao}</Text>
              {refeicao.horario && <Text style={styles.refeicaoHorario}>{refeicao.horario.slice(0, 5)}</Text>}
            </View>
            {opcoes.length === 0 ? (
              <View style={styles.itemRow}><Text style={styles.itemNome}>Sem itens.</Text></View>
            ) : (
              opcoes.map((n) => {
                const itensOpcao = refeicao.itens_refeicao.filter((i) => i.opcao_numero === n)
                const macrosOpcao = somarMacros(itensOpcao.map(calcularMacrosItem))
                return (
                  <View key={n} style={opcoes.length > 1 ? styles.opcaoBloco : null} wrap={false}>
                    {opcoes.length > 1 && <Text style={styles.opcaoLabel}>Opção {n}</Text>}
                    {itensOpcao.map((item) => {
                      const m = calcularMacrosItem(item)
                      const nome = item.nome_customizado || item.tabela_alimentos?.nome || 'Alimento removido'
                      const partesItem = []
                      if (incluirMacros) partesItem.push(`${fmt(m.kcal)}kcal · P${fmt(m.proteina)} · C${fmt(m.carbo)} · L${fmt(m.lipidio)}`)
                      if (incluirFibra) partesItem.push(`Fb${fmt(m.fibra)}`)
                      const substitutos = [...(item.substitutos_item || [])].sort((a, b) => a.ordem - b.ordem)
                      const textoSubstitutos = substitutos
                        .map((s) => `${s.tabela_alimentos?.nome || 'Alimento removido'} (${textoQuantidade(s)})`)
                        .join(' · ')
                      return (
                        <React.Fragment key={item.id}>
                          <View style={styles.itemRow}>
                            <Text style={styles.itemNome}>{nome}</Text>
                            <Text style={styles.itemQtd}>{textoQuantidade(item)}</Text>
                            {partesItem.length > 0 && <Text style={styles.itemMacro}>{partesItem.join(' · ')}</Text>}
                          </View>
                          {substitutos.length > 0 && (
                            <Text style={styles.itemSubstitutos}>OU: {textoSubstitutos}</Text>
                          )}
                        </React.Fragment>
                      )
                    })}
                    {(() => {
                      const partesSub = []
                      if (incluirMacros) partesSub.push(`${fmt(macrosOpcao.kcal)}kcal · P${fmt(macrosOpcao.proteina)}g · C${fmt(macrosOpcao.carbo)}g · L${fmt(macrosOpcao.lipidio)}g`)
                      if (incluirFibra) partesSub.push(`Fibra${fmt(macrosOpcao.fibra)}g`)
                      if (partesSub.length === 0) return null
                      return (
                        <View style={styles.refeicaoSubtotal}>
                          <Text style={styles.refeicaoSubtotalTexto}>Subtotal: {partesSub.join(' · ')}</Text>
                        </View>
                      )
                    })()}
                  </View>
                )
              })
            )}
            {refeicao.nota && <Text style={styles.refeicaoNota}>📝 {refeicao.nota}</Text>}
          </View>
        )
      })}
    </View>
  )
}

function CabecalhoPdf({ titulo, paciente, avaliador }) {
  const consultorio = avaliador?.empresa || 'Consultório'
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>{titulo}</Text>
        <Text style={[styles.title, { fontSize: 14, color: '#4B5563', marginBottom: 4 }]}>{paciente?.nome_completo}</Text>
        <Text style={styles.subtitle}>{consultorio}{avaliador?.nome_completo ? ` | ${avaliador.nome_completo}` : ''}</Text>
      </View>
      <View style={styles.headerRight}>
        {avaliador?.logomarca_url ? <Image src={avaliador.logomarca_url} style={styles.logoImage} /> : null}
        <Text style={styles.watermark}>Gerado via <Text style={styles.watermarkBold}>EvaluaOS</Text></Text>
      </View>
    </View>
  )
}

function renderBlocoConteudo(bloco, plano, refeicoes, pesoAtual) {
  if (bloco.tipo === 'plano') {
    if (!plano) return null
    return (
      <BlocoPlanoAlimentar
        plano={plano}
        refeicoes={refeicoes}
        pesoAtual={pesoAtual}
        incluirMacros={bloco.incluirMacros}
        incluirFibra={bloco.incluirFibra}
      />
    )
  }
  return (
    <View>
      <Text style={styles.docTitulo}>{bloco.tipo === 'orientacao' ? '📋' : '📝'} {bloco.label}</Text>
      {converterHtmlParaPdf(bloco.dados.conteudo, bloco.id, styles.textoBase)}
    </View>
  )
}

// --- DOCUMENTO ÚNICO (todos os blocos incluídos, na ordem escolhida) ---
function DocumentoPdfNutricional({ paciente, avaliador, blocos, plano, refeicoes, pesoAtual }) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <CabecalhoPdf titulo="Plano Nutricional" paciente={paciente} avaliador={avaliador} />

        {blocos.filter((b) => b.incluido).map((bloco) => (
          <View key={bloco.id} style={bloco.tipo === 'plano' ? undefined : styles.docCard} wrap>
            {renderBlocoConteudo(bloco, plano, refeicoes, pesoAtual)}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>Documento gerado pelo sistema EvaluaOS | {new Date().toLocaleDateString('pt-BR')}</Text>
        </View>
      </Page>
    </Document>
  )
}

const TITULO_BLOCO = { plano: 'Plano Nutricional', orientacao: 'Orientação Nutricional', lista: 'Lista de Recomendações' }

// --- DOCUMENTO INDIVIDUAL (um bloco só, pro modo "arquivos separados") ---
function DocumentoIndividual({ paciente, avaliador, bloco, plano, refeicoes, pesoAtual }) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <CabecalhoPdf titulo={TITULO_BLOCO[bloco.tipo]} paciente={paciente} avaliador={avaliador} />
        {renderBlocoConteudo(bloco, plano, refeicoes, pesoAtual)}
        <View style={styles.footer} fixed>
          <Text>Documento gerado pelo sistema EvaluaOS | {new Date().toLocaleDateString('pt-BR')}</Text>
        </View>
      </Page>
    </Document>
  )
}

// --- MODAL DE CONFIGURAÇÃO ---
export default function GeradorPdfNutricional({ paciente, avaliadorUserId, aoFechar }) {
  const [loading, setLoading] = useState(true)
  const [modo, setModo] = useState('unico') // 'unico' | 'separado'
  const [plano, setPlano] = useState(null)
  const [refeicoes, setRefeicoes] = useState([])
  const [pesoAtual, setPesoAtual] = useState(null)
  const [avaliador, setAvaliador] = useState(null)
  const [blocos, setBlocos] = useState([])
  const [gerandoUnico, setGerandoUnico] = useState(false)
  const [gerandoId, setGerandoId] = useState(null)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)

      const { data: planos } = await supabase
        .from('planos_alimentares')
        .select('*')
        .eq('id_paciente', paciente.id)
        .order('created_at', { ascending: false })
      const planoAtivo = (planos || []).find((p) => p.ativo) || (planos || [])[0] || null
      setPlano(planoAtivo)

      let listaRefeicoes = []
      if (planoAtivo) {
        const { data } = await supabase
          .from('refeicoes_prescritas')
          .select('*, itens_refeicao(*, tabela_alimentos(*), substitutos_item(*, tabela_alimentos(*)))')
          .eq('id_plano', planoAtivo.id)
          .order('ordem')
        listaRefeicoes = data || []
      }
      setRefeicoes(listaRefeicoes)

      const { data: aval } = await supabase
        .from('avaliacoes')
        .select('peso_paciente')
        .eq('id_paciente', paciente.id)
        .order('data_avaliacao', { ascending: false })
        .limit(1)
        .maybeSingle()
      setPesoAtual(aval?.peso_paciente || null)

      const { data: avaliadorData } = await supabase
        .from('avaliadores')
        .select('nome_completo, empresa, logomarca_url')
        .eq('auth_id', avaliadorUserId)
        .maybeSingle()
      setAvaliador(avaliadorData || null)

      const { data: orientacoes } = await supabase
        .from('orientacoes_nutricionais')
        .select('*')
        .eq('id_paciente', paciente.id)
        .order('created_at', { ascending: false })

      const { data: listas } = await supabase
        .from('listas_recomendacoes')
        .select('*')
        .eq('id_paciente', paciente.id)
        .order('created_at', { ascending: false })

      const blocosIniciais = [
        {
          id: 'plano', tipo: 'plano', label: 'Plano Alimentar (refeições, macros e fibra)',
          incluido: !!planoAtivo, incluirMacros: true, incluirFibra: true, disponivel: !!planoAtivo,
        },
        ...(orientacoes || []).map((o) => ({ id: `orientacao-${o.id}`, tipo: 'orientacao', label: o.titulo, incluido: true, disponivel: true, dados: o })),
        ...(listas || []).map((l) => ({ id: `lista-${l.id}`, tipo: 'lista', label: l.titulo, incluido: true, disponivel: true, dados: l })),
      ]
      setBlocos(blocosIniciais)

      setLoading(false)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paciente.id])

  const toggleIncluido = (id) => {
    setBlocos((prev) => prev.map((b) => (b.id === id ? { ...b, incluido: !b.incluido } : b)))
  }

  const toggleMacrosEFibra = () => {
    setBlocos((prev) =>
      prev.map((b) => (b.tipo === 'plano' ? { ...b, incluirMacros: !(b.incluirMacros || b.incluirFibra), incluirFibra: !(b.incluirMacros || b.incluirFibra) } : b))
    )
  }

  const mover = (id, direcao) => {
    setBlocos((prev) => {
      const idx = prev.findIndex((b) => b.id === id)
      const alvoIdx = direcao === 'cima' ? idx - 1 : idx + 1
      if (alvoIdx < 0 || alvoIdx >= prev.length) return prev
      const copia = [...prev]
      ;[copia[idx], copia[alvoIdx]] = [copia[alvoIdx], copia[idx]]
      return copia
    })
  }

  const nomeArquivo = paciente?.nome_completo ? paciente.nome_completo.replace(/\s+/g, '_') : 'Paciente'
  const algumIncluido = blocos.some((b) => b.incluido)

  const handleBaixarIndividual = async (bloco) => {
    setGerandoId(bloco.id)
    try {
      await baixarPdf(
        <DocumentoIndividual paciente={paciente} avaliador={avaliador} bloco={bloco} plano={plano} refeicoes={refeicoes} pesoAtual={pesoAtual} />,
        `${TITULO_BLOCO[bloco.tipo].replace(/\s+/g, '_')}_${nomeArquivo}.pdf`
      )
    } catch (err) {
      alert('Erro ao gerar PDF: ' + err.message)
    }
    setGerandoId(null)
  }

  const handleBaixarUnico = async () => {
    setGerandoUnico(true)
    try {
      await baixarPdf(
        <DocumentoPdfNutricional paciente={paciente} avaliador={avaliador} blocos={blocos} plano={plano} refeicoes={refeicoes} pesoAtual={pesoAtual} />,
        `Plano_Nutricional_${nomeArquivo}.pdf`
      )
    } catch (err) {
      alert('Erro ao gerar PDF: ' + err.message)
    }
    setGerandoUnico(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Gerar PDF Nutricional</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Escolha o que entra, a ordem e como baixar</p>
          </div>
          <button onClick={aoFechar} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
        </div>

        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-sm text-primary-600 font-semibold text-center py-6 animate-pulse">Carregando dados do paciente...</p>
          ) : blocos.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-6">
              Nenhum plano alimentar, orientação ou lista de recomendações encontrado pra este paciente ainda.
            </p>
          ) : (
            <>
              <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold w-fit">
                <button
                  type="button"
                  onClick={() => setModo('unico')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${modo === 'unico' ? 'bg-white dark:bg-slate-900 text-primary-600 shadow' : 'text-gray-500 dark:text-slate-400'}`}
                >
                  Um arquivo único
                </button>
                <button
                  type="button"
                  onClick={() => setModo('separado')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${modo === 'separado' ? 'bg-white dark:bg-slate-900 text-primary-600 shadow' : 'text-gray-500 dark:text-slate-400'}`}
                >
                  Arquivos separados
                </button>
              </div>

              {blocos.map((bloco, idx) => (
                <div
                  key={bloco.id}
                  className={`rounded-lg border p-3 ${bloco.incluido ? 'border-gray-200 dark:border-slate-700' : 'border-gray-100 dark:border-slate-800 opacity-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bloco.incluido}
                      disabled={!bloco.disponivel}
                      onChange={() => toggleIncluido(bloco.id)}
                      className="w-4 h-4 accent-primary-600 shrink-0"
                    />
                    <span className="flex-1 min-w-0 text-sm font-semibold text-gray-700 dark:text-slate-300 truncate">
                      {bloco.label}
                    </span>
                    <span className="text-[9px] font-bold uppercase text-gray-400 dark:text-slate-500 shrink-0">
                      {bloco.tipo === 'plano' ? 'Plano' : bloco.tipo === 'orientacao' ? 'Orientação' : 'Lista'}
                    </span>
                    {modo === 'unico' ? (
                      <div className="flex flex-col shrink-0">
                        <button
                          type="button"
                          onClick={() => mover(bloco.id, 'cima')}
                          disabled={idx === 0}
                          className="text-gray-300 dark:text-slate-600 hover:text-primary-600 disabled:opacity-30 leading-none p-0.5"
                          title="Mover pra cima"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => mover(bloco.id, 'baixo')}
                          disabled={idx === blocos.length - 1}
                          className="text-gray-300 dark:text-slate-600 hover:text-primary-600 disabled:opacity-30 leading-none p-0.5"
                          title="Mover pra baixo"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>
                    ) : (
                      bloco.incluido && (bloco.tipo !== 'plano' || plano) && (
                        <button
                          type="button"
                          onClick={() => handleBaixarIndividual(bloco)}
                          disabled={gerandoId === bloco.id}
                          className="flex items-center gap-1 px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[11px] font-semibold rounded-lg hover:bg-primary-100 shrink-0 disabled:opacity-50"
                        >
                          <FileDown size={12} />
                          {gerandoId === bloco.id ? '...' : 'Baixar'}
                        </button>
                      )
                    )}
                  </div>

                  {bloco.tipo === 'plano' && !bloco.disponivel && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 ml-6">
                      Sem plano alimentar ativo pra este paciente.
                    </p>
                  )}

                  {bloco.tipo === 'plano' && bloco.disponivel && (
                    <label className="flex items-center gap-2 mt-2 ml-6 cursor-pointer w-fit">
                      <input
                        type="checkbox"
                        checked={bloco.incluirMacros && bloco.incluirFibra}
                        disabled={!bloco.incluido}
                        onChange={toggleMacrosEFibra}
                        className="w-3.5 h-3.5 accent-primary-600"
                      />
                      <span className="text-xs text-gray-600 dark:text-slate-400">Incluir Macros e Fibra (calorias, proteína, carboidrato, lipídio, fibra)</span>
                    </label>
                  )}
                  {bloco.tipo === 'plano' && bloco.disponivel && (
                    <label className="flex items-center gap-2 mt-1 ml-6 w-fit opacity-50 cursor-not-allowed">
                      <input type="checkbox" disabled className="w-3.5 h-3.5" />
                      <span className="text-xs text-gray-400 dark:text-slate-500">Micronutrientes (em breve)</span>
                    </label>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800">
          <button
            onClick={aoFechar}
            className="px-5 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            {modo === 'separado' ? 'Fechar' : 'Cancelar'}
          </button>
          {!loading && modo === 'unico' && algumIncluido && (
            <button
              type="button"
              onClick={handleBaixarUnico}
              disabled={gerandoUnico}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
            >
              <FileDown size={16} />
              {gerandoUnico ? 'Gerando...' : 'Gerar PDF'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
