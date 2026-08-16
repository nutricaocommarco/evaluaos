import React, { useState, useEffect } from 'react'
import { Document, Page, Text, View, Image } from '@react-pdf/renderer'
import { supabase } from '../supabaseClient'
import { classificarImc, classificarRcq, classificarRce } from '../utils/escalasNormativas'
import { ArrowUp, ArrowDown, FileDown } from 'lucide-react'
import {
  styles, fmt, calcularFibraRecomendada, converterHtmlParaPdf, BlocoPlanoAlimentar, baixarPdf,
} from './GeradorPdfNutricional'

// Versão "completa" do gerador de PDF, só usada no Perfil do Paciente: além
// de Plano Alimentar / Orientações / Listas (mesmos blocos de
// GeradorPdfNutricional.jsx, reaproveitados via import), também puxa um
// resumo do Laudo e da Evolução (lê o que já está calculado e salvo em
// dados_calculados — não reprocessa fracionamento/somatotipo/etc, isso fica
// só no Laudo/Evolução completos, que continuam existindo do jeito que já
// eram). Dá pra baixar tudo junto num PDF só, ou cada bloco separado.

const CORES_BADGE_PDF = {
  red: { bg: '#FEE2E2', cor: '#991B1B' }, orange: { bg: '#FFEDD5', cor: '#9A3412' },
  amber: { bg: '#FEF3C7', cor: '#92400E' }, blue: { bg: '#DBEAFE', cor: '#1E40AF' },
  emerald: { bg: '#D1FAE5', cor: '#065F46' }, gray: { bg: '#E5E7EB', cor: '#6B7280' },
}

function BadgePdf({ cor, texto }) {
  if (!texto || texto === '-') return null
  const c = CORES_BADGE_PDF[cor] || CORES_BADGE_PDF.gray
  return (
    <Text style={{ backgroundColor: c.bg, color: c.cor, fontSize: 7, fontWeight: 'bold', textTransform: 'uppercase', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, marginTop: 3, alignSelf: 'flex-start' }}>
      {texto}
    </Text>
  )
}

function calcularIdadeEm(dataNascimento, dataReferencia) {
  if (!dataNascimento) return null
  const nasc = new Date(dataNascimento + 'T12:00:00')
  const ref = dataReferencia ? new Date(dataReferencia + 'T12:00:00') : new Date()
  let idade = ref.getFullYear() - nasc.getFullYear()
  const m = ref.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && ref.getDate() < nasc.getDate())) idade--
  return idade
}

// --- BLOCO: Laudo (resumo) ---
function BlocoLaudoResumo({ paciente, avaliacao, calc }) {
  const idade = calcularIdadeEm(paciente?.data_nascimento, avaliacao?.data_avaliacao)
  const infoImc = classificarImc(calc?.imc)
  const infoRcq = classificarRcq(calc?.relacao_cintura_quadril, paciente?.sexo)
  const infoRce = classificarRce(calc?.relacao_cintura_estatura)
  const dataFormatada = avaliacao?.data_avaliacao ? new Date(avaliacao.data_avaliacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-'

  return (
    <View>
      <Text style={styles.docTitulo}>📐 Laudo Antropométrico (resumo)</Text>
      <Text style={styles.sectionSubtitle}>Avaliação de {dataFormatada}{idade != null ? ` · ${idade} anos` : ''} — laudo completo disponível na tela de Laudo</Text>
      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Peso</Text>
          <Text style={styles.metaValue}>{fmt(Number(avaliacao?.peso_paciente)) || '-'} kg</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Estatura</Text>
          <Text style={styles.metaValue}>{fmt(Number(avaliacao?.altura_paciente)) || '-'} cm</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>IMC</Text>
          <Text style={styles.metaValue}>{fmt(Number(calc?.imc)) || '-'} kg/m²</Text>
          <BadgePdf cor={infoImc.cor} texto={infoImc.classificacao} />
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>% Gordura</Text>
          <Text style={styles.metaValue}>{fmt(Number(avaliacao?.percentual_de_gordura)) || '-'} %</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Massa Gorda</Text>
          <Text style={styles.metaValue}>{fmt(Number(calc?.massa_gorda)) || '-'} kg</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Massa Magra</Text>
          <Text style={styles.metaValue}>{fmt(Number(calc?.massa_magra)) || '-'} kg</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Massa Muscular</Text>
          <Text style={styles.metaValue}>{fmt(Number(calc?.massa_muscular)) || '-'} kg</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>RCQ</Text>
          <Text style={styles.metaValue}>{fmt(Number(calc?.relacao_cintura_quadril)) || '-'}</Text>
          <BadgePdf cor={infoRcq.cor} texto={infoRcq.classificacao} />
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>RCE</Text>
          <Text style={styles.metaValue}>{fmt(Number(calc?.relacao_cintura_estatura)) || '-'}</Text>
          <BadgePdf cor={infoRce.cor} texto={infoRce.classificacao} />
        </View>
      </View>
    </View>
  )
}

// --- BLOCO: Evolução (resumo) — compara primeira vs última avaliação ---
function LinhaComparativa({ label, unidade, valorInicial, valorAtual, inverso, casas = 1 }) {
  const inicial = Number(valorInicial)
  const atual = Number(valorAtual)
  const diff = atual - inicial
  let corDiff = '#9CA3AF'
  let textoDiff = '(0)'
  if (Number.isFinite(diff) && diff !== 0) {
    const positivo = diff > 0
    const bom = inverso ? !positivo : positivo
    corDiff = bom ? '#059669' : '#DC2626'
    textoDiff = `${positivo ? '+' : ''}${diff.toFixed(casas)}`
  }
  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemNome}>{unidade ? `${label} (${unidade})` : label}</Text>
      <Text style={styles.itemQtd}>{Number.isFinite(inicial) ? inicial.toFixed(casas) : '-'}</Text>
      <Text style={styles.itemQtd}>{Number.isFinite(atual) ? atual.toFixed(casas) : '-'}</Text>
      <Text style={[styles.itemQtd, { color: corDiff, fontWeight: 'bold' }]}>{textoDiff}</Text>
    </View>
  )
}

function BlocoEvolucaoResumo({ paciente, avaliacaoInicial, calcInicial, avaliacaoAtual, calcAtual }) {
  const dataIni = avaliacaoInicial?.data_avaliacao ? new Date(avaliacaoInicial.data_avaliacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-'
  const dataAtual = avaliacaoAtual?.data_avaliacao ? new Date(avaliacaoAtual.data_avaliacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-'

  return (
    <View>
      <Text style={styles.docTitulo}>📈 Evolução Antropométrica (resumo)</Text>
      <Text style={styles.sectionSubtitle}>Primeira avaliação ({dataIni}) comparada com a mais recente ({dataAtual}) — evolução completa com todas as avaliações disponível na tela de Evolução</Text>
      <View style={styles.refeicaoCard} wrap={false}>
        <View style={styles.refeicaoHeader}>
          <Text style={[styles.itemNome, { fontWeight: 'bold', color: '#1F2937' }]}>Métrica</Text>
          <Text style={[styles.itemQtd, { fontWeight: 'bold', color: '#1F2937' }]}>Inicial</Text>
          <Text style={[styles.itemQtd, { fontWeight: 'bold', color: '#1F2937' }]}>Atual</Text>
          <Text style={[styles.itemQtd, { fontWeight: 'bold', color: '#1F2937' }]}>Diferença</Text>
        </View>
        <LinhaComparativa label="Peso" unidade="kg" valorInicial={avaliacaoInicial?.peso_paciente} valorAtual={avaliacaoAtual?.peso_paciente} inverso casas={1} />
        <LinhaComparativa label="IMC" unidade="kg/m²" valorInicial={calcInicial?.imc} valorAtual={calcAtual?.imc} inverso casas={2} />
        <LinhaComparativa label="% Gordura" unidade="%" valorInicial={avaliacaoInicial?.percentual_de_gordura} valorAtual={avaliacaoAtual?.percentual_de_gordura} inverso casas={1} />
        <LinhaComparativa label="Massa Gorda" unidade="kg" valorInicial={calcInicial?.massa_gorda} valorAtual={calcAtual?.massa_gorda} inverso casas={1} />
        <LinhaComparativa label="Massa Magra" unidade="kg" valorInicial={calcInicial?.massa_magra} valorAtual={calcAtual?.massa_magra} casas={1} />
        <LinhaComparativa label="Massa Muscular" unidade="kg" valorInicial={calcInicial?.massa_muscular} valorAtual={calcAtual?.massa_muscular} casas={1} />
      </View>
    </View>
  )
}

// --- Cabeçalho e rodapé compartilhados ---
function CabecalhoDocumento({ titulo, paciente, avaliador }) {
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

function RodapeDocumento() {
  return (
    <View style={styles.footer} fixed>
      <Text>Documento gerado pelo sistema EvaluaOS | {new Date().toLocaleDateString('pt-BR')}</Text>
    </View>
  )
}

function renderConteudoBloco(bloco, ctx) {
  if (bloco.tipo === 'plano') {
    if (!ctx.plano) return null
    return (
      <BlocoPlanoAlimentar
        plano={ctx.plano}
        refeicoes={ctx.refeicoes}
        pesoAtual={ctx.pesoAtual}
        incluirMacros={bloco.incluirMacros}
        incluirFibra={bloco.incluirFibra}
      />
    )
  }
  if (bloco.tipo === 'laudo') {
    if (!ctx.laudoDisponivel) return null
    return <BlocoLaudoResumo paciente={ctx.paciente} avaliacao={ctx.avaliacaoAtual} calc={ctx.calcAtual} />
  }
  if (bloco.tipo === 'evolucao') {
    if (!ctx.evolucaoDisponivel) return null
    return (
      <BlocoEvolucaoResumo
        paciente={ctx.paciente}
        avaliacaoInicial={ctx.avaliacaoInicial}
        calcInicial={ctx.calcInicial}
        avaliacaoAtual={ctx.avaliacaoAtual}
        calcAtual={ctx.calcAtual}
      />
    )
  }
  // orientacao / lista
  return (
    <View>
      <Text style={styles.docTitulo}>{bloco.tipo === 'orientacao' ? '📋' : '📝'} {bloco.label}</Text>
      {converterHtmlParaPdf(bloco.dados.conteudo, bloco.id, styles.textoBase)}
    </View>
  )
}

// --- DOCUMENTO ÚNICO (todos os blocos incluídos, na ordem escolhida) ---
function DocumentoUnico({ paciente, avaliador, blocos, ctx }) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <CabecalhoDocumento titulo="Prontuário Nutricional" paciente={paciente} avaliador={avaliador} />
        {blocos.filter((b) => b.incluido).map((bloco) => (
          <View key={bloco.id} style={bloco.tipo === 'plano' ? undefined : styles.docCard} wrap>
            {renderConteudoBloco(bloco, ctx)}
          </View>
        ))}
        <RodapeDocumento />
      </Page>
    </Document>
  )
}

// --- DOCUMENTO INDIVIDUAL (um bloco só, pro modo "arquivos separados") ---
function DocumentoIndividual({ titulo, paciente, avaliador, bloco, ctx }) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <CabecalhoDocumento titulo={titulo} paciente={paciente} avaliador={avaliador} />
        {renderConteudoBloco(bloco, ctx)}
        <RodapeDocumento />
      </Page>
    </Document>
  )
}

const TITULO_BLOCO = { plano: 'Plano Nutricional', orientacao: 'Orientação Nutricional', lista: 'Lista de Recomendações', laudo: 'Laudo Antropométrico', evolucao: 'Evolução Antropométrica' }

export default function GeradorPdfCompleto({ paciente, avaliadorUserId, aoFechar }) {
  const [loading, setLoading] = useState(true)
  const [modo, setModo] = useState('unico') // 'unico' | 'separado'
  const [avaliador, setAvaliador] = useState(null)
  const [blocos, setBlocos] = useState([])
  const [ctx, setCtx] = useState({})
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

      let listaRefeicoes = []
      if (planoAtivo) {
        const { data } = await supabase
          .from('refeicoes_prescritas')
          .select('*, itens_refeicao(*, tabela_alimentos(*))')
          .eq('id_plano', planoAtivo.id)
          .order('ordem')
        listaRefeicoes = data || []
      }

      const { data: avaliacoesList } = await supabase
        .from('avaliacoes')
        .select('id, data_avaliacao, peso_paciente, altura_paciente, percentual_de_gordura, perimetro_cintura, perimetro_quadril')
        .eq('id_paciente', paciente.id)
        .order('data_avaliacao', { ascending: true })

      const pesoAtual = (avaliacoesList && avaliacoesList.length > 0) ? avaliacoesList[avaliacoesList.length - 1].peso_paciente : null

      let calculadosPorAvaliacao = {}
      if (avaliacoesList && avaliacoesList.length > 0) {
        const { data: calc } = await supabase
          .from('dados_calculados')
          .select('*')
          .in('id_avaliacao', avaliacoesList.map((a) => a.id))
        calculadosPorAvaliacao = Object.fromEntries((calc || []).map((c) => [c.id_avaliacao, c]))
      }

      const avaliacaoAtual = avaliacoesList && avaliacoesList.length > 0 ? avaliacoesList[avaliacoesList.length - 1] : null
      const avaliacaoInicial = avaliacoesList && avaliacoesList.length > 0 ? avaliacoesList[0] : null
      const calcAtual = avaliacaoAtual ? calculadosPorAvaliacao[avaliacaoAtual.id] : null
      const calcInicial = avaliacaoInicial ? calculadosPorAvaliacao[avaliacaoInicial.id] : null

      const laudoDisponivel = !!(avaliacaoAtual && calcAtual)
      const evolucaoDisponivel = !!(avaliacoesList && avaliacoesList.length >= 2 && calcInicial && calcAtual)

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

      setCtx({
        paciente, plano: planoAtivo, refeicoes: listaRefeicoes, pesoAtual,
        avaliacaoAtual, avaliacaoInicial, calcAtual, calcInicial, laudoDisponivel, evolucaoDisponivel,
      })

      setBlocos([
        {
          id: 'plano', tipo: 'plano', label: 'Plano Alimentar (refeições, macros e fibra)',
          incluido: !!planoAtivo, incluirMacros: true, incluirFibra: true, disponivel: !!planoAtivo,
        },
        {
          id: 'laudo', tipo: 'laudo', label: 'Laudo Antropométrico (resumo da avaliação mais recente)',
          incluido: laudoDisponivel, disponivel: laudoDisponivel,
        },
        {
          id: 'evolucao', tipo: 'evolucao', label: 'Evolução Antropométrica (resumo: primeira vs. mais recente)',
          incluido: evolucaoDisponivel, disponivel: evolucaoDisponivel,
        },
        ...(orientacoes || []).map((o) => ({ id: `orientacao-${o.id}`, tipo: 'orientacao', label: o.titulo, incluido: true, disponivel: true, dados: o })),
        ...(listas || []).map((l) => ({ id: `lista-${l.id}`, tipo: 'lista', label: l.titulo, incluido: true, disponivel: true, dados: l })),
      ])

      setLoading(false)
    }
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paciente.id])

  const toggleIncluido = (id) => setBlocos((prev) => prev.map((b) => (b.id === id ? { ...b, incluido: !b.incluido } : b)))
  const toggleMacrosEFibra = () =>
    setBlocos((prev) =>
      prev.map((b) => (b.tipo === 'plano' ? { ...b, incluirMacros: !(b.incluirMacros || b.incluirFibra), incluirFibra: !(b.incluirMacros || b.incluirFibra) } : b))
    )

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
  const blocosIncluidos = blocos.filter((b) => b.incluido)
  const algumIncluido = blocosIncluidos.length > 0

  const LABEL_TIPO = { plano: 'Plano', orientacao: 'Orientação', lista: 'Lista', laudo: 'Laudo', evolucao: 'Evolução' }

  const handleBaixarIndividual = async (bloco) => {
    setGerandoId(bloco.id)
    try {
      await baixarPdf(
        <DocumentoIndividual titulo={TITULO_BLOCO[bloco.tipo]} paciente={paciente} avaliador={avaliador} bloco={bloco} ctx={ctx} />,
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
        <DocumentoUnico paciente={paciente} avaliador={avaliador} blocos={blocos} ctx={ctx} />,
        `Prontuario_Nutricional_${nomeArquivo}.pdf`
      )
    } catch (err) {
      alert('Erro ao gerar PDF: ' + err.message)
    }
    setGerandoUnico(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Gerar PDF Completo</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Plano, Orientações, Listas, Laudo e Evolução — escolha o que entra e a ordem</p>
          </div>
          <button onClick={aoFechar} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
        </div>

        <div className="p-6 space-y-3 overflow-y-auto flex-1">
          {loading ? (
            <p className="text-sm text-primary-600 font-semibold text-center py-6 animate-pulse">Carregando dados do paciente...</p>
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
                      {LABEL_TIPO[bloco.tipo]}
                    </span>
                    {modo === 'unico' ? (
                      <div className="flex flex-col shrink-0">
                        <button type="button" onClick={() => mover(bloco.id, 'cima')} disabled={idx === 0} className="text-gray-300 dark:text-slate-600 hover:text-primary-600 disabled:opacity-30 leading-none p-0.5" title="Mover pra cima">
                          <ArrowUp size={12} />
                        </button>
                        <button type="button" onClick={() => mover(bloco.id, 'baixo')} disabled={idx === blocos.length - 1} className="text-gray-300 dark:text-slate-600 hover:text-primary-600 disabled:opacity-30 leading-none p-0.5" title="Mover pra baixo">
                          <ArrowDown size={12} />
                        </button>
                      </div>
                    ) : (
                      bloco.incluido && (
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
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 ml-6">Sem plano alimentar ativo pra este paciente.</p>
                  )}
                  {bloco.tipo === 'laudo' && !bloco.disponivel && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 ml-6">Abra o Laudo da avaliação mais recente pelo menos uma vez pra habilitar aqui.</p>
                  )}
                  {bloco.tipo === 'evolucao' && !bloco.disponivel && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 ml-6">Precisa de pelo menos 2 avaliações (com Laudo já aberto em cada) pra comparar evolução.</p>
                  )}

                  {bloco.tipo === 'plano' && bloco.disponivel && (
                    <>
                      <label className="flex items-center gap-2 mt-2 ml-6 cursor-pointer w-fit">
                        <input type="checkbox" checked={bloco.incluirMacros && bloco.incluirFibra} disabled={!bloco.incluido} onChange={toggleMacrosEFibra} className="w-3.5 h-3.5 accent-primary-600" />
                        <span className="text-xs text-gray-600 dark:text-slate-400">Incluir Macros e Fibra (calorias, proteína, carboidrato, lipídio, fibra)</span>
                      </label>
                      <label className="flex items-center gap-2 mt-1 ml-6 w-fit opacity-50 cursor-not-allowed">
                        <input type="checkbox" disabled className="w-3.5 h-3.5" />
                        <span className="text-xs text-gray-400 dark:text-slate-500">Micronutrientes (em breve)</span>
                      </label>
                    </>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800">
          <button onClick={aoFechar} className="px-5 py-2 border border-gray-300 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">
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
