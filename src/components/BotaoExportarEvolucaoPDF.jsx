import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { classificarApVat, classificarImo, classificarConicidade } from '../utils/escalasNormativas';

// --- ESTILOS DO PDF DE EVOLUÇÃO ---
const styles = StyleSheet.create({
  page: { paddingTop: 35, paddingBottom: 50, paddingLeft: 40, paddingRight: 40, backgroundColor: '#FAFAFA', fontFamily: 'Helvetica' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end', justifyContent: 'center' },
  logoImage: { height: 40, width: 'auto', marginBottom: 5, objectFit: 'contain' },
  watermark: { fontSize: 8, color: '#9CA3AF' },
  watermarkBold: { color: '#059669', fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 2, textTransform: 'uppercase' },
  subtitle: { fontSize: 9, color: '#6B7280', textTransform: 'uppercase' },
  
  infoBox: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 15, flexDirection: 'row', flexWrap: 'wrap' },
  infoItem: { width: '33%', marginBottom: 8 },
  infoLabel: { fontSize: 8, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 },
  infoValue: { fontSize: 10, color: '#1F2937', fontWeight: 'bold' },

  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#1F2937', textTransform: 'uppercase', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4, marginTop: 10 },
  
  table: { width: '100%', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 4, backgroundColor: '#FFFFFF', overflow: 'hidden', marginBottom: 10 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', minHeight: 24, alignItems: 'center' },
  tableHeaderRow: { backgroundColor: '#F9FAFB' },
  colLabel: { flex: 2, paddingHorizontal: 6, paddingVertical: 4, fontSize: 9, color: '#374151', fontWeight: 'bold', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  colValue: { flex: 1, paddingHorizontal: 4, paddingVertical: 4, fontSize: 9, color: '#4B5563', textAlign: 'center', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  colDelta: { flex: 1, paddingHorizontal: 4, paddingVertical: 4, fontSize: 9, fontWeight: 'bold', textAlign: 'center' },

  badgeGreen: { backgroundColor: '#D1FAE5', color: '#065F46', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeGray: { backgroundColor: '#E5E7EB', color: '#6B7280', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeRed: { backgroundColor: '#FEE2E2', color: '#991B1B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeOrange: { backgroundColor: '#FFEDD5', color: '#9A3412', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeAmber: { backgroundColor: '#FEF3C7', color: '#92400E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeBlue: { backgroundColor: '#DBEAFE', color: '#1E40AF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },

  metaCard: { backgroundColor: '#FFFFFF', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 },
  metaTitleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metaBarBg: { backgroundColor: '#F3F4F6', height: 6, borderRadius: 3, width: '100%', marginBottom: 4 },
  metaBarFill: { backgroundColor: '#10B981', height: 6, borderRadius: 3 },

  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, textAlign: 'center', fontSize: 8, color: '#9CA3AF' }
});

const CORES_BADGE = { red: 'badgeRed', orange: 'badgeOrange', amber: 'badgeAmber', blue: 'badgeBlue', emerald: 'badgeGreen', gray: 'badgeGray' };

const ClassBadge = ({ cor, texto }) => {
  if (!texto || texto === '-') return null;
  const styleKey = CORES_BADGE[cor] || 'badgeGray';
  return <Text style={styles[styleKey]}>{texto}</Text>;
};

const EvolucaoPDF = ({ historico, paciente, avaliador, idade, configVisibilidade }) => {
  const consultorio = avaliador?.empresa || 'Consultório';
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  const podeExibir = (chave) => {
    if (!configVisibilidade) return true;
    const idPaciente = paciente?.id;
    if (idPaciente && configVisibilidade.pacientes?.[idPaciente]?.[chave] !== undefined) {
      return configVisibilidade.pacientes[idPaciente][chave];
    }
    if (configVisibilidade[chave] !== undefined) {
      return configVisibilidade[chave] !== false;
    }
    return true;
  };

  const renderRow = (label, chaveDado, unidade, isInverse = false, chaveVisibilidade = null, casasDecimais = 1) => {
    if (chaveVisibilidade && !podeExibir(chaveVisibilidade)) return null;

    const primeira = Number(historico[0][chaveDado]);
    const ultima = Number(historico[historico.length - 1][chaveDado]);
    const diff = ultima - primeira;

    let diffColor = '#9CA3AF';
    let diffText = '(0)';

    if (diff !== 0) {
        const isPos = diff > 0;
        const isGood = isInverse ? !isPos : isPos;
        diffColor = isGood ? '#059669' : '#DC2626';
        diffText = `${isPos ? '+' : ''}${diff.toFixed(casasDecimais)}`;
    }

    return (
        <View style={styles.tableRow} key={chaveDado} wrap={false}>
            <View style={styles.colLabel}><Text>{unidade ? `${label} (${unidade})` : label}</Text></View>
            {historico.map((av, idx) => {
                const val = Number(av[chaveDado]);
                return (
                    <View key={idx} style={styles.colValue}>
                        <Text>{val > 0 ? val.toFixed(casasDecimais) : '-'}</Text>
                    </View>
                );
            })}
            <View style={styles.colDelta}>
                <Text style={{ color: diffColor }}>{diffText}</Text>
            </View>
        </View>
    );
  };

  // --- Progresso de metas (mesma lógica de EvolucaoPaciente.jsx) ---
  const calcularProgressoMeta = (inicial, alvo, atual) => {
    const totalPlanejado = alvo - inicial;
    if (!totalPlanejado) return null;
    const alcancado = atual - inicial;
    return { totalPlanejado, alcancado, progressoPct: (alcancado / totalPlanejado) * 100, isGanho: totalPlanejado > 0 };
  };

  const paresComMeta = historico.slice(1).map((av, i) => ({ avMeta: historico[i], avAtual: av }))
    .filter(p => p.avMeta.peso_alvo || p.avMeta.meta_bf_percentual);

  // Meta definida na avaliação mais recente ainda não tem uma avaliação seguinte pra
  // comparar — mostra mesmo assim (mesma lógica de EvolucaoPaciente.jsx).
  const ultimaAvaliacaoDoHistorico = historico[historico.length - 1];
  if (ultimaAvaliacaoDoHistorico && (ultimaAvaliacaoDoHistorico.peso_alvo || ultimaAvaliacaoDoHistorico.meta_bf_percentual)) {
    paresComMeta.push({ avMeta: ultimaAvaliacaoDoHistorico, avAtual: ultimaAvaliacaoDoHistorico });
  }

  const renderLinhaMetaPDF = (titulo, unidade, inicial, alvo, atual, progresso, casasDecimais = 1) => {
    const superou = progresso.progressoPct > 100;
    const seAfastou = progresso.alcancado !== 0 && Math.sign(progresso.alcancado) !== Math.sign(progresso.totalPlanejado);
    const pctBarra = Math.max(4, Math.min(100, progresso.progressoPct));
    const corPct = superou ? '#059669' : seAfastou ? '#DC2626' : '#10B981';
    const textoPct = superou ? 'Meta superada' : seAfastou ? 'Se afastou da meta' : `${Math.max(0, progresso.progressoPct).toFixed(0)}%`;

    return (
      <View style={{ marginBottom: 4 }}>
        <View style={styles.metaTitleRow}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1F2937' }}>{titulo}</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: corPct }}>{textoPct}</Text>
        </View>
        <View style={styles.metaBarBg}><View style={[styles.metaBarFill, { width: `${seAfastou ? 4 : pctBarra}%`, backgroundColor: seAfastou ? '#DC2626' : '#10B981' }]} /></View>
        <Text style={{ fontSize: 8, color: '#4B5563' }}>Inicial: {Number(inicial).toFixed(casasDecimais)}{unidade} | Meta: {Number(alvo).toFixed(casasDecimais)}{unidade} | Atual: {Number(atual).toFixed(casasDecimais)}{unidade}</Text>
      </View>
    );
  };

  // --- Classificações da última avaliação (mesmos classificadores usados na tela) ---
  const ultimaAval = historico[historico.length - 1] || {};
  const infoApVatEvolucao = classificarApVat(Number(ultimaAval.apvat || 0), paciente?.sexo);
  const infoImoEvolucao = classificarImo(Number(ultimaAval.imo || 0), paciente?.sexo);
  const infoConicidadeEvolucao = classificarConicidade(Number(ultimaAval.conicidade || 0), paciente?.sexo);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* CABEÇALHO */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Evolução Antropométrica</Text>
            <Text style={[styles.title, { fontSize: 16, color: '#4B5563', marginBottom: 4 }]}>{paciente?.nome_completo}</Text>
            <Text style={styles.subtitle}>{consultorio} | Nutricionista: {avaliador?.nome_completo || '-'}</Text>
          </View>
          <View style={styles.headerRight}>
            {avaliador?.logomarca_url ? (
              <Image src={avaliador.logomarca_url} style={styles.logoImage} />
            ) : null}
            <Text style={styles.watermark}>Gerado via <Text style={styles.watermarkBold}>EvaluaOS</Text></Text>
          </View>
        </View>

        {/* DADOS DO PACIENTE */}
        <View style={styles.infoBox}>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Idade</Text><Text style={styles.infoValue}>{idade} anos</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Sexo</Text><Text style={styles.infoValue}>{paciente?.sexo === 'M' ? 'Masculino' : 'Feminino'}</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Estatura Atual</Text><Text style={styles.infoValue}>{historico[historico.length -1]?.estatura || '-'} cm</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Ocupação</Text><Text style={styles.infoValue}>{paciente?.ocupacao || '-'}</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Esporte</Text><Text style={styles.infoValue}>{(paciente?.pratica_esporte === 'true' || paciente?.pratica_esporte === true) ? paciente.modalidade_esportiva || 'Sim' : 'Não'}</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLabel}>Etnia</Text><Text style={styles.infoValue}>{paciente?.etnia || '-'}</Text></View>
        </View>

        {/* TABELA DE EVOLUÇÃO */}
        <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <View style={styles.colLabel}><Text>MÉTRICAS</Text></View>
                {historico.map((av, idx) => (
                    <View key={idx} style={styles.colValue}>
                        <Text style={{ fontWeight: 'bold', color: '#1F2937' }}>{av.nome_avaliacao}</Text>
                        <Text style={{ fontSize: 7, color: '#6B7280' }}>{av.dataStr_curta}</Text>
                    </View>
                ))}
                <View style={styles.colDelta}><Text>DIFERENÇA</Text></View>
            </View>

            <View style={[styles.tableRow, { backgroundColor: '#F3F4F6' }]} wrap={false}><View style={[styles.colLabel, { borderRightWidth: 0 }]}><Text>1. Composição Corporal</Text></View></View>
            {renderRow('Peso Corporal', 'peso', 'kg', true, 'evo_peso')}
            {renderRow('IMC', 'imc', 'kg/m²', true, 'evo_imc', 2)}
            {renderRow('% Gordura', 'gordura_perc', '%', true, 'evo_gordura_perc')}
            {renderRow('Massa de Gordura', 'massa_gorda', 'kg', true, 'evo_massa_gorda')}
            {renderRow('Massa Muscular', 'massa_muscular', 'kg', false, 'evo_massa_muscular')}
            {renderRow('Massa Magra', 'massa_magra', 'kg', false, 'evo_massa_magra')}

            <View style={[styles.tableRow, { backgroundColor: '#F3F4F6' }]} wrap={false}><View style={[styles.colLabel, { borderRightWidth: 0 }]}><Text>2. Perímetros (Circunferências)</Text></View></View>
            {renderRow('Cintura', 'cintura', 'cm', true, 'evo_perim_cintura')}
            {renderRow('Abdominal', 'perim_abdominal', 'cm', true, 'evo_perim_abdominal')}
            {renderRow('Quadril', 'quadril', 'cm', true, 'evo_perim_quadril')}
            {renderRow('Braço Relaxado', 'braco_rel', 'cm', false, 'evo_perim_braco_rel')}
            {renderRow('Braço Contraído', 'braco_cont', 'cm', false, 'evo_perim_braco_cont')}
            {renderRow('Antebraço', 'antibraco', 'cm', false, 'evo_perim_antibraco')}
            {renderRow('Coxa Máxima', 'coxa_max', 'cm', false, 'evo_perim_coxa_max')}
            {renderRow('Coxa Média', 'coxa_med', 'cm', false, 'evo_perim_coxa_med')}
            {renderRow('Panturrilha', 'perim_panturrilha', 'cm', false, 'evo_perim_panturrilha')}

            <View style={[styles.tableRow, { backgroundColor: '#F3F4F6' }]} wrap={false}><View style={[styles.colLabel, { borderRightWidth: 0 }]}><Text>3. Perímetros Corrigidos (Massa Muscular Regional)</Text></View></View>
            {renderRow('Braço Corrigido', 'perim_corrigido_braco', 'cm', false, 'evo_perim_braco_rel')}
            {renderRow('Coxa Corrigida', 'perim_corrigido_coxa', 'cm', false, 'evo_perim_coxa_med')}
            {renderRow('Panturrilha Corrigida', 'perim_corrigido_panturrilha', 'cm', false, 'evo_perim_panturrilha')}

            <View style={[styles.tableRow, { backgroundColor: '#F3F4F6' }]} wrap={false}><View style={[styles.colLabel, { borderRightWidth: 0 }]}><Text>4. Dobras Cutâneas & Somatórios</Text></View></View>
            {renderRow('Tríceps', 'triceps', 'mm', true, 'evo_dobra_triceps')}
            {renderRow('Subescapular', 'subescapular', 'mm', true, 'evo_dobra_subescapular')}
            {renderRow('Bíceps', 'biceps', 'mm', true, 'evo_dobra_biceps')}
            {renderRow('Crista Ilíaca', 'crista_iliaca', 'mm', true, 'evo_dobra_crista_iliaca')}
            {renderRow('Supraespinhal', 'supraespinhal', 'mm', true, 'evo_dobra_supraespinhal')}
            {renderRow('Abdominal', 'abdominal', 'mm', true, 'evo_dobra_abdominal')}
            {renderRow('Coxa Média', 'coxa', 'mm', true, 'evo_dobra_coxa')}
            {renderRow('Panturrilha', 'panturrilha', 'mm', true, 'evo_dobra_panturrilha')}
            {renderRow('Σ 6 Dobras', 'soma_6', 'mm', true, 'evo_soma_6')}
            {renderRow('Σ 8 Dobras', 'soma_8', 'mm', true, 'evo_soma_8')}

            {podeExibir('evo_grafico_barras_somatotipo') && (
              <>
                <View style={[styles.tableRow, { backgroundColor: '#F3F4F6' }]} wrap={false}><View style={[styles.colLabel, { borderRightWidth: 0 }]}><Text>5. Somatotipo (Heath-Carter)</Text></View></View>
                {renderRow('Endomorfia', 'endo', '', false)}
                {renderRow('Mesomorfia', 'meso', '', false)}
                {renderRow('Ectomorfia', 'ecto', '', false)}
              </>
            )}

            <View style={[styles.tableRow, { backgroundColor: '#F3F4F6' }]} wrap={false}><View style={[styles.colLabel, { borderRightWidth: 0 }]}><Text>6. Risco Cardiometabólico e Índices</Text></View></View>
            {renderRow('Cintura / Estatura', 'cintura_estatura', '', true, 'evo_idx_cintura_estatura', 2)}
            {renderRow('Cintura / Quadril (RCQ)', 'cintura_quadril', '', true, 'evo_idx_rcq', 2)}
            {renderRow('Área Visceral (apVAT)', 'apvat', 'cm²', true, 'evo_idx_apvat')}
            {renderRow('Índice Adiposo Muscular (IAM)', 'iam', '', true, 'evo_idx_iam', 2)}
            {renderRow('Índice Massa Óssea (IMO)', 'imo', '', false, 'evo_idx_imo', 3)}
            {renderRow('Índice de Conicidade', 'conicidade', '', true, 'evo_idx_conicidade', 2)}
        </View>

        {/* CLASSIFICAÇÕES DA ÚLTIMA AVALIAÇÃO */}
        {(podeExibir('evo_idx_apvat') || podeExibir('evo_idx_imo') || podeExibir('evo_idx_conicidade')) && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {podeExibir('evo_idx_apvat') && Number(ultimaAval.apvat) > 0 && (
              <View style={[styles.metaCard, { flex: 1 }]}>
                <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 3 }}>Risco apVAT (última avaliação)</Text>
                <ClassBadge cor={infoApVatEvolucao.cor} texto={infoApVatEvolucao.classificacao} />
              </View>
            )}
            {podeExibir('evo_idx_imo') && Number(ultimaAval.imo) > 0 && (
              <View style={[styles.metaCard, { flex: 1 }]}>
                <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 3 }}>Classificação IMO (última avaliação)</Text>
                <ClassBadge cor={infoImoEvolucao.cor} texto={infoImoEvolucao.classificacao} />
              </View>
            )}
            {podeExibir('evo_idx_conicidade') && Number(ultimaAval.conicidade) > 0 && (
              <View style={[styles.metaCard, { flex: 1 }]}>
                <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 3 }}>Risco Conicidade (última avaliação)</Text>
                <ClassBadge cor={infoConicidadeEvolucao.cor} texto={infoConicidadeEvolucao.classificacao} />
              </View>
            )}
          </View>
        )}

        {/* METAS & PROGRESSO */}
        {podeExibir('evo_metas') && paresComMeta.length > 0 && (
          <View style={{ marginBottom: 10 }} wrap={false}>
            <Text style={styles.sectionTitle}>Metas & Progresso</Text>
            {paresComMeta.map((par, idx) => {
              const progressoPeso = par.avMeta.peso_alvo ? calcularProgressoMeta(Number(par.avMeta.peso), par.avMeta.peso_alvo, Number(par.avAtual.peso)) : null;
              const progressoBf = par.avMeta.meta_bf_percentual ? calcularProgressoMeta(Number(par.avMeta.gordura_perc), par.avMeta.meta_bf_percentual, Number(par.avAtual.gordura_perc)) : null;
              if (!progressoPeso && !progressoBf) return null;

              return (
                <View key={idx} style={styles.metaCard}>
                  <View style={styles.metaTitleRow}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#6B7280' }}>Meta de {par.avMeta.dataStr_curta}</Text>
                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#6B7280' }}>{par.avMeta.id === par.avAtual.id ? 'Aguardando avaliação de acompanhamento' : `→ Avaliação de ${par.avAtual.dataStr_curta}`}</Text>
                  </View>
                  {progressoPeso && renderLinhaMetaPDF('Peso', 'kg', par.avMeta.peso, par.avMeta.peso_alvo, par.avAtual.peso, progressoPeso, 1)}
                  {progressoBf && renderLinhaMetaPDF('% Gordura', '%', par.avMeta.gordura_perc, par.avMeta.meta_bf_percentual, par.avAtual.gordura_perc, progressoBf, 1)}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>Documento gerado pelo sistema EvaluaOS | Impresso em {dataHoje}</Text>
        </View>
      </Page>
    </Document>
  )
}

export default function BotaoExportarEvolucaoPDF({ historico, paciente, avaliador, idade, isPublicView, configVisibilidade }) {
  const telefoneLimpo = paciente?.telefone ? paciente.telefone.replace(/\D/g, '') : '';
  const primeiroNome = paciente?.nome_completo ? paciente.nome_completo.split(' ')[0] : 'Paciente';
  const saudacao = avaliador?.nome_completo ? avaliador.nome_completo : 'seu Avaliador';
  
  // Pegando a última avaliação para enviar o link correto
  const ultimaAvaliacao = historico[historico.length - 1];
  const tokenPublico = paciente?.token_publico;
  const linkDoLaudo = tokenPublico ? `${window.location.origin}/evolucao/${tokenPublico}` : window.location.origin;

  const mensagemWhatsApp = `Olá *${primeiroNome}*, tudo bem? \n\nAqui é ${saudacao}! Acabei de gerar o relatório da sua *Evolução Antropométrica*.\n\nEstou te enviando em anexo o arquivo PDF com todos os seus comparativos.\n\nVocê também pode acessar seus dados de forma interativa através do link abaixo:\n${linkDoLaudo}\n\nQualquer dúvida, estou à disposição!`;

  const linkWhatsApp = telefoneLimpo && tokenPublico
    ? `https://wa.me/${telefoneLimpo.startsWith('55') ? telefoneLimpo : '55' + telefoneLimpo}?text=${encodeURIComponent(mensagemWhatsApp)}`
    : '#';

  return (
    <div className="flex justify-end gap-2 w-full md:w-auto">
      {!isPublicView && telefoneLimpo && tokenPublico ? (
        <a 
          href={linkWhatsApp} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center px-4 py-2.5 bg-green-500 text-white text-xs font-semibold rounded-lg shadow hover:bg-green-600 transition-colors flex-1 md:flex-none"
        >
          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/> 
         </svg>
          Enviar por Whatsapp
        </a>
      ) : null}

          <PDFDownloadLink
            document={<EvolucaoPDF historico={historico} paciente={paciente} avaliador={avaliador} idade={idade} configVisibilidade={configVisibilidade} />}
            fileName={`Evolucao_${paciente?.nome_completo ? paciente.nome_completo.replace(/\s+/g, '_') : 'Paciente'}.pdf`}
            className="flex items-center justify-center px-4 py-2.5 bg-gray-800 text-white text-xs font-semibold rounded-lg shadow hover:bg-gray-900 transition-colors flex-1 md:flex-none"
          >
            {({ loading }) => (loading ? 'Gerando PDF...' : 'Baixar PDF')}
          </PDFDownloadLink>
        </div>
      );
    }

    