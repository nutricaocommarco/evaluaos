import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'
import BotaoExportarEvolucaoPDF from '../components/BotaoExportarEvolucaoPDF';

export default function EvolucaoPaciente() {
  const location = useLocation()
  const navigate = useNavigate()
  const { tokenUrl } = useParams() // Pega o token se for link público
  const paciente = location.state?.paciente || null

  const isPublicView = !!tokenUrl;
// Usa o paciente do state (se logado) ou null para buscar depois (se for link público)
  const [pacienteLocal, setPacienteLocal] = useState(location.state?.paciente || null)

  const [loading, setLoading] = useState(true)
  const [historico, setHistorico] = useState([])
  const [avaliador, setAvaliador] = useState(null)
  
  // Cores padronizadas para as bolinhas da Somatocarta e Legendas
  const coresAvaliacoes = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6', '#64748b']

useEffect(() => {
    async function carregarDados() {
      let pacienteAtual = pacienteLocal;

      // 1. Se for link público, busca o Paciente pelo token na tabela 'pacientes'
      if (tokenUrl) {
        const { data: pacData } = await supabase
          .from('pacientes')
          .select('*')
          .eq('token_publico', tokenUrl)
          .single();

        if (pacData) {
          pacienteAtual = pacData;
          setPacienteLocal(pacData);
        } else {
          setLoading(false);
          return;
        }
      }

      if (!pacienteAtual) return;

      // 2. Busca do Avaliador (Dinâmico)
      let avaliadorIdBuscado = pacienteAtual.id_avaliador;

      if (!avaliadorIdBuscado && !isPublicView) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user?.email) {
          const { data: avaliadorEmail } = await supabase
            .from('avaliadores')
            .select('id')
            .eq('email', authData.user.email)
            .maybeSingle();
          if (avaliadorEmail) avaliadorIdBuscado = avaliadorEmail.id;
        }
      }

      if (avaliadorIdBuscado) {
        const { data: avaliadorData } = await supabase
          .from('avaliadores')
          .select('nome_completo, instagram, empresa, logomarca_url')
          .eq('id', avaliadorIdBuscado)
          .maybeSingle();
        if (avaliadorData) setAvaliador(avaliadorData);
      }

      // 3. Busca Avaliações (Usando o ID do pacienteAtual)
      const { data: avaliacoes, error: errAvaliacoes } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('id_paciente', pacienteAtual.id)
        .order('data_avaliacao', { ascending: true })

      if (errAvaliacoes) {
        console.error(errAvaliacoes)
        setLoading(false)
        return
      }

      // 4. Busca Cálculos
      const { data: calculos, error: errCalc } = await supabase
        .from('dados_calculados')
        .select('*')
        .eq('id_paciente', pacienteAtual.id)

      if (errCalc) console.error(errCalc)

      // 5. Mescla e Formata os Dados
      const dadosMesclados = avaliacoes.map((aval, index) => {
        const calc = calculos?.find(c => c.id_avaliacao === aval.id) || {}
        
        return {
          id: aval.id,
          nome_avaliacao: `Av. ${index + 1}`,
          // ADICIONADO: Data formatada reduzida (ex: 20/07/2026) para mostrar no Step-by-Step
          dataStr_curta: new Date(aval.data_avaliacao).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }),
          dataStr: new Date(aval.data_avaliacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
          cor: coresAvaliacoes[index % coresAvaliacoes.length],
          token_publico: aval.token_publico, // Necessário para o Link do ZAP
          
          // Métricas Principais
          estatura: Number(aval.altura_paciente || 0),
          peso: Number(aval.peso_paciente || 0).toFixed(1),
          imc: Number(calc.imc || 0).toFixed(2),
          gordura_perc: Number(aval.percentual_de_gordura || 0).toFixed(1),
          massa_gorda: Number(calc.massa_gorda || 0).toFixed(2),
          massa_magra: Number(calc.massa_magra || 0).toFixed(2),
          massa_muscular: Number(calc.massa_muscular || 0).toFixed(2),
          
          // Perímetros / Circunferências
          braco_rel: Number(aval.perimetro_braco_relaxado || 0).toFixed(1),
          braco_cont: Number(aval.perimetro_braco_contraido || 0).toFixed(1),
          antibraco: Number(aval.perimetro_antibraco || 0).toFixed(1),
          cintura: Number(aval.perimetro_cintura || 0).toFixed(1),
          perim_abdominal: Number(aval.perimetro_abdominal || 0).toFixed(1),
          quadril: Number(aval.perimetro_quadril || 0).toFixed(1),
          coxa_max: Number(aval.perimetro_coxa_maxima || 0).toFixed(1),
          coxa_med: Number(aval.perimetro_coxa_media || 0).toFixed(1),
          perim_panturrilha: Number(aval.perimetro_panturrilha || 0).toFixed(1),

          // Índices de Risco
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
          
          // Somatórios
          soma_6: Number(calc.somatorio_6_dobras || 0).toFixed(1),
          soma_8: Number(calc.somatorio_8_dobras || 0).toFixed(1),
          
          // Somatotipo Individual
          endo: Number(calc.somatotipo_endomorfia || 0).toFixed(1),
          meso: Number(calc.somatotipo_mesomorfia || 0).toFixed(1),
          ecto: Number(calc.somatotipo_ectomorfia || 0).toFixed(1),

          // Gráficos Recharts
          grafico_peso: Number(aval.peso_paciente || 0),
          grafico_gordura: Number(aval.percentual_de_gordura || 0),
          grafico_massa_muscular: Number(calc.massa_muscular || 0),
          grafico_massa_gorda: Number(calc.massa_gorda || 0),
          eixo_x: Number(calc.somatocarta_eixo_x || 0),
          eixo_y: Number(calc.somatocarta_eixo_y || 0)
        }
      }).filter(item => item.grafico_peso > 0)

      setHistorico(dadosMesclados)
      setLoading(false)
    }

    carregarDados()
  }, [paciente])

if (!pacienteLocal) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 p-8">
        <h2 className="text-xl font-bold text-gray-800">Nenhum paciente selecionado ou Link Inválido</h2>
        {!isPublicView && <button onClick={() => navigate('/pacientes')} className="px-6 py-2 bg-emerald-600 text-white rounded-lg">Ir para Pacientes</button>}
      </div>
    )
  }

  if (loading) return <div className="p-8 text-center text-emerald-600 font-bold">Processando evolução...</div>

  if (historico.length < 2) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center space-y-6">
        <div className="bg-white p-8 rounded-xl shadow border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Evolução Incompleta</h2>
          <p className="text-gray-500">O paciente possui apenas {historico.length} avaliação registrada. São necessárias pelo menos 2 avaliações no sistema para gerar o comparativo temporal.</p>
          {!isPublicView && <button onClick={() => navigate('/pacientes')} className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700">Voltar</button>}
        </div>
      </div>
    )
  }

  // Cálculos Demográficos
  let idade = '-'
  if (pacienteLocal.data_nascimento) {
    const birthDate = new Date(pacienteLocal.data_nascimento + 'T12:00:00')
    const evalDate = new Date()
    idade = evalDate.getFullYear() - birthDate.getFullYear()
    const m = evalDate.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && evalDate.getDate() < birthDate.getDate())) idade--
  }
  const ultimaEstatura = historico[historico.length - 1].estatura

        const handleWhatsApp = () => {
    const telefoneLimpo = pacienteLocal?.telefone ? pacienteLocal.telefone.replace(/\D/g, '') : '';
    if (!telefoneLimpo) {
      alert('Este paciente não possui telefone cadastrado.');
      return;
    }
    const primeiroNome = pacienteLocal?.nome_completo ? pacienteLocal.nome_completo.split(' ')[0] : 'Paciente';
    const saudacao = avaliador?.nome_completo ? avaliador.nome_completo : 'seu Avaliador';
    
    // Pega o token_publico diretamente do paciente (para abrir a página com o menu e logo do EvaluaOS)
    const tokenPublico = pacienteLocal?.token_publico;
    const linkDaEvolucao = tokenPublico 
        ? `${window.location.origin}/evolucao/${tokenPublico}`
        : window.location.origin;

    const msg = `Olá *${primeiroNome}*, tudo bem?\n\nAqui é ${saudacao}! Acabei de atualizar a sua *Evolução Antropométrica* com os dados da nossa última consulta.\n\nAcesse o link abaixo para visualizar seus resultados interativos e acompanhar sua evolução:\n\n${linkDaEvolucao}\n\nQualquer dúvida, estou à disposição!`;
    const link = `https://wa.me/${telefoneLimpo.startsWith('55') ? telefoneLimpo : '55' + telefoneLimpo}?text=${encodeURIComponent(msg)}`;
    window.open(link, '_blank');
  }

  // COMPONENTE: Cartão de Evolução Step-by-Step
  const CardEvolucao = ({ titulo, chaveDado, unidade = "", isInverso = false }) => {
    const totalAvaliacoes = historico.length;
    const primeiraAv = Number(historico[0][chaveDado]);
    const ultimaAv = Number(historico[totalAvaliacoes - 1][chaveDado]);
    const deltaTotal = (ultimaAv - primeiraAv).toFixed(1);

    const renderBadge = (diferenca, extraClasses = "") => {
      if (Number(diferenca) === 0) return <div className={`text-[9px] text-gray-400 font-bold ml-1 bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100 ${extraClasses}`}>(0)</div>;
      const isPositivo = diferenca > 0;
      const isBom = isInverso ? !isPositivo : isPositivo;
      const corBadge = isBom ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-red-700 bg-red-50 border-red-100';
      return (
        <div className={`flex items-center justify-center px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${corBadge} ml-1 ${extraClasses}`}>
          {isPositivo ? '↑' : '↓'} {Math.abs(diferenca).toFixed(1)}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col hover:border-emerald-200 transition-colors break-inside-avoid">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-gray-600 font-black text-xs uppercase tracking-wider">{titulo}</h4>
            {unidade && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold mt-1 inline-block">{unidade}</span>}
          </div>
          {totalAvaliacoes >= 3 && (
            <div className="flex flex-col items-end">
              <span className="text-[8px] uppercase text-gray-400 font-bold mb-0.5">Delta Total</span>
              {renderBadge(deltaTotal)}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {historico.map((av, idx) => {
            const valorAtual = Number(av[chaveDado]);
            let deltaUI = null;
            if (idx > 0) {
              const valorAnterior = Number(historico[idx - 1][chaveDado]);
              const diferenca = (valorAtual - valorAnterior);
              deltaUI = renderBadge(diferenca);
            }
            return (
              <div key={idx} className="flex items-center shrink-0">
                <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50/50 border border-gray-50 min-w-[70px]">
                  <div className="flex flex-col items-center mb-1">
                      <span className="text-[9px] font-bold uppercase" style={{ color: av.cor }}>{av.nome_avaliacao}</span>
                      <span className="text-[8px] text-gray-400 font-medium">{av.dataStr_curta}</span>
                  </div>
                  <span className="text-sm font-black text-gray-800">{valorAtual.toFixed(1)}</span>
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

  // COMPONENTE: Barras de Somatotipo Individuais (Evolução Completa)
  const BarChartSomatotipo = () => {
    const maxVal = 12; // Valor base máximo para a proporção das barras
    
    // Função para renderizar o bloco de cada componente
    const renderBlocoBarras = (titulo, chaveDado, corBarra) => (
      <div className="flex flex-col gap-3 mb-6 last:mb-0">
        <h5 className="text-xs font-bold" style={{ color: corBarra }}>{titulo}</h5>
        <div className="space-y-2">
          {historico.map((av, idx) => {
            const val = Number(av[chaveDado]);
            const pct = Math.min((val / maxVal) * 100, 100);
            
            return (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-8 text-[10px] font-bold text-right" style={{ color: av.cor }}>{av.nome_avaliacao}</span>
                
                <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden flex items-center">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: corBarra }}></div>
                </div>
                
                <span className="w-6 text-right text-xs font-black text-gray-800">{val.toFixed(1)}</span>
              </div>
            )
          })}
        </div>
      </div>
    )

    return (
      <div className="flex flex-col w-full mt-2">
        {renderBlocoBarras('Endomorfia (Adiposidade)', 'endo', '#f97316')}
        {renderBlocoBarras('Mesomorfia (Musculosidade)', 'meso', '#3b82f6')}
        {renderBlocoBarras('Ectomorfia (Magreza / Linearidade)', 'ecto', '#10b981')}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12 animate-fade-in-up print:m-0 print:p-0">
      
      {/* CSS para Imprimir em PDF */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: #fff !important; }
          .shadow-sm { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
          .break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

{/* --- CABEÇALHO PROFISSIONAL COM BOTÃO NOVO --- */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-6">
        
        {/* Topo: Avaliador, Logo e Botões */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 gap-4">
          <div className="flex items-center gap-4">
            {avaliador?.logomarca_url ? (
              <img src={avaliador.logomarca_url} alt="Logo" className="w-14 h-14 rounded-full object-cover border border-gray-200 bg-white" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-black text-xl">
                {avaliador?.nome_completo ? avaliador.nome_completo.charAt(0) : 'A'}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">{avaliador?.empresa || 'Consultório'}</span>
              <span className="text-xs text-gray-500">Avaliador(a): <span className="font-bold text-gray-700">{avaliador?.nome_completo || '-'}</span></span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Esconde botão de voltar se for link público */}
            {!isPublicView && (
              <button onClick={() => navigate('/pacientes')} className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50">
                Voltar
              </button>
            )}

        {/* Dados Demográficos do Paciente */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Evolução Antropométrica de</h2>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{paciente.nome_completo}</h2>
          
          <div className="flex flex-wrap gap-x-8 gap-y-4 mt-5 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Idade</span>
              <span className="text-sm font-black text-gray-700">{idade} anos</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sexo</span>
              <span className="text-sm font-black text-gray-700">{paciente.sexo === 'M' ? 'Masculino' : 'Feminino'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Estatura</span>
              <span className="text-sm font-black text-gray-700">{ultimaEstatura > 0 ? `${ultimaEstatura} cm` : '-'}</span>
            </div>
            {paciente.ocupacao && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ocupação</span>
                <span className="text-sm font-black text-gray-700">{paciente.ocupacao}</span>
              </div>
            )}
            {paciente.etnia && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Etnia</span>
                <span className="text-sm font-black text-gray-700">{paciente.etnia}</span>
              </div>
            )}
            {paciente.nacionalidade && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nacionalidade</span>
                <span className="text-sm font-black text-gray-700">{paciente.nacionalidade}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BLOCO 1: Composição Corporal Cards */}
      <div className="break-inside-avoid">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 break-inside-avoid">
        
        {/* Gráfico 1: Peso, Músculo e Gordura em KG */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-6">Composição (kg)</h3>
          <div className="flex-1 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="nome_avaliacao" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" name="Peso Total" dataKey="grafico_peso" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" name="M. Muscular" dataKey="grafico_massa_muscular" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" name="M. Gorda" dataKey="grafico_massa_gorda" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Exclusivo % de Gordura */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-6">Evolução % de Gordura</h3>
          <div className="flex-1 w-full min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historico} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="nome_avaliacao" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [`${value}%`, '% Gordura']} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" name="% Gordura" dataKey="grafico_gordura" stroke="#ef4444" strokeWidth={4} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 3: Somatocarta (MAIOR) */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-between">
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider w-full text-left mb-4">Trajetória do Somatotipo</h3>
          
          <div className="relative w-full max-w-[320px] aspect-square bg-[#f8fafc] rounded-lg border border-gray-200 overflow-hidden mt-2">
            <div className="absolute inset-y-0 left-1/2 w-px border-l border-dashed border-gray-300"></div>
            <div className="absolute inset-x-0 top-1/2 h-px border-t border-dashed border-gray-300"></div>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon points="50,15 15,85 85,85" fill="none" stroke="#94a3b8" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-black text-blue-600">MESOMORFIA</span>
            <span className="absolute bottom-4 left-4 text-[9px] font-black text-orange-600">ENDOMORFIA</span>
            <span className="absolute bottom-4 right-4 text-[9px] font-black text-emerald-600">ECTOMORFIA</span>

            {historico.map((av, idx) => {
              const leftPos = ((av.eixo_x + 10) / 20) * 100;
              const topPos = ((10 - av.eixo_y) / 20) * 100;
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

          <div className="mt-4 w-full flex flex-wrap justify-center gap-2">
            {historico.map((av, idx) => (
              <div key={idx} className="flex items-center gap-1 text-[10px] text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded border border-gray-100">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: av.cor }}></div>
                {av.nome_avaliacao}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Gráfico de Barras do Somatotipo Individual */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col break-inside-avoid">
        <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider w-full text-left mb-6">Evolução dos Componentes do Somatotipo</h3>
        <div className="flex flex-col w-full mt-2">
          {['Endomorfia (Adiposidade)', 'Mesomorfia (Musculosidade)', 'Ectomorfia (Magreza / Linearidade)'].map((titulo, idx) => {
            const chaves = ['endo', 'meso', 'ecto'];
            const cores = ['#f97316', '#3b82f6', '#10b981'];
            const chaveDado = chaves[idx];
            const corBarra = cores[idx];
            const maxVal = 12;

            return (
              <div key={idx} className="flex flex-col gap-3 mb-6 last:mb-0">
                <h5 className="text-xs font-bold" style={{ color: corBarra }}>{titulo}</h5>
                <div className="space-y-2">
                  {historico.map((av, index) => {
                    const val = Number(av[chaveDado]);
                    const pct = Math.min((val / maxVal) * 100, 100);
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <span className="w-8 text-[10px] font-bold text-right" style={{ color: av.cor }}>{av.nome_avaliacao}</span>
                        <div className="flex-1 bg-gray-100 h-3 rounded-full overflow-hidden flex items-center">
                          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: corBarra }}></div>
                        </div>
                        <span className="w-6 text-right text-xs font-black text-gray-800">{val.toFixed(1)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* BLOCO 3: Circunferências / Perímetros */}
      <div className="break-inside-avoid">
        <div className="flex items-center gap-2 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path><path d="M2 12h20"></path></svg>
          </div>
          <h3 className="text-lg font-black text-gray-800">Circunferências (Perímetros)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardEvolucao titulo="Braço Relaxado" chaveDado="braco_rel" unidade="cm" isInverso={false} />
          <CardEvolucao titulo="Braço Contraído" chaveDado="braco_cont" unidade="cm" isInverso={false} />
          <CardEvolucao titulo="Antebraço" chaveDado="antibraco" unidade="cm" isInverso={false} />
          <CardEvolucao titulo="Cintura" chaveDado="cintura" unidade="cm" isInverso={true} />
          <CardEvolucao titulo="Abdominal" chaveDado="perim_abdominal" unidade="cm" isInverso={true} />
          <CardEvolucao titulo="Quadril" chaveDado="quadril" unidade="cm" isInverso={true} />
          <CardEvolucao titulo="Coxa Máxima" chaveDado="coxa_max" unidade="cm" isInverso={false} />
          <CardEvolucao titulo="Coxa Média" chaveDado="coxa_med" unidade="cm" isInverso={false} />
          <CardEvolucao titulo="Panturrilha" chaveDado="perim_panturrilha" unidade="cm" isInverso={false} />
        </div>
      </div>

      {/* BLOCO 4: Dobras Cutâneas e Somatórios */}
      <div className="break-inside-avoid">
        <div className="flex items-center gap-2 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <h3 className="text-lg font-black text-gray-800">Dobras Cutâneas e Somatórios</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <CardEvolucao titulo="Tríceps" chaveDado="triceps" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Subescapular" chaveDado="subescapular" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Bíceps" chaveDado="biceps" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Crista Ilíaca" chaveDado="crista_iliaca" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Supraespinhal" chaveDado="supraespinhal" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Abdominal" chaveDado="abdominal" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Coxa Média" chaveDado="coxa" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Panturrilha" chaveDado="panturrilha" unidade="mm" isInverso={true} />
        </div>

        <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-gray-200 flex-1"></div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Somatórios Gerais</span>
          <div className="h-px bg-gray-200 flex-1"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardEvolucao titulo="Somatório 6 Dobras" chaveDado="soma_6" unidade="mm" isInverso={true} />
          <CardEvolucao titulo="Somatório 8 Dobras" chaveDado="soma_8" unidade="mm" isInverso={true} />
        </div>
      </div>

      {/* BLOCO 5: Relações e Índices de Risco */}
      <div className="break-inside-avoid">
        <div className="flex items-center gap-2 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          </div>
          <h3 className="text-lg font-black text-gray-800">Risco Cardiometabólico e Índices</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardEvolucao titulo="Cintura / Estatura" chaveDado="cintura_estatura" isInverso={true} />
          <CardEvolucao titulo="Cintura / Quadril (RCQ)" chaveDado="cintura_quadril" isInverso={true} />
          <CardEvolucao titulo="Área Visceral (apVAT)" chaveDado="apvat" isInverso={true} />
          <CardEvolucao titulo="Índice Adiposo Muscular" chaveDado="iam" isInverso={true} />
          <CardEvolucao titulo="Índice Massa Óssea (IMO)" chaveDado="imo" isInverso={false} />
        </div>
      </div>
           
          <div className="flex justify-end gap-2 w-full mt-6 no-print">
           {/* Esconde WhatsApp se for link público. Exige telefone cadastrado. */}
            {!isPublicView && pacienteLocal?.telefone && (
              <button onClick={handleWhatsApp} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-colors w-full md:w-auto">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
                ZAP
              </button>
            )}

            {/* O PDF fica visível para todos através do seu componente */}
            <BotaoExportarEvolucaoPDF 
                historico={historico} 
                paciente={pacienteLocal} 
                avaliador={avaliador} 
                idade={idade}
                isPublicView={isPublicView}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
