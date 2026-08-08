import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Svg, Line, Polygon, Circle, Image } from '@react-pdf/renderer';
import {
  classificarImc,
  classificarRcq,
  classificarRce,
  classificarArgoref,
  classificarPercentilItaliano,
  classificarMorrow,
  classificarApVat,
  classificarImo,
  classificarSomatotipoDetalhado,
  calcularIndiceCormico,
  calcularIndiceManouvrier,
  calcularEnvergaduraRelativa,
  calcularIndiceConicidade,
  classificarConicidade
} from '../utils/escalasNormativas';

// --- ESTILOS DO PDF (Padrão Clean / Clínico) ---
const styles = StyleSheet.create({
  page: { paddingTop: 35, paddingBottom: 50, paddingLeft: 55, paddingRight: 35, backgroundColor: '#FAFAFA', fontFamily: 'Helvetica' },
  sectionWrap: { marginBottom: 15 }, 

  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end', justifyContent: 'center' },
  logoImage: { height: 40, width: 'auto', marginBottom: 5, objectFit: 'contain' },
  watermark: { fontSize: 8, color: '#9CA3AF', fontWeight: 'medium' },
  watermarkBold: { color: '#059669', fontWeight: 'bold' },

  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 },
  subtitle: { fontSize: 9, color: '#6B7280', textTransform: 'uppercase' },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#1F2937', textTransform: 'uppercase', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4 },
  cardGroup: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  cardGray: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 6, borderWidth: 1, borderColor: '#F3F4F6' },
  cardWhite: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', flex: 1 },
  cardGrayTitle: { fontSize: 8, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', marginBottom: 6 },
  cardGrayText: { fontSize: 10, color: '#374151', marginBottom: 3 },
  cardGrayLabel: { fontWeight: 'bold' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  gridItem2Col: { width: '48%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  gridItem3Col: { width: '31%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  gridItem4Col: { width: '23%', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  gridItem3ColStacked: { width: '31%', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  gridLabel: { fontSize: 9, color: '#4B5563' },
  gridValue: { fontSize: 9, fontWeight: 'bold', color: '#111827' },
  gridUnit: { fontSize: 7, color: '#9CA3AF', fontWeight: 'normal' },
  highlightCard: { flex: 1, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center' },
  highlightCardLeftBorder: { borderLeftWidth: 4, borderLeftColor: '#10B981' },
  highlightCardLeftBorderBlue: { borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
  highlightLabel: { fontSize: 7, fontWeight: 'bold', color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 },
  highlightValue: { fontSize: 14, fontWeight: 'bold', color: '#1F2937' },
  highlightRef: { fontSize: 7, color: '#9CA3AF', marginTop: 4 },
  textAmber: { color: '#F59E0B' }, textAmberDark: { color: '#D97706' }, textBlue: { color: '#2563EB' }, textEmerald: { color: '#047857' }, textIndigo: { color: '#4F46E5' }, textSlate: { color: '#475569' },
  badgeGreen: { backgroundColor: '#D1FAE5', color: '#065F46', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeGray: { backgroundColor: '#E5E7EB', color: '#6B7280', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeRed: { backgroundColor: '#FEE2E2', color: '#991B1B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeOrange: { backgroundColor: '#FFEDD5', color: '#9A3412', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeAmber: { backgroundColor: '#FEF3C7', color: '#92400E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  badgeBlue: { backgroundColor: '#DBEAFE', color: '#1E40AF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  classRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  descText: { fontSize: 7, color: '#6B7280', lineHeight: 1.4, marginTop: 3 },
  barContainer: { backgroundColor: '#F3F4F6', height: 8, borderRadius: 4, width: '100%', marginTop: 2 },
  barAmber: { backgroundColor: '#F59E0B', height: 8, borderRadius: 4 }, barBlue: { backgroundColor: '#3B82F6', height: 8, borderRadius: 4 }, barEmerald: { backgroundColor: '#10B981', height: 8, borderRadius: 4 },
  footer: { position: 'absolute', bottom: 20, left: 55, right: 35, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 10, textAlign: 'center', fontSize: 8, color: '#9CA3AF' }
});

// --- COMPONENTES AUXILIARES PARA O PDF ---
const MeasureItem = ({ label, value, unit, styleClass }) => {
  const displayVal = value !== undefined && value !== null && value !== '' ? Number(value).toFixed(unit === 'mm' || unit === '%' ? 1 : 2).replace('.00', '').replace('.0', '') : '-';
  return (
    <View style={styleClass}>
      <Text style={styles.gridLabel}>{label}</Text>
      <Text style={styles.gridValue}>{displayVal} <Text style={styles.gridUnit}>{displayVal !== '-' ? unit : ''}</Text></Text>
    </View>
  );
};

const HighlightCard = ({ label, value, unit, valColor, showBorder, refText, isBlueBorder, classInfo }) => (
  <View style={[styles.highlightCard, showBorder ? (isBlueBorder ? styles.highlightCardLeftBorderBlue : styles.highlightCardLeftBorder) : {}]}>
    <Text style={styles.highlightLabel}>{label}</Text>
    <Text style={[styles.highlightValue, valColor]}>{value > 0 ? (value % 1 !== 0 ? value.toFixed(2) : value) : '-'} <Text style={styles.gridUnit}>{unit}</Text></Text>
    {refText && <Text style={styles.highlightRef}>{refText}</Text>}
    {classInfo && value > 0 && <ClassBadge cor={classInfo.cor} texto={classInfo.classificacao} align="flex-start" />}
  </View>
);

const CORES_BADGE = {
  red: 'badgeRed',
  orange: 'badgeOrange',
  amber: 'badgeAmber',
  blue: 'badgeBlue',
  emerald: 'badgeGreen',
  gray: 'badgeGray'
};

const ClassBadge = ({ cor, texto, align = 'flex-end' }) => {
  if (!texto || texto === '-') return null;
  const styleKey = CORES_BADGE[cor] || 'badgeGray';
  return (
    <View style={{ flexDirection: 'row', justifyContent: align, marginTop: 4 }}>
      <Text style={styles[styleKey]}>{texto}</Text>
    </View>
  );
};

const ProgressBar = ({ label, value, valColor, barStyle }) => (
  <View style={{ marginBottom: 10 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
      <Text style={{ fontSize: 9, fontWeight: 'bold', color: valColor }}>{label}</Text>
      <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#111827' }}>{value || '-'}</Text>
    </View>
    <View style={styles.barContainer}>
      <View style={[barStyle, { width: `${Math.min(100, (value || 0) * 10)}%` }]} />
    </View>
  </View>
);  

// --- CORPO DO RELATÓRIO PDF ---
const RelatorioPDF = ({ dados, idade, statusCintura, iamVal, imoVal, nomeEmpresa, logomarcaUrl, configVisibilidade }) => {
  const aval = dados?.avaliacoes || {};
  const pac = dados?.pacientes || {};
  const dataFormatada = aval.data_avaliacao ? new Date(aval.data_avaliacao + 'T12:00:00').toLocaleDateString('pt-BR') : '-';
  const consultorio = nomeEmpresa || 'Consultório';

  const coordX = 140 + ((dados?.somatocarta_eixo_x || 0) * 15);
  const coordY = 140 - ((dados?.somatocarta_eixo_y || 0) * 11);

  // Inteligência de Visibilidade importada para dentro do PDF
  const podeExibir = (chave) => {
    if (!configVisibilidade) return true;
    const idPaciente = pac?.id;
    if (idPaciente && configVisibilidade.pacientes?.[idPaciente]?.[chave] !== undefined) {
      return configVisibilidade.pacientes[idPaciente][chave];
    }
    if (configVisibilidade[chave] !== undefined) {
      return configVisibilidade[chave] !== false;
    }
    return true;
  };

  const exibirBlocoPlanner = dados?.calorias_fase_mudanca && (podeExibir('laudo_plan_dieta') || podeExibir('laudo_plan_manutencao') || podeExibir('laudo_plan_peso_alvo') || podeExibir('laudo_plan_bf_alvo'));

  // --- CLASSIFICAÇÕES (mesmos classificadores e mesma lógica de ResultadoAvaliacao.jsx) ---
  const infoImc = classificarImc(dados?.imc);
  const infoRcq = classificarRcq(dados?.relacao_cintura_quadril, pac.sexo);
  const infoRce = classificarRce(dados?.relacao_cintura_estatura);

  const ehIdadeArgoref = idade >= 20 && idade <= 30;
  const infoSoma6 = ehIdadeArgoref
    ? classificarArgoref(dados?.somatorio_6_dobras, pac.sexo)
    : { classificacao: classificarPercentilItaliano(dados?.somatorio_6_dobras, pac.sexo, idade), cor: 'emerald' };
  const rotuloSoma6 = ehIdadeArgoref ? 'ARGOREF (Holway)' : 'Percentil ISAK (Campa)';

  const infoMorrow = classificarMorrow(aval.percentual_de_gordura, pac.sexo, idade);
  const infoApVat = classificarApVat(dados?.area_previsao_visceral_apvat, pac.sexo);
  const infoImo = classificarImo(imoVal, pac.sexo);

  const infoCormico = calcularIndiceCormico(aval.altura_sentado_paciente, aval.altura_paciente);
  const infoManouvrier = calcularIndiceManouvrier(aval.altura_sentado_paciente, aval.altura_paciente);
  const infoEnvergadura = calcularEnvergaduraRelativa(aval.envergadura_paciente, aval.altura_paciente);
  const conicidadeVal = calcularIndiceConicidade(aval.peso_paciente, aval.altura_paciente, aval.perimetro_cintura);
  const infoConicidade = classificarConicidade(conicidadeVal, pac.sexo);

  const descricoesSomatotipo = classificarSomatotipoDetalhado({
    endomorfia: dados?.somatotipo_endomorfia,
    mesomorfia: dados?.somatotipo_mesomorfia,
    ectomorfia: dados?.somatotipo_ectomorfia
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* CABEÇALHO */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Laudo Antropométrico</Text>
            <Text style={[styles.title, { fontSize: 16, color: '#4B5563', marginBottom: 4 }]}>{pac.nome_completo}</Text>
            <Text style={styles.subtitle}>{consultorio} | Avaliação em Consultório</Text>
          </View>
          <View style={styles.headerRight}>
            {logomarcaUrl ? (
              <Image src={logomarcaUrl} style={styles.logoImage} />
            ) : null}
            <Text style={styles.watermark}>Gerado via <Text style={styles.watermarkBold}>EvaluaOS</Text></Text>
          </View>
        </View>

        {/* INFORMAÇÕES GERAIS */}
        <View style={styles.cardGroup}>
          <View style={[styles.cardGray, { flex: 1 }]}>
            <Text style={styles.cardGrayTitle}>Sobre a Avaliação</Text>
            <Text style={styles.cardGrayText}><Text style={styles.cardGrayLabel}>Data: </Text>{dataFormatada}</Text>
            <Text style={styles.cardGrayText}><Text style={styles.cardGrayLabel}>Idade Calculada: </Text>{idade > 0 ? `${idade} anos` : '-'}</Text>
            {aval.equacao_de_regressao_escolhida && <Text style={styles.cardGrayText}><Text style={styles.cardGrayLabel}>Protocolo: </Text>{aval.equacao_de_regressao_escolhida}</Text>}
          </View>
          <View style={[styles.cardGray, { flex: 2 }]}>
            <Text style={styles.cardGrayTitle}>Perfil do Paciente</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <View style={{ width: '50%' }}>
                <Text style={styles.cardGrayText}><Text style={styles.cardGrayLabel}>Sexo: </Text>{pac.sexo === 'M' ? 'Masculino' : 'Feminino'}</Text>
                <Text style={styles.cardGrayText}><Text style={styles.cardGrayLabel}>Etnia: </Text>{pac.etnia || '-'}</Text>
                <Text style={styles.cardGrayText}><Text style={styles.cardGrayLabel}>Nac.: </Text>{pac.nacionalidade || '-'}</Text>
              </View>
              <View style={{ width: '50%' }}>
                <Text style={styles.cardGrayText}><Text style={styles.cardGrayLabel}>Ocupação: </Text>{pac.ocupacao || '-'}</Text>
                {(pac.pratica_esporte === 'true' || pac.pratica_esporte === true) && (
                  <Text style={styles.cardGrayText}><Text style={styles.cardGrayLabel}>Esporte: </Text>{pac.modalidade_esportiva || 'Sim'} {pac.nivel_pratica ? `(${pac.nivel_pratica})` : ''}</Text>
                )}
              </View>
            </View>
            {pac.observacoes && <Text style={[styles.cardGrayText, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}><Text style={styles.cardGrayLabel}>Obs: </Text>{pac.observacoes}</Text>}
          </View>
        </View>

        {/* 1. MEDIDAS BÁSICAS */}
        {(podeExibir('laudo_peso') || podeExibir('laudo_estatura') || podeExibir('laudo_altura_sentado') || podeExibir('laudo_envergadura')) && (
          <View style={styles.sectionWrap} wrap={false}>
            <Text style={styles.sectionTitle}>📐 1. Medidas Básicas</Text>
            <View style={styles.gridContainer}>
              {podeExibir('laudo_peso') && <MeasureItem styleClass={styles.gridItem4Col} label="Peso" value={aval.peso_paciente} unit="kg" />}
              {podeExibir('laudo_estatura') && <MeasureItem styleClass={styles.gridItem4Col} label="Estatura" value={aval.altura_paciente} unit="cm" />}
              {podeExibir('laudo_altura_sentado') && <MeasureItem styleClass={styles.gridItem4Col} label="Altura Sentado" value={aval.altura_sentado_paciente} unit="cm" />}
              {podeExibir('laudo_envergadura') && <MeasureItem styleClass={styles.gridItem4Col} label="Envergadura" value={aval.envergadura_paciente} unit="cm" />}
            </View>
          </View>
        )}

        {/* 2. COMPOSIÇÃO CORPORAL */}
        {(podeExibir('laudo_imc') || podeExibir('laudo_percentual_gordura') || podeExibir('laudo_massa_gorda') || podeExibir('laudo_massa_magra') || podeExibir('laudo_massa_muscular')) && (
          <View style={styles.sectionWrap} wrap={false}>
            <Text style={styles.sectionTitle}>📊 2. Composição Corporal</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {podeExibir('laudo_imc') && <HighlightCard label="IMC" value={dados?.imc} unit="kg/m²" valColor={{ color: '#1F2937' }} classInfo={infoImc} />}
              {podeExibir('laudo_percentual_gordura') && <HighlightCard label="% Gordura" value={aval.percentual_de_gordura} unit="%" valColor={styles.textAmber} />}
              {podeExibir('laudo_massa_gorda') && <HighlightCard label="Massa Gorda" value={dados?.massa_gorda} unit="kg" valColor={styles.textAmberDark} />}
              {podeExibir('laudo_massa_magra') && <HighlightCard label="Massa Magra" value={dados?.massa_magra} unit="kg" valColor={styles.textBlue} />}
              {podeExibir('laudo_massa_muscular') && <HighlightCard label="M. Muscular" value={dados?.massa_muscular} unit="kg" valColor={styles.textEmerald} showBorder={true} refText="Ref: Lee 2000" />}
            </View>
          </View>
        )}

        {/* FRACIONAMENTO 4C */}
        {podeExibir('laudo_fracionamento_4c') && aval.peso_paciente > 0 && (
          <View style={styles.sectionWrap} wrap={false}>
            <Text style={styles.sectionTitle}>🧩 Fracionamento Anatômico 4C</Text>
            <View style={styles.gridContainer}>
              <MeasureItem styleClass={styles.gridItem4Col} label="Tecido Adiposo" value={dados?.calcKerr} unit="kg" />
              <MeasureItem styleClass={styles.gridItem4Col} label="Tecido Muscular" value={dados?.massa_muscular} unit="kg" />
              <MeasureItem styleClass={styles.gridItem4Col} label="Tecido Ósseo" value={dados?.calcRocha} unit="kg" />
              <MeasureItem styleClass={styles.gridItem4Col} label="Massa Residual" value={dados?.calcWurch} unit="kg" />
            </View>
          </View>
        )}

        {/* 11. PLANEJAMENTO METABÓLICO & METAS */}
        {exibirBlocoPlanner && (
          <View style={styles.sectionWrap} wrap={false}>
            <Text style={styles.sectionTitle}>🎯 Planejamento Metabólico & Metas</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {podeExibir('laudo_plan_peso_alvo') && (
                <HighlightCard label={`Peso Alvo (${dados?.dias_alvo || '-'} dias)`} value={dados?.peso_alvo} unit="kg" valColor={styles.textEmerald} showBorder={true} />
              )}
              {podeExibir('laudo_plan_bf_alvo') && dados?.meta_bf_percentual && (
                <HighlightCard label="%GC Projetado" value={dados?.meta_bf_percentual} unit="%" valColor={styles.textAmber} showBorder={true} />
              )}
              {podeExibir('laudo_plan_dieta') && (
                <HighlightCard label="Dieta da Fase" value={dados?.calorias_fase_mudanca} unit="kcal" valColor={styles.textBlue} showBorder={true} isBlueBorder={true} />
              )}
              {podeExibir('laudo_plan_manutencao') && (
                <HighlightCard label="Nova Manutenção" value={dados?.calorias_manutencao_futura} unit="kcal" valColor={styles.textSlate} showBorder={true} isBlueBorder={true} />
              )}
            </View>
          </View>
        )}

        {/* 3. DOBRAS CUTÂNEAS */}
        {(podeExibir('laudo_dobra_triceps') || podeExibir('laudo_dobra_subescapular') || podeExibir('laudo_dobra_biceps') || podeExibir('laudo_dobra_crista_iliaca') || podeExibir('laudo_dobra_supraespinhal') || podeExibir('laudo_dobra_abdominal') || podeExibir('laudo_dobra_coxa') || podeExibir('laudo_dobra_panturrilha')) && (
          <View style={styles.sectionWrap} wrap={false}>
            <Text style={styles.sectionTitle}>🤏 3. Dobras Cutâneas</Text>
            <View style={styles.gridContainer}>
              {podeExibir('laudo_dobra_triceps') && <MeasureItem styleClass={styles.gridItem4Col} label="Tríceps" value={aval.dobra_cutanea_triceps} unit="mm" />}
              {podeExibir('laudo_dobra_subescapular') && <MeasureItem styleClass={styles.gridItem4Col} label="Subescapular" value={aval.dobra_cutanea_subescapular} unit="mm" />}
              {podeExibir('laudo_dobra_biceps') && <MeasureItem styleClass={styles.gridItem4Col} label="Bíceps" value={aval.dobra_cutanea_biceps} unit="mm" />}
              {podeExibir('laudo_dobra_crista_iliaca') && <MeasureItem styleClass={styles.gridItem4Col} label="Crista Ilíaca" value={aval.dobra_cutanea_crista_iliaca} unit="mm" />}
              {podeExibir('laudo_dobra_supraespinhal') && <MeasureItem styleClass={styles.gridItem4Col} label="Supraespinhal" value={aval.dobra_cutanea_supraespinhal} unit="mm" />}
              {podeExibir('laudo_dobra_abdominal') && <MeasureItem styleClass={styles.gridItem4Col} label="Abdominal" value={aval.dobra_cutanea_abdominal} unit="mm" />}
              {podeExibir('laudo_dobra_coxa') && <MeasureItem styleClass={styles.gridItem4Col} label="Coxa Média" value={aval.dobra_cutanea_coxa_media} unit="mm" />}
              {podeExibir('laudo_dobra_panturrilha') && <MeasureItem styleClass={styles.gridItem4Col} label="Panturrilha" value={aval.dobra_cutanea_panturrilha} unit="mm" />}
            </View>
          </View>
        )}

        {/* 4. INDICADORES DE SAÚDE */}
        {(podeExibir('laudo_rcq') || podeExibir('laudo_rce') || podeExibir('laudo_status_cintura') || podeExibir('laudo_soma_6') || podeExibir('laudo_soma_8') || podeExibir('laudo_indice_cormico') || podeExibir('laudo_manouvrier') || podeExibir('laudo_envergadura_relativa') || podeExibir('laudo_conicidade')) && (
          <View style={styles.sectionWrap} wrap={false}>
            <Text style={styles.sectionTitle}>⚖️ 4. Indicadores de Saúde</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              {podeExibir('laudo_rcq') && <HighlightCard label="RCQ" value={dados?.relacao_cintura_quadril} unit="" valColor={styles.textIndigo} classInfo={infoRcq} />}
              {podeExibir('laudo_rce') && <HighlightCard label="RCE" value={dados?.relacao_cintura_estatura} unit="" valColor={styles.textIndigo} classInfo={infoRce} />}
              {podeExibir('laudo_status_cintura') && (
                <View style={[styles.highlightCard, { alignItems: 'center' }]}>
                  <Text style={styles.highlightLabel}>Cintura (Status)</Text>
                  <Text style={styles.badgeGreen}>{statusCintura || '-'}</Text>
                </View>
              )}
              {podeExibir('laudo_soma_6') && <HighlightCard label={`Σ 6 Dobras`} value={dados?.somatorio_6_dobras} unit="mm" valColor={styles.textAmberDark} classInfo={{ cor: infoSoma6.cor, classificacao: infoSoma6.classificacao !== '-' ? `${rotuloSoma6}: ${infoSoma6.classificacao}` : null }} />}
              {podeExibir('laudo_soma_8') && <HighlightCard label="Σ 8 Dobras" value={dados?.somatorio_8_dobras} unit="mm" valColor={styles.textAmberDark} />}
            </View>

            {(podeExibir('laudo_indice_cormico') || podeExibir('laudo_manouvrier') || podeExibir('laudo_envergadura_relativa') || podeExibir('laudo_conicidade')) && (
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {podeExibir('laudo_indice_cormico') && infoCormico.valor > 0 && (
                  <HighlightCard label="Índice Córmico" value={infoCormico.valor} unit="" valColor={styles.textIndigo} classInfo={{ cor: 'gray', classificacao: infoCormico.classificacao }} />
                )}
                {podeExibir('laudo_manouvrier') && infoManouvrier.valor > 0 && (
                  <HighlightCard label="Manouvrier" value={infoManouvrier.valor} unit="" valColor={styles.textIndigo} classInfo={{ cor: 'gray', classificacao: infoManouvrier.classificacao }} />
                )}
                {podeExibir('laudo_envergadura_relativa') && infoEnvergadura.valor > 0 && (
                  <HighlightCard label="Envergadura Rel." value={infoEnvergadura.valor} unit="" valColor={styles.textIndigo} classInfo={{ cor: 'gray', classificacao: infoEnvergadura.classificacao }} />
                )}
                {podeExibir('laudo_conicidade') && conicidadeVal > 0 && (
                  <HighlightCard label="Índice de Conicidade" value={conicidadeVal} unit="" valColor={styles.textIndigo} classInfo={infoConicidade} />
                )}
              </View>
            )}
          </View>
        )}

        {/* 5 e 6. PERÍMETROS */}
        <View style={styles.sectionWrap} wrap={false}>
          <Text style={styles.sectionTitle}>🔄 5. Perímetros & 💪 6. Corrigidos</Text>
          <View style={styles.gridContainer}>
            {podeExibir('laudo_perim_braco_rel') && <MeasureItem styleClass={styles.gridItem3Col} label="Braço Relaxado" value={aval.perimetro_braco_relaxado} unit="cm" />}
            {podeExibir('laudo_perim_cintura') && <MeasureItem styleClass={styles.gridItem3Col} label="Cintura" value={aval.perimetro_cintura} unit="cm" />}
            {podeExibir('laudo_perim_coxa_med') && <MeasureItem styleClass={styles.gridItem3Col} label="Coxa Média" value={aval.perimetro_coxa_media} unit="cm" />}

            {podeExibir('laudo_perim_braco_cont') && <MeasureItem styleClass={styles.gridItem3Col} label="Braço Contraído" value={aval.perimetro_braco_contraido} unit="cm" />}
            {podeExibir('laudo_perim_abdominal') && <MeasureItem styleClass={styles.gridItem3Col} label="Abdominal" value={aval.perimetro_abdominal} unit="cm" />}
            {podeExibir('laudo_perim_panturrilha') && <MeasureItem styleClass={styles.gridItem3Col} label="Panturrilha" value={aval.perimetro_panturrilha} unit="cm" />}

            {podeExibir('laudo_perim_antibraco') && <MeasureItem styleClass={styles.gridItem3Col} label="Antebraço" value={aval.perimetro_antibraco} unit="cm" />}
            {podeExibir('laudo_perim_quadril') && <MeasureItem styleClass={styles.gridItem3Col} label="Quadril" value={aval.perimetro_quadril} unit="cm" />}
            {podeExibir('laudo_perim_coxa_max') && <MeasureItem styleClass={styles.gridItem3Col} label="Coxa Máxima" value={aval.perimetro_coxa_maxima} unit="cm" />}

            {(podeExibir('laudo_perim_corrigido_braco') || podeExibir('laudo_perim_corrigido_coxa') || podeExibir('laudo_perim_corrigido_panturrilha')) && (
              <>
                <View style={{ width: '100%', height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 }} />
                {podeExibir('laudo_perim_corrigido_braco') && (
                  <View style={styles.gridItem3Col}>
                    <Text style={styles.gridLabel}>Braço Corrigido</Text>
                    <Text style={[styles.gridValue, styles.textEmerald]}>{dados?.perimetro_corrigido_braco ? dados.perimetro_corrigido_braco.toFixed(2) : '-'} <Text style={styles.gridUnit}>cm</Text></Text>
                  </View>
                )}
                {podeExibir('laudo_perim_corrigido_coxa') && (
                  <View style={styles.gridItem3Col}>
                    <Text style={styles.gridLabel}>Coxa Corrigida</Text>
                    <Text style={[styles.gridValue, styles.textEmerald]}>{dados?.perimetro_corrigido_coxa ? dados.perimetro_corrigido_coxa.toFixed(2) : '-'} <Text style={styles.gridUnit}>cm</Text></Text>
                  </View>
                )}
                {podeExibir('laudo_perim_corrigido_panturrilha') && (
                  <View style={styles.gridItem3Col}>
                    <Text style={styles.gridLabel}>Panturrilha Corrigida</Text>
                    <Text style={[styles.gridValue, styles.textEmerald]}>{dados?.perimetro_corrigido_panturrilha ? dados.perimetro_corrigido_panturrilha.toFixed(2) : '-'} <Text style={styles.gridUnit}>cm</Text></Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* 7. DIÂMETROS */}
        {(podeExibir('laudo_diam_umero') || podeExibir('laudo_diam_femur') || podeExibir('laudo_diam_punho') || podeExibir('laudo_diam_maleolar')) && (
          <View style={styles.sectionWrap} wrap={false}>
            <Text style={styles.sectionTitle}>🦴 7. Diâmetros Ósseos</Text>
            <View style={styles.gridContainer}>
              {podeExibir('laudo_diam_umero') && <MeasureItem styleClass={styles.gridItem4Col} label="Úmero" value={aval.diametro_umero} unit="cm" />}
              {podeExibir('laudo_diam_femur') && <MeasureItem styleClass={styles.gridItem4Col} label="Fêmur" value={aval.diametro_femur} unit="cm" />}
              {podeExibir('laudo_diam_punho') && <MeasureItem styleClass={styles.gridItem4Col} label="Punho" value={aval.diametro_punho} unit="cm" />}
              {podeExibir('laudo_diam_maleolar') && <MeasureItem styleClass={styles.gridItem4Col} label="Tornozelo" value={aval.diametro_maleolar} unit="cm" />}
            </View>
          </View>
        )}

        {/* 8 e 9. SOMATOTIPO E SOMATOCARTA */}
        {(podeExibir('laudo_somatotipo_barras') || podeExibir('laudo_somatocarta_grafico')) && (
          <View style={styles.sectionWrap} wrap={false}>
            <Text style={styles.sectionTitle}>🧬 8. Somatotipo (Heath-Carter)</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              
              {podeExibir('laudo_somatotipo_barras') && (
                <View style={styles.cardWhite}>
                  <ProgressBar label="Endomorfia (Adiposidade)" value={dados?.somatotipo_endomorfia} valColor="#B45309" barStyle={styles.barAmber} />
                  <Text style={[styles.descText, { marginTop: -6, marginBottom: 8 }]}>{descricoesSomatotipo.endomorfia.descricao}</Text>
                  <ProgressBar label="Mesomorfia (Musculosidade)" value={dados?.somatotipo_mesomorfia} valColor="#1D4ED8" barStyle={styles.barBlue} />
                  <Text style={[styles.descText, { marginTop: -6, marginBottom: 8 }]}>{descricoesSomatotipo.mesomorfia.descricao}</Text>
                  <ProgressBar label="Ectomorfia (Linearidade)" value={dados?.somatotipo_ectomorfia} valColor="#047857" barStyle={styles.barEmerald} />
                  <Text style={[styles.descText, { marginTop: -6 }]}>{descricoesSomatotipo.ectomorfia.descricao}</Text>
                </View>
              )}

              {podeExibir('laudo_somatocarta_grafico') && (
                <View style={[styles.cardWhite, { alignItems: 'center', justifyContent: 'center' }]}>
                  <View style={{ width: 180, height: 180, position: 'relative' }}>
                    <Svg width="180" height="180" viewBox="0 0 280 280">
                      <Line x1="140" y1="20" x2="140" y2="260" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4" />
                      <Line x1="20" y1="140" x2="260" y2="140" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="4" />
                      <Polygon points="140,30 40,230 240,230" fill="none" stroke="#94A3B8" strokeWidth="1.5" />
                      {dados?.somatocarta_eixo_x != null && dados?.somatocarta_eixo_y != null && (
                        <Circle cx={coordX} cy={coordY} r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
                      )}
                    </Svg>
                    <Text style={{ position: 'absolute', top: 5, left: 0, width: 180, textAlign: 'center', fontSize: 7, fontWeight: 'bold', color: '#2563EB' }}>MESOMORFIA</Text>
                    <Text style={{ position: 'absolute', bottom: 15, left: -25, width: 100, textAlign: 'center', fontSize: 7, fontWeight: 'bold', color: '#D97706' }}>ENDOMORFIA</Text>
                    <Text style={{ position: 'absolute', bottom: 15, right: -25, width: 100, textAlign: 'center', fontSize: 7, fontWeight: 'bold', color: '#047857' }}>ECTOMORFIA</Text>
                  </View>
                  <Text style={{ fontSize: 7, color: '#6B7280', marginTop: 4 }}>
                    Coordenadas: X ({dados?.somatocarta_eixo_x || '0'}) | Y ({dados?.somatocarta_eixo_y || '0'})
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 10. OUTROS INDICADORES (IAM, IMO, apVAT, Morrow) */}
        {(podeExibir('laudo_iam') || podeExibir('laudo_imo') || podeExibir('laudo_apvat') || podeExibir('laudo_morrow')) && (
          <View style={styles.sectionWrap} wrap={false}>
            <Text style={styles.sectionTitle}>🚀 10. Outros Indicadores & Classificações</Text>
            <View style={styles.gridContainer}>
              {podeExibir('laudo_apvat') && (
                <View style={styles.gridItem3ColStacked}>
                  <Text style={styles.gridLabel}>Área Visceral (apVAT)</Text>
                  <Text style={styles.gridValue}>{dados?.area_previsao_visceral_apvat > 0 ? `${dados.area_previsao_visceral_apvat.toFixed(1)} cm²` : '-'}</Text>
                  <ClassBadge cor={infoApVat.cor} texto={infoApVat.classificacao} align="flex-start" />
                </View>
              )}
              {podeExibir('laudo_morrow') && (
                <View style={styles.gridItem3ColStacked}>
                  <Text style={styles.gridLabel}>Gordura (Morrow 2003)</Text>
                  <Text style={styles.gridValue}>{aval.percentual_de_gordura > 0 ? `${Number(aval.percentual_de_gordura).toFixed(1)}%` : '-'}</Text>
                  <ClassBadge cor={infoMorrow.cor} texto={infoMorrow.classificacao} align="flex-start" />
                </View>
              )}
              {podeExibir('laudo_iam') && (
                <View style={styles.gridItem3ColStacked}>
                  <Text style={styles.gridLabel}>IAM</Text>
                  <Text style={styles.gridValue}>{iamVal > 0 ? iamVal.toFixed(2) : '-'}</Text>
                </View>
              )}
              {podeExibir('laudo_imo') && (
                <View style={styles.gridItem3ColStacked}>
                  <Text style={styles.gridLabel}>Índice Músculo Ósseo</Text>
                  <Text style={[styles.gridValue, styles.textEmerald]}>{imoVal > 0 ? imoVal.toFixed(3) : '-'}</Text>
                  <ClassBadge cor={infoImo.cor} texto={infoImo.classificacao} align="flex-start" />
                </View>
              )}
            </View>
          </View>
        )}

        {/* RODAPÉ E MARCA D'ÁGUA FIXA */}
        <View style={styles.footer} fixed>
          <Text>Documento gerado pelo sistema EvaluaOS - {consultorio} | {dataFormatada}</Text>
        </View>

      </Page>
    </Document>
  );
};

// --- BOTÃO DE EXPORTAÇÃO E WHATSAPP ---
const BotaoExportarPDF = ({ dados, idade, statusCintura, iamVal, imoVal, nomeEmpresa, nomeAvaliador, logomarcaUrl, tokenPublico, isPublicView, configVisibilidade }) => {
  const pac = dados?.pacientes || {};
  const nomeArquivo = pac.nome_completo ? pac.nome_completo.replace(/\s+/g, '_') : 'Paciente';
  const primeiroNome = pac.nome_completo ? pac.nome_completo.split(' ')[0] : 'Paciente';
  const telefoneLimpo = pac.telefone ? pac.telefone.replace(/\D/g, '') : '';

  let saudacao = 'do seu Avaliador';

  if (nomeAvaliador && nomeEmpresa) {
    saudacao = `${nomeAvaliador} do consultório ${nomeEmpresa}`;
  } else if (nomeAvaliador) {
    saudacao = `${nomeAvaliador}`;
  } else if (nomeEmpresa) {
    saudacao = `do consultório ${nomeEmpresa}`;
  }

  const linkDoLaudo = `${window.location.origin}/laudo/${tokenPublico}`;

  const mensagemWhatsApp = `Olá *${primeiroNome}*, tudo bem? \n\nAqui é ${saudacao}! Seu laudo antropométrico já está pronto.\n\nAcesse o link abaixo para visualizar seus resultados interativos e acompanhar sua evolução:\n\n${linkDoLaudo}\n\nQualquer dúvida, estou à disposição!`;

  const linkWhatsApp = telefoneLimpo && tokenPublico
    ? `https://wa.me/${telefoneLimpo.startsWith('55') ? telefoneLimpo : '55' + telefoneLimpo}?text=${encodeURIComponent(mensagemWhatsApp)}`
    : '#';

  return (
    <div className="flex justify-end gap-3 w-full mt-2">

      {!isPublicView && telefoneLimpo && tokenPublico ? (
        <a 
          href={linkWhatsApp} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center px-4 py-2.5 bg-green-500 text-white text-sm font-semibold rounded-lg shadow hover:bg-green-600 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Enviar por Whatsapp
        </a>
      ) : null}

      <PDFDownloadLink
        document={
          <RelatorioPDF 
            dados={dados} 
            idade={idade} 
            statusCintura={statusCintura} 
            iamVal={iamVal} 
            imoVal={imoVal} 
            nomeEmpresa={nomeEmpresa} 
            logomarcaUrl={logomarcaUrl} 
            configVisibilidade={configVisibilidade} 
          />
        }
        fileName={`Laudo_EvaluaOS_${nomeArquivo}.pdf`}
        className="flex items-center justify-center px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-emerald-700 transition-colors"
      >
        {({ loading }) => (loading ? 'Desenhando laudo...' : 'Baixar Laudo em PDF')}
      </PDFDownloadLink>
    </div>
  );
};

export default BotaoExportarPDF;
