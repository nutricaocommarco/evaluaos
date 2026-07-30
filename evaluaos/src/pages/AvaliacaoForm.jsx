import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

const initMeasures = (keys) =>
  keys.reduce((acc, key) => ({ ...acc, [key]: { m1: '', m2: '', m3: '' } }), {})

const basicaKeys = ['peso_paciente', 'altura_paciente', 'altura_sentado_paciente', 'envergadura_paciente']
const dobraKeys = ['dobra_cutanea_triceps', 'dobra_cutanea_subescapular', 'dobra_cutanea_biceps', 'dobra_cutanea_crista_iliaca', 'dobra_cutanea_supraespinhal', 'dobra_cutanea_abdominal', 'dobra_cutanea_coxa_media', 'dobra_cutanea_panturrilha']
const perimetroKeys = ['perimetro_braco_relaxado', 'perimetro_braco_contraido', 'perimetro_antibraco', 'perimetro_cintura', 'perimetro_abdominal', 'perimetro_quadril', 'perimetro_coxa_maxima', 'perimetro_coxa_media', 'perimetro_panturrilha']
const diametroKeys = ['diametro_umero', 'diametro_femur', 'diametro_punho', 'diametro_maleolar']
const allKeys = [...basicaKeys, ...dobraKeys, ...perimetroKeys, ...diametroKeys]

const labels = {
  peso_paciente: 'Peso (kg)',
  altura_paciente: 'Estatura / Altura (cm)',
  altura_sentado_paciente: 'Altura Sentado (cm)',
  envergadura_paciente: 'Envergadura (cm)',
  dobra_cutanea_triceps: 'Tríceps',
  dobra_cutanea_subescapular: 'Subescapular',
  dobra_cutanea_biceps: 'Bíceps',
  dobra_cutanea_crista_iliaca: 'Crista Ilíaca',
  dobra_cutanea_supraespinhal: 'Supraespinhal',
  dobra_cutanea_abdominal: 'Abdominal',
  dobra_cutanea_coxa_media: 'Coxa Média',
  dobra_cutanea_panturrilha: 'Panturrilha',
  perimetro_braco_relaxado: 'Braço Relaxado',
  perimetro_braco_contraido: 'Braço Contraído',
  perimetro_antibraco: 'Antebraço',
  perimetro_cintura: 'Cintura',
  perimetro_abdominal: 'Abdominal',
  perimetro_quadril: 'Quadril',
  perimetro_coxa_maxima: 'Coxa Máxima',
  perimetro_coxa_media: 'Coxa Média',
  perimetro_panturrilha: 'Panturrilha',
  diametro_umero: 'Biepicondilar do Úmero',
  diametro_femur: 'Bicondilar do Fêmur',
  diametro_punho: 'Biestilóide (Punho)',
  diametro_maleolar: 'Bimaleolar (Tornozelo)'
}

const calcularSomatotipo = (medidas) => {
  const triceps = medidas.dobra_cutanea_triceps || 0;
  const subescapular = medidas.dobra_cutanea_subescapular || 0;
  const supraespinhal = medidas.dobra_cutanea_supraespinhal || 0;
  const panturrilha_dobra = medidas.dobra_cutanea_panturrilha || 0;
  
  const altura = medidas.altura_paciente || 0;
  const diam_umero = medidas.diametro_umero || 0;
  const diam_femur = medidas.diametro_femur || 0;
  const perim_braco = medidas.perimetro_braco_contraido || 0;
  const perim_panturrilha = medidas.perimetro_panturrilha || 0;
  const peso = medidas.peso_paciente || 0;

  const somaDobrasEndo = (triceps + subescapular + supraespinhal) * (170.18 / (altura || 1));
  let endomorfia = 0;
  if (altura > 0) {
    endomorfia = -0.7182 + (0.1451 * somaDobrasEndo) - (0.00068 * Math.pow(somaDobrasEndo, 2)) + (0.0000014 * Math.pow(somaDobrasEndo, 3));
  }

  const braco_corrigido = perim_braco - (triceps / 10);
  const panturrilha_corrigida = perim_panturrilha - (panturrilha_dobra / 10);
  let mesomorfia = 0;
  if (altura > 0) {
    mesomorfia = (0.858 * diam_umero) + (0.601 * diam_femur) + (0.188 * braco_corrigido) + (0.161 * panturrilha_corrigida) - (0.131 * altura) + 4.5;
  }

  let ectomorfia = 0;
  if (peso > 0 && altura > 0) {
    const cap = altura / Math.pow(peso, 0.3333);
    if (cap >= 40.75) {
      ectomorfia = 0.732 * cap - 28.58;
    } else if (cap > 38.25 && cap < 40.75) {
      ectomorfia = 0.463 * cap - 17.63;
    } else {
      ectomorfia = 0.1;
    }
  }

  const eixoX = ectomorfia - endomorfia;
  const eixoY = (2 * mesomorfia) - (endomorfia + ectomorfia);

  return {
    somatotipo_endomorfia: Math.max(0.1, Number(endomorfia.toFixed(1))),
    somatotipo_mesomorfia: Math.max(0.1, Number(mesomorfia.toFixed(1))),
    somatotipo_ectomorfia: Math.max(0.1, Number(ectomorfia.toFixed(1))),
    somatocarta_eixo_x: Number(eixoX.toFixed(1)),
    somatocarta_eixo_y: Number(eixoY.toFixed(1))
  }
}

const MeasureRow = ({ label, field, categoryType, state, setter, isSingleMode, handleMeasureChange }) => {
  const { m1, m2, m3 } = state[field] || { m1: '', m2: '', m3: '' }
  const v1 = parseFloat(m1)
  const v2 = parseFloat(m2)

  let needsThird = false
  let diffPercent = 0
  let finalValue = '-'

  if (!isSingleMode && !isNaN(v1) && !isNaN(v2) && v1 > 0 && v2 > 0) {
    diffPercent = (Math.abs(v1 - v2) / ((v1 + v2) / 2)) * 100
    const threshold = categoryType === 'dobras' ? 5 : 1
    needsThird = diffPercent > threshold
  }

  if (isSingleMode) {
    if (!isNaN(v1)) finalValue = v1.toFixed(1)
  } else {
    if (!needsThird && !isNaN(v1) && !isNaN(v2)) {
      finalValue = ((v1 + v2) / 2).toFixed(1)
    } else if (needsThird && !isNaN(parseFloat(m3))) {
      const sorted = [v1, v2, parseFloat(m3)].sort((a, b) => a - b)
      finalValue = sorted[1].toFixed(1)
    }
  }

  const globalIndex = allKeys.indexOf(field)
  const tabIndexM1 = 100 + globalIndex
  const tabIndexM2 = 200 + globalIndex
  const tabIndexM3 = 300 + globalIndex

  return (
    <div className="flex flex-col md:grid md:grid-cols-12 gap-2 md:items-center border-b border-gray-100 py-3 md:py-2 hover:bg-gray-50 px-2 rounded transition-colors">
      <div className="col-span-4 text-sm md:text-xs font-medium text-gray-700">{label}</div>
      <div className="col-span-6 grid grid-cols-3 gap-2">
        <input type="number" step="0.1" tabIndex={tabIndexM1} value={m1} onChange={(e) => handleMeasureChange(setter, field, 'm1', e.target.value)} className="w-full px-2 py-1.5 border rounded-md text-sm text-center focus:border-emerald-500 bg-white" placeholder={isSingleMode ? "Valor" : "1ª"} />
        {!isSingleMode && (
          <>
            <input type="number" step="0.1" tabIndex={tabIndexM2} value={m2} onChange={(e) => handleMeasureChange(setter, field, 'm2', e.target.value)} className="w-full px-2 py-1.5 border rounded-md text-sm text-center focus:border-emerald-500 bg-white" placeholder="2ª" />
            <input type="number" step="0.1" tabIndex={tabIndexM3} disabled={!needsThird} value={m3} onChange={(e) => handleMeasureChange(setter, field, 'm3', e.target.value)} className={`w-full px-2 py-1.5 border rounded-md text-sm text-center transition-colors ${needsThird ? 'ring-2 ring-red-400 bg-red-50 focus:ring-red-500' : 'opacity-40 bg-gray-100 cursor-not-allowed'}`} placeholder="3ª" />
          </>
        )}
      </div>
      <div className="col-span-2 text-right md:text-center mt-1 md:mt-0">
        <span className="text-xs text-gray-500 md:hidden mr-2">Resultado:</span>
        <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">{finalValue}</span>
      </div>
    </div>
  )
}

export default function AvaliacaoForm() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const paciente = location.state?.paciente || null
  const avaliacaoIdParaEditar = location.state?.avaliacaoIdParaEditar || null

  const [loading, setLoading] = useState(false)
  const [isSingleMode, setIsSingleMode] = useState(false)

  const [dataAvaliacao, setDataAvaliacao] = useState(new Date().toISOString().split('T')[0])
  const [horaAvaliacao, setHoraAvaliacao] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))

  const [basicas, setBasicas] = useState(initMeasures(basicaKeys))
  const [dobras, setDobras] = useState(initMeasures(dobraKeys))
  const [perimetros, setPerimetros] = useState(initMeasures(perimetroKeys))
  const [diametros, setDiametros] = useState(initMeasures(diametroKeys))
  
  useEffect(() => {
    async function carregarAvaliacaoParaEdicao() {
      if (!avaliacaoIdParaEditar) return
      setLoading(true)
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('id', avaliacaoIdParaEditar)
        .single()

      if (error) {
        alert('Erro ao carregar dados para edição: ' + error.message)
        setLoading(false)
        return
      }

      if (data) {
        setDataAvaliacao(data.data_avaliacao || new Date().toISOString().split('T')[0])
        setHoraAvaliacao(data.hora_avaliacao || '')

        const preencherEstado = (keys) => {
          return keys.reduce((acc, key) => {
            acc[key] = { m1: data[key] != null ? String(data[key]) : '', m2: '', m3: '' }
            return acc
          }, {})
        }

        setBasicas(preencherEstado(basicaKeys))
        setDobras(preencherEstado(dobraKeys))
        setPerimetros(preencherEstado(perimetroKeys))
        setDiametros(preencherEstado(diametroKeys))
        setIsSingleMode(true)
      }
      setLoading(false)
    }

    carregarAvaliacaoParaEdicao()
  }, [avaliacaoIdParaEditar])

  if (!paciente) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
        <h2 className="text-xl font-bold text-gray-800">Nenhum paciente selecionado</h2>
        <p className="text-gray-500">Selecione um paciente na lista para iniciar a avaliação.</p>
        <button onClick={() => navigate('/pacientes')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg">
          Ir para Meus Pacientes
        </button>
      </div>
    )
  }

  const handleMeasureChange = (setter, field, index, value) => {
    setter((prev) => ({ ...prev, [field]: { ...prev[field], [index]: value } }))
  }

  const resolveMeasure = (obj, type, label, errorsArray) => {
    const v1 = parseFloat(obj.m1)
    const v2 = parseFloat(obj.m2)
    const v3 = parseFloat(obj.m3)

    if (isSingleMode) return isNaN(v1) ? null : v1

    if (!isNaN(v1) && !isNaN(v2)) {
      const diffPercent = (Math.abs(v1 - v2) / ((v1 + v2) / 2)) * 100
      const threshold = type === 'dobras' ? 5 : 1

      if (diffPercent > threshold) {
        if (isNaN(v3)) {
          errorsArray.push(`3ª medida obrigatória para: ${label}`)
          return null
        }
        const sorted = [v1, v2, v3].sort((a, b) => a - b)
        return sorted[1]
      }
      return (v1 + v2) / 2
    }
    
    if (isNaN(v1) && isNaN(v2)) return null;
    errorsArray.push(`Preencha a 2ª medida para: ${label}`)
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    let validationErrors = []

    const resolvedBasicas = basicaKeys.reduce((acc, key) => { acc[key] = resolveMeasure(basicas[key], 'basicas', labels[key], validationErrors); return acc }, {})
    const resolvedDobras = dobraKeys.reduce((acc, key) => { acc[key] = resolveMeasure(dobras[key], 'dobras', labels[key], validationErrors); return acc }, {})
    const resolvedPerimetros = perimetroKeys.reduce((acc, key) => { acc[key] = resolveMeasure(perimetros[key], 'perimetros', labels[key], validationErrors); return acc }, {})
    const resolvedDiametros = diametroKeys.reduce((acc, key) => { acc[key] = resolveMeasure(diametros[key], 'diametros', labels[key], validationErrors); return acc }, {})

    if (validationErrors.length > 0) {
      alert("⚠️ Erros de Validação:\n\n" + validationErrors.join('\n'))
      setLoading(false)
      return
    }

    const payloadBruto = {
      id_paciente: paciente.id,
      data_avaliacao: dataAvaliacao,
      hora_avaliacao: horaAvaliacao,
      ...resolvedBasicas,
      ...resolvedDobras,
      ...resolvedPerimetros,
      ...resolvedDiametros
    }

    let avaliacaoSalvaId = avaliacaoIdParaEditar

    if (avaliacaoIdParaEditar) {
      const { error: updateError } = await supabase
        .from('avaliacoes')
        .update(payloadBruto)
        .eq('id', avaliacaoIdParaEditar)

      if (updateError) {
        alert('Erro ao atualizar avaliação: ' + updateError.message)
        setLoading(false)
        return
      }
    } else {
      const { data: novaAval, error: insertError } = await supabase
        .from('avaliacoes')
        .insert([payloadBruto])
        .select()
        .single()

      if (insertError) {
        alert('Erro ao salvar avaliação: ' + insertError.message)
        setLoading(false)
        return
      }
      avaliacaoSalvaId = novaAval.id
    }

    const pesoFinal = resolvedBasicas.peso_paciente || 0
    const alturaCm = resolvedBasicas.altura_paciente || 0
    const alturaM = alturaCm / 100

    const calcImc = alturaM > 0 ? pesoFinal / (alturaM * alturaM) : 0
    const massaGordaCalc = 0
    const massaMagraCalc = 0

    const pBraco = resolvedPerimetros.perimetro_braco_relaxado || 0
    const pCoxa = resolvedPerimetros.perimetro_coxa_media || 0
    const pPant = resolvedPerimetros.perimetro_panturrilha || 0
    const dTri = resolvedDobras.dobra_cutanea_triceps || 0
    const dCoxa = resolvedDobras.dobra_cutanea_coxa_media || 0
    const dPant = resolvedDobras.dobra_cutanea_panturrilha || 0

    const calcPerimCorrigidoBraco = pBraco > 0 ? pBraco - (dTri * 0.314) : 0;
    const calcPerimCorrigidoCoxa = pCoxa > 0 ? pCoxa - (dCoxa * 0.314) : 0;
    const calcPerimCorrigidoPanturrilha = pPant > 0 ? pPant - (dPant * 0.314) : 0;

    const termoBraco = Math.pow(calcPerimCorrigidoBraco, 2)
    const termoCoxa = Math.pow(calcPerimCorrigidoCoxa, 2)
    const termoPant = Math.pow(calcPerimCorrigidoPanturrilha, 2)

    let calcMuscular = 0
    if (alturaM > 0 && pBraco > 0 && pCoxa > 0 && pPant > 0) {
      const sexoNum = paciente.sexo === 'M' ? 1 : 0
      let racaNum = 0
      if (paciente.etnia === 'Afrodescendente') racaNum = 1.1
      if (paciente.etnia === 'Asiatico') racaNum = -2
      let idade = 25
      if (paciente.data_nascimento) {
        const birthDate = new Date(paciente.data_nascimento + 'T12:00:00')
        const evalDate = new Date(dataAvaliacao + 'T12:00:00')
        idade = evalDate.getFullYear() - birthDate.getFullYear()
        const m = evalDate.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && evalDate.getDate() < birthDate.getDate())) idade--
      }
      calcMuscular = (alturaM * ((0.00744 * termoBraco) + (0.00088 * termoCoxa) + (0.00441 * termoPant))) + (2.4 * sexoNum) - (0.048 * idade) + racaNum + 7.8
    }

    const somatotipo = calcularSomatotipo(payloadBruto)

    const pCintura = resolvedPerimetros.perimetro_cintura || 0
    const pQuadril = resolvedPerimetros.perimetro_quadril || 0
    const calcRcq = pQuadril > 0 ? pCintura / pQuadril : 0
    const calcRce = alturaCm > 0 ? pCintura / alturaCm : 0

    const dSub = resolvedDobras.dobra_cutanea_subescapular || 0
    const dSup = resolvedDobras.dobra_cutanea_supraespinhal || 0
    const dAbd = resolvedDobras.dobra_cutanea_abdominal || 0
    const dBic = resolvedDobras.dobra_cutanea_biceps || 0
    const dIli = resolvedDobras.dobra_cutanea_crista_iliaca || 0
    
    const calcSoma6 = dTri + dSub + dSup + dAbd + dCoxa + dPant
    const calcSoma8 = calcSoma6 + dBic + dIli

    const payloadCalculado = {
      id_paciente: paciente.id,
      id_avaliacao: avaliacaoSalvaId,
      imc: Number(calcImc.toFixed(2)),
      massa_gorda: Number(massaGordaCalc.toFixed(2)),
      massa_magra: Number(massaMagraCalc.toFixed(2)),
      massa_muscular: Number(calcMuscular.toFixed(2)),
      relacao_cintura_quadril: Number(calcRcq.toFixed(2)),
      relacao_cintura_estatura: Number(calcRce.toFixed(2)),
      somatorio_6_dobras: Number(calcSoma6.toFixed(1)),
      somatorio_8_dobras: Number(calcSoma8.toFixed(1)),
      perimetro_corrigido_braco: Number(calcPerimCorrigidoBraco.toFixed(2)),
      perimetro_corrigido_coxa: Number(calcPerimCorrigidoCoxa.toFixed(2)),
      perimetro_corrigido_panturrilha: Number(calcPerimCorrigidoPanturrilha.toFixed(2)),
      ...somatotipo
    }

    const { error: calcError } = await supabase
      .from('dados_calculados')
      .upsert([payloadCalculado], { onConflict: 'id_avaliacao' })

    if (calcError) {
      console.error('Erro ao salvar cálculos:', calcError)
      alert('As medidas foram salvas, mas houve um erro ao gerar o relatório calculado.')
    } else {
      alert('Medidas salvas! Indo para o cálculo de gordura...')
      navigate('/equacoes-de-regressao', { 
        state: { 
          pacienteInicial: paciente,
          avaliacaoIdInicial: avaliacaoSalvaId 
        } 
      })
    }

    setLoading(false)
  }

  const renderMeasureBlock = (title, keys, type, state, setter) => (
    <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-100 shadow-sm space-y-2">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b pb-2">{title}</h3>
      <div className="w-full">
        <div className="hidden md:grid grid-cols-12 gap-2 items-center pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b px-2">
          <div className="col-span-4">Local da Medida</div>
          <div className="col-span-6 grid grid-cols-3 gap-2 text-center">
            <div>{isSingleMode ? 'Valor (Edição/Único)' : '1ª Medida'}</div>
            {!isSingleMode && <div>2ª Medida</div>}
            {!isSingleMode && <div className="text-red-400">3ª (Tira-teima)</div>}
          </div>
          <div className="col-span-2 text-center text-emerald-600">Calculado</div>
        </div>
        {keys.map((key) => (
          <MeasureRow key={key} label={labels[key]} field={key} categoryType={type} state={state} setter={setter} isSingleMode={isSingleMode} handleMeasureChange={handleMeasureChange} />
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4">
        <div>
          <button onClick={() => navigate('/pacientes')} className="text-xs text-emerald-600 font-semibold hover:underline mb-1 inline-block">← Voltar</button>
          <h2 className="text-xl font-bold text-gray-800">
            {avaliacaoIdParaEditar ? `Editando Medidas de ${paciente.nome_completo}` : `Novas Medidas: ${paciente.nome_completo}`}
          </h2>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full">Sexo: {paciente.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-3">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">1. Dados Gerais</h3>
            
            <div className="flex flex-col items-end gap-1">
              <label className="flex items-center space-x-2 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg cursor-pointer">
                <input type="checkbox" checked={isSingleMode} onChange={(e) => setIsSingleMode(e.target.checked)} className="rounded text-red-600 focus:ring-red-500" />
                <span>Habilitar Modo Único / Edição</span>
              </label>
              
              <span className="text-[11px] font-medium text-red-500 text-right max-w-xs">
                ⚠️ Não é aconselhado habilitar o modo único. Utilize apenas para correções pontuais ou dados já consolidados.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Data</label>
              <input type="date" required tabIndex={10} value={dataAvaliacao} onChange={(e) => setDataAvaliacao(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700">Hora</label>
              <input type="time" required tabIndex={11} value={horaAvaliacao} onChange={(e) => setHoraAvaliacao(e.target.value)} className="mt-1 w-full px-3 py-2 border rounded-md text-sm" />
            </div>
          </div>
        </div>

        {renderMeasureBlock('2. Medidas Básicas', basicaKeys, 'basicas', basicas, setBasicas)}
        {renderMeasureBlock('3. Dobras Cutâneas (mm) - Tolerância 5%', dobraKeys, 'dobras', dobras, setDobras)}
        {renderMeasureBlock('4. Perímetros / Circunferências (cm) - Tolerância 1%', perimetroKeys, 'perimetros', perimetros, setPerimetros)}
        {renderMeasureBlock('5. Diâmetros Ósseos (cm) - Tolerância 1%', diametroKeys, 'diametros', diametros, setDiametros)}

        <div className="flex justify-end gap-3 pt-4 sticky bottom-4 bg-white/80 p-4 border-t backdrop-blur-md rounded-xl z-10">
          <button type="button" tabIndex={400} onClick={() => navigate('/pacientes')} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">Cancelar</button>
          <button type="submit" tabIndex={401} disabled={loading} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow disabled:opacity-50">
            {loading ? 'Salvando...' : (avaliacaoIdParaEditar ? 'Atualizar Medidas' : 'Salvar e Escolher Equação')}
          </button>
        </div>
      </form>
    </div>
  )
}