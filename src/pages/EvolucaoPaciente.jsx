import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceDot
} from 'recharts'

export default function EvolucaoPaciente() {
  const location = useLocation()
  const navigate = useNavigate()
  const paciente = location.state?.paciente || null

  const [loading, setLoading] = useState(true)
  const [historico, setHistorico] = useState([])
  
  useEffect(() => {
    async function carregarHistorico() {
      if (!paciente) return

      const { data: avaliacoes, error: errAval } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('id_paciente', paciente.id)
        .order('data_avaliacao', { ascending: true })

      if (errAval) {
        console.error(errAval)
        setLoading(false)
        return
      }

      const { data: calculos, error: errCalc } = await supabase
        .from('dados_calculados')
        .select('*')
        .eq('id_paciente', paciente.id)

      if (errCalc) console.error(errCalc)

      const dadosMesclados = avaliacoes.map((aval, index) => {
        const calc = calculos?.find(c => c.id_avaliacao === aval.id) || {}
        
        return {
          id: aval.id,
          nome_avaliacao: `Av. ${index + 1}`,
          dataStr: new Date(aval.data_avaliacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
          
          // Métricas Principais
          peso: Number(aval.peso_paciente || 0).toFixed(1),
          imc: Number(calc.imc || 0).toFixed(2),
          gordura_perc: Number(aval.percentual_de_gordura || 0).toFixed(1),
          massa_gorda: Number(calc.massa_gorda || 0).toFixed(2),
          massa_magra: Number(calc.massa_magra || 0).toFixed(2),
          massa_muscular: Number(calc.massa_muscular || 0).toFixed(2),
          
          // Índices e Risco
          cintura: Number(aval.perimetro_cintura || 0).toFixed(1),
          cintura_estatura: Number(calc.relacao_cintura_estatura || 0).toFixed(2),
          cintura_quadril: Number(calc.relacao_cintura_quadril || 0).toFixed(2),
          imo: Number(calc.indice_massa_ossea_imo || 0).toFixed(2),
          apvat: Number(calc.area_previsao_visceral_apvat || 0).toFixed(2),
          iam: Number(calc.indice_adiposo_muscular || 0).toFixed(2),
          
          // Dobras Cutâneas
          triceps: Number(aval.dobra_cutanea_triceps || 0).toFixed(1),
          subescapular: Number(aval.dobra_cutanea_subescapular || 0).toFixed(1),
          biceps: Number(aval.dobra_cutanea_biceps || 0).toFixed(1),
          crista_iliaca: Number(aval.dobra_cutanea_crista_iliaca || 0).toFixed(1),
          supraespinhal: Number(aval.dobra_cutanea_supraespinhal || 0).toFixed(1),
          abdominal: Number(aval.dobra_cutanea_abdominal || 0).toFixed(1),
          coxa: Number(aval.dobra_cutanea_coxa_media || 0).toFixed(1),
          panturrilha: Number(aval.dobra_cutanea_panturrilha || 0).toFixed(1),
          
          // Gráficos Recharts (Precisam ser números puros, sem toFixed)
          grafico_massa_muscular: Number(calc.massa_muscular || 0),
          grafico_massa_gorda: Number(calc.massa_gorda || 0),
          grafico_soma_6: Number(calc.somatorio_6_dobras || 0),
          grafico_soma_8: Number(calc.somatorio_8_dobras || 0),
          eixo_x: Number(calc.somatocarta_eixo_x || 0),
          eixo_y: Number(calc.somatocarta_eixo_y || 0)
        }
      }).filter(item => item.peso > 0)

      setHistorico(dadosMesclados)
      setLoading(false)
    }

    carregarHistorico()
  }, [paciente])

  if (!paciente) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
        <h2 className="text-xl font-bold text-gray-800">Nenhum paciente selecionado</h2>
        <button onClick={() => navigate('/pacientes')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg">Ir para Pacientes</button>
      </div>
    )
  }

  if (loading) return <div className="p-8 text-center text-emerald-600 font-bold">Processando dados longitudinais...</div>

  if (historico.length < 2) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-6">
        <div className="bg-white p-8 rounded-xl shadow border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Evolução Incompleta</h2>
          <p className="text-gray-500">O paciente <strong>{paciente.nome_completo}</strong> possui apenas {historico.length} avaliação registrada. São necessárias pelo menos 2 avaliações no sistema para gerar o comparativo temporal.</p>
          <button onClick={() => navigate('/pacientes')} className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700">Voltar</button>
        </div>
      </div>
    )
  }

  // Função para calcular diferença e formatar visualmente
  const renderDelta = (chave, isInverso = false) => {
    const primeira = Number(historico[0][chave])
    const ultima = Number(historico[historico.length - 1][chave])
    const delta = (ultima - primeira).toFixed(2)
    
    if (delta == 0) return <span className="text-gray-400 text-xs font-bold bg-gray-100 px-2 py-1 rounded">(0)</span>
    
    const isPositivo = delta > 0
    // Se isInverso for true (ex: Gordura), cair é verde. Se false (ex: Músculo), subir é verde.
    const isBom = isInverso ? !isPositivo : isPositivo
    const cor = isBom ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
    const seta = isPositivo ? '↑' : '↓'

    return (
      <span className={`${cor} text-xs font-bold px-2 py-1 rounded flex items-center gap-1`}>
        {seta} {isPositivo ? '+' : ''}{delta}
      </span>
    )
  }

  // Componente reutilizável para cada linha de métrica
  const LinhaMetrica = ({ titulo, chaveDado, unidade, isInverso }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-3 hover:bg-gray-50 border-b border-gray-50 transition-colors">
      <div className="w-full md:w-1/3 mb-2 md:mb-0">
        <span className="text-sm font-semibold text-gray-700">{titulo}</span>
        {unidade && <span className="text-xs text-gray-400 ml-1">({unidade})</span>}
      </div>
      
      <div className="flex flex-1 items-center justify-between gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
        {historico.map((av, idx) => (
          <div key={idx} className="flex flex-col items-center min-w-[60px]">
            <span className="text-[10px] text-gray-400 mb-1">{av.nome_avaliacao}</span>
            <span className="text-sm font-medium text-gray-800">{av[chaveDado]}</span>
          </div>
        ))}
      </div>
      
      <div className="w-full md:w-24 mt-2 md:mt-0 flex md:justify-end items-center border-t md:border-t-0 pt-2 md:pt-0 border-gray-100">
        {renderDelta(chaveDado, isInverso)}
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-fade-in-up">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm gap-4">
        <div>
          <button onClick={() => navigate('/pacientes')} className="text-xs text-emerald-600 font-semibold hover:underline mb-1 inline-block">← Voltar aos Pacientes</button>
          <h2 className="text-2xl font-bold text-gray-800">Evolução: {paciente.nome_completo}</h2>
          <p className="text-sm text-gray-500">Comparativo histórico de {historico.length} avaliações.</p>
        </div>
        <button className="px-5 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 transition-colors flex items-center gap-2 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          Exportar PDF Completo
        </button>
      </div>

      {/* BLOCO 1: DETALHAMENTO COMPLETO (Substitui as Cards) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Seção: Composição Corporal */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Composição Corporal</h3>
        </div>
        <div className="px-3">
          <LinhaMetrica titulo="Massa Corporal" chaveDado="peso" unidade="kg" isInverso={true} />
          <LinhaMetrica titulo="IMC" chaveDado="imc" unidade="kg/m²" isInverso={true} />
          <LinhaMetrica titulo="Gordura" chaveDado="gordura_perc" unidade="%" isInverso={true} />
          <LinhaMetrica titulo="Massa de Gordura" chaveDado="massa_gorda" unidade="kg" isInverso={true} />
          <LinhaMetrica titulo="Massa Magra" chaveDado="massa_magra" unidade="kg" isInverso={false} />
          <LinhaMetrica titulo="Massa Muscular" chaveDado="massa_muscular" unidade="kg" isInverso={false} />
        </div>

        {/* Seção: Índices e Risco */}
        <div className="bg-gray-50 px-6 py-3 border-y border-gray-100 mt-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Relações e Índices</h3>
        </div>
        <div className="px-3">
          <LinhaMetrica titulo="Cintura" chaveDado="cintura" unidade="cm" isInverso={true} />
          <LinhaMetrica titulo="Cintura / Estatura" chaveDado="cintura_estatura" isInverso={true} />
          <LinhaMetrica titulo="Cintura / Quadril" chaveDado="cintura_quadril" isInverso={true} />
          <LinhaMetrica titulo="Índice de Massa Óssea (IMO)" chaveDado="imo" isInverso={false} />
          <LinhaMetrica titulo="Área Visceral (apVAT)" chaveDado="apvat" isInverso={true} />
          <LinhaMetrica titulo="Índice Adiposo Muscular" chaveDado="iam" isInverso={true} />
        </div>

        {/* Seção: Dobras Cutâneas */}
        <div className="bg-gray-50 px-6 py-3 border-y border-gray-100 mt-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dobras Cutâneas (mm)</h3>
        </div>
        <div className="px-3 pb-2">
          <LinhaMetrica titulo="Tríceps" chaveDado="triceps" isInverso={true} />
          <LinhaMetrica titulo="Subescapular" chaveDado="subescapular" isInverso={true} />
          <LinhaMetrica titulo="Bíceps" chaveDado="biceps" isInverso={true} />
          <LinhaMetrica titulo="Crista Ilíaca" chaveDado="crista_iliaca" isInverso={true} />
          <LinhaMetrica titulo="Supraespinhal" chaveDado="supraespinhal" isInverso={true} />
          <LinhaMetrica titulo="Abdominal" chaveDado="abdominal" isInverso={true} />
          <LinhaMetrica titulo="Coxa Média" chaveDado="coxa" isInverso={true} />
          <LinhaMetrica titulo="Panturrilha" chaveDado="panturrilha" isInverso={true} />
        </div>
      </div>

      {/* BLOCO 2: Gráficos Visuais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-6">Composição Corporal (kg)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="nome_avaliacao" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" name="Massa Muscular" dataKey="grafico_massa_muscular" stroke="#059669" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Massa Gorda" dataKey="grafico_massa_gorda" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">Trajetória do Somatotipo</h3>
          <div className="h-72 w-full relative mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" dataKey="eixo_x" name="Ecto-Endo" domain={[-8, 8]} tick={{fontSize: 12}} />
                <YAxis type="number" dataKey="eixo_y" name="Meso" domain={[-8, 8]} tick={{fontSize: 12}} />
                <ZAxis type="category" dataKey="nome_avaliacao" name="Etapa" />
                <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ borderRadius: '8px' }} />
                <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={2} />
                <ReferenceLine x={0} stroke="#9ca3af" strokeWidth={2} />
                <Scatter name="Evolução" data={historico} fill="#059669" line={{stroke: '#10b981', strokeWidth: 2}} shape="circle" />
                {historico.length > 0 && (
                  <ReferenceDot x={historico[historico.length - 1].eixo_x} y={historico[historico.length - 1].eixo_y} r={6} fill="#ef4444" stroke="#fff" strokeWidth={2} />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}