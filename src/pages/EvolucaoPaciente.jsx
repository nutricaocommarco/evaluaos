import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

export default function EvolucaoPaciente() {
  const location = useLocation()
  const navigate = useNavigate()
  const paciente = location.state?.paciente || null

  const [loading, setLoading] = useState(true)
  const [historico, setHistorico] = useState([])
  
  // Cores padronizadas para as bolinhas da Somatocarta e Legendas
  const coresAvaliacoes = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#64748b']

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
          cor: coresAvaliacoes[index % coresAvaliacoes.length],
          
          // Métricas Principais
          peso: Number(aval.peso_paciente || 0).toFixed(1),
          imc: Number(calc.imc || 0).toFixed(2),
          gordura_perc: Number(aval.percentual_de_gordura || 0).toFixed(1),
          massa_gorda: Number(calc.massa_gorda || 0).toFixed(2),
          massa_magra: Number(calc.massa_magra || 0).toFixed(2),
          massa_muscular: Number(calc.massa_muscular || 0).toFixed(2),
          
          // Índices
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
          soma_6: Number(calc.somatorio_6_dobras || 0).toFixed(1),
          soma_8: Number(calc.somatorio_8_dobras || 0).toFixed(1),
          
          // Gráficos Recharts (Precisam ser números puros)
          grafico_peso: Number(aval.peso_paciente || 0),
          grafico_massa_muscular: Number(calc.massa_muscular || 0),
          grafico_massa_gorda: Number(calc.massa_gorda || 0),
          eixo_x: Number(calc.somatocarta_eixo_x || 0),
          eixo_y: Number(calc.somatocarta_eixo_y || 0)
        }
      }).filter(item => item.grafico_peso > 0)

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

  // COMPONENTE: Cartão de Evolução (Altamente Visual)
  const CardEvolucao = ({ titulo, chaveDado, unidade = "", isInverso = false }) => {
    // Só exibe a jornada passo a passo se houver MAIS de 3 avaliações (ou seja, 4+)
    const mostrarStepByStep = historico.length > 3;

    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col hover:border-emerald-200 transition-colors">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-gray-600 font-black text-xs uppercase tracking-wider">{titulo}</h4>
          {unidade && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">{unidade}</span>}
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {historico.map((av, idx) => {
            const valorAtual = Number(av[chaveDado]);
            let deltaUI = null;

            if (mostrarStepByStep && idx > 0) {
              const valorAnterior = Number(historico[idx - 1][chaveDado]);
              const diferenca = (valorAtual - valorAnterior).toFixed(2);
              
              if (diferenca != 0) {
                const isPositivo = diferenca > 0;
                const isBom = isInverso ? !isPositivo : isPositivo;
                const corBadge = isBom ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-red-700 bg-red-50 border-red-100';
                
                deltaUI = (
                  <div className={`flex items-center justify-center px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${corBadge} ml-1`}>
                    {isPositivo ? '↑' : '↓'} {Math.abs(diferenca)}
                  </div>
                );
              } else {
                deltaUI = <div className="text-[9px] text-gray-400 font-bold ml-1 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">(0)</div>;
              }
            }

            return (
              <div key={idx} className="flex items-center shrink-0">
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50/50 border border-gray-50 min-w-[65px]">
                  <span className="text-[9px] font-bold text-gray-400 uppercase mb-1" style={{ color: av.cor }}>{av.nome_avaliacao}</span>
                  <span className="text-sm font-black text-gray-800">{valorAtual.toFixed(2).replace('.00', '')}</span>
                </div>
                {deltaUI}
                {idx < historico.length - 1 && <div className="w-4 h-[1px] bg-gray-200 mx-1"></div>}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12 animate-fade-in-up">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm gap-4">
        <div>
          <button onClick={() => navigate('/pacientes')} className="text-xs text-emerald-600 font-semibold hover:underline mb-1 inline-block">← Voltar aos Pacientes</button>
          <h2 className="text-2xl font-bold text-gray-800">Evolução: {paciente.nome_completo}</h2>
          <p className="text-sm text-gray-500">Comparativo visual de {historico.length} avaliações.</p>
        </div>
      </div>

      {/* BLOCO 1: Composição Corporal */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
          </div>
          <h3 className="text-lg font-black text-gray-800">Composição Corporal</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardEvolucao titulo="Massa Corporal (Peso)" chaveDado="peso" unidade="kg" isInverso={true} />
          <CardEvolucao titulo="Gordura Corporal" chaveDado="gordura_perc" unidade="%" isInverso={true} />
          <CardEvolucao titulo="Massa de Gordura" chaveDado="massa_gorda" unidade="kg" isInverso={true} />
          <CardEvolucao titulo="Massa Muscular" chaveDado="massa_muscular" unidade="kg" isInverso={false} />
          <CardEvolucao titulo="Massa Magra" chaveDado="massa_magra" unidade="kg" isInverso={false} />
          <CardEvolucao titulo="IMC" chaveDado="imc" unidade="kg/m²" isInverso={true} />
        </div>
      </div>

      {/* BLOCO 2: Gráficos Visuais de Composição e Somatotipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Linhas */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-6">Gráfico de Composição (kg)</h3>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="nome_avaliacao" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" name="Peso Total" dataKey="grafico_peso" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" name="Massa Muscular" dataKey="grafico_massa_muscular" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" name="Massa Gorda" dataKey="grafico_massa_gorda" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Somatocarta Customizada (Fiel ao Anexo) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider w-full text-left mb-6">Trajetória do Somatotipo</h3>
          
          <div className="relative w-full max-w-[300px] aspect-square bg-[#f8fafc] rounded-lg border border-gray-200 overflow-hidden mt-2">
            
            {/* Eixos Tracejados Centrais */}
            <div className="absolute inset-y-0 left-1/2 w-px border-l border-dashed border-gray-300"></div>
            <div className="absolute inset-x-0 top-1/2 h-px border-t border-dashed border-gray-300"></div>

            {/* Triângulo SVG Exato */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* O topo (Mesomorfia) fica em x=50, y=10. Endomorfia fica em x=15, y=85. Ectomorfia fica em x=85, y=85 */}
              <polygon points="50,15 15,85 85,85" fill="none" stroke="#94a3b8" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>

            {/* Labels nas Pontas */}
            <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-black text-blue-600">MESOMORFIA</span>
            <span className="absolute bottom-4 left-4 text-[9px] font-black text-orange-600">ENDOMORFIA</span>
            <span className="absolute bottom-4 right-4 text-[9px] font-black text-emerald-600">ECTOMORFIA</span>

            {/* Bolinhas das Avaliações */}
            {historico.map((av, idx) => {
              // Mapeando Eixos Cartesianos Reais (-10 a 10) para Porcentagem na Div (0% a 100%)
              const leftPos = ((av.eixo_x + 10) / 20) * 100;
              const topPos = ((10 - av.eixo_y) / 20) * 100;
              
              // Limitar para não vazar da div
              const safeLeft = Math.max(5, Math.min(95, leftPos));
              const safeTop = Math.max(5, Math.min(95, topPos));

              return (
                <div 
                  key={idx} 
                  className="absolute w-4 h-4 rounded-full -ml-2 -mt-2 shadow-sm border-2 border-white transition-transform hover:scale-125 z-10" 
                  style={{ left: `${safeLeft}%`, top: `${safeTop}%`, backgroundColor: av.cor }}
                  title={`${av.nome_avaliacao} - X(${av.eixo_x}) Y(${av.eixo_y})`}
                />
              )
            })}
          </div>

          {/* Legenda de Cores e Coordenadas */}
          <div className="mt-6 w-full flex flex-wrap justify-center gap-3">
            {historico.map((av, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: av.cor }}></div>
                {av.nome_avaliacao}
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs font-bold text-gray-500 text-center">
            Última Coordenada: X ({historico[historico.length - 1].eixo_x}) | Y ({historico[historico.length - 1].eixo_y})
          </div>
        </div>
      </div>

      {/* BLOCO 3: Dobras Cutâneas e Somatórios */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <h3 className="text-lg font-black text-gray-800">Dobras Cutâneas e Somatórios</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardEvolucao titulo="Somatório 6 Dobras" chaveDado="soma_6" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Somatório 8 Dobras" chaveDado="soma_8" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Tríceps" chaveDado="triceps" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Subescapular" chaveDado="subescapular" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Bíceps" chaveDado="biceps" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Crista Ilíaca" chaveDado="crista_iliaca" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Supraespinhal" chaveDado="supraespinhal" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Abdominal" chaveDado="abdominal" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Coxa Média" chaveDado="coxa" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Panturrilha" chaveDado="panturrilha" unidade="mm" isInverso={true} />
        </div>
      </div>

      {/* BLOCO 4: Relações e Índices de Risco */}
      <div>
        <div className="flex items-center gap-2 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          </div>
          <h3 className="text-lg font-black text-gray-800">Risco Cardiometabólico</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardEvolucao titulo="Circunferência Cintura" chaveDado="cintura" unidade="cm" isInverso={true} />
          <CardEvolucao titulo="Cintura / Estatura" chaveDado="cintura_estatura" isInverso={true} />
          <CardEvolucao titulo="Cintura / Quadril (RCQ)" chaveDado="cintura_quadril" isInverso={true} />
          <CardEvolucao titulo="Área Visceral (apVAT)" chaveDado="apvat" isInverso={true} />
          <CardEvolucao titulo="Índice Adiposo Muscular" chaveDado="iam" isInverso={true} />
          <CardEvolucao titulo="Índice Massa Óssea (IMO)" chaveDado="imo" isInverso={false} />
        </div>
      </div>

    </div>
  )
}