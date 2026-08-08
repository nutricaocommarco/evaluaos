import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { TrendingDown, Dumbbell } from 'lucide-react';

import CalculadoraGET from '../components/calculadoras/CalculadoraGET';
import BodyWP from '../components/calculadoras/BodyWP';
import Hipertrofia from '../components/calculadoras/Hipertrofia';

export default function CalculadoraGastoCalorico() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // ESTADOS DO SUPABASE E PACIENTE
  const [busca, setBusca] = useState('');
  const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [historicoAvaliacoes, setHistoricoAvaliacoes] = useState([]);
  const [avaliacaoAtual, setAvaliacaoAtual] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // ESTADOS DA CALCULADORA
  const [formData, setFormData] = useState({
    gender: 'M', age: '', weight: '', height: '', bf: '',
    calculationMode: 'auto', manualFormula: 'mifflin', bodyType: 'average',
    activityCalcMethod: 'auto', routine: 'sedentary', exerciseCardio: 'none', exerciseStrength: 'none',
    manualFA: '1.55',
    metActivities: [{ id: 1, met: '0', minutes: '' }, { id: 2, met: '0', minutes: '' }, { id: 3, met: '0', minutes: '' }, { id: 4, met: '0', minutes: '' }]
  });
  const [results, setResults] = useState(null);

  // HUB E ABAS
  const [objetivoPlano, setObjetivoPlano] = useState('emagrecimento'); // 'emagrecimento' | 'hipertrofia'

  // ESTADOS DO PLANNER DE EMAGRECIMENTO (BODY WP)
  const [plannerData, setPlannerData] = useState({ 
    simulationMode: 'target_weight', targetWeight: '', targetBF: '', targetFatLoss: '', targetCalories: '', timeframeDays: 180 
  });
  const [plannerResults, setPlannerResults] = useState(null);
  const [advancedControls, setAdvancedControls] = useState({ enabled: false, rmrOverride: '' });

  // ESTADOS DO PLANNER DE HIPERTROFIA
  const [nivelTreino, setNivelTreino] = useState('intermediario');
  const [hipertrofiaResultados, setHipertrofiaResultados] = useState(null);

  useEffect(() => {
    const buscarPacientes = async () => {
      if (busca.length < 1) { setPacientesFiltrados([]); return; }
      const { data, error } = await supabase.from('pacientes').select('id, nome_completo, sexo, data_nascimento').ilike('nome_completo', `%${busca}%`).limit(5);
      if (!error && data) setPacientesFiltrados(data);
    };
    const delayDebounce = setTimeout(() => buscarPacientes(), 300);
    return () => clearTimeout(delayDebounce);
  }, [busca]);

  useEffect(() => {
    const handleClickFora = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const selecionarPacienteBusca = async (paciente) => {
    setPacienteSelecionado(paciente);
    setBusca(paciente.nome_completo);
    setShowDropdown(false);
    setResults(null);
    setPlannerResults(null);
    setHipertrofiaResultados(null);

    const { data: historico } = await supabase.from('avaliacoes').select('id, data_avaliacao, peso_paciente').eq('id_paciente', paciente.id).order('data_avaliacao', { ascending: false });

    if (historico && historico.length > 0) {
      setHistoricoAvaliacoes(historico);
      selecionarAvaliacaoDoHistorico(historico[0].id, paciente);
    } else {
      setHistoricoAvaliacoes([]); setAvaliacaoAtual(null);
      alert('Este paciente ainda não possui avaliações cadastradas.');
    }
  };

  const selecionarAvaliacaoDoHistorico = async (idAvaliacao, pacienteOverride) => {
    const pac = pacienteOverride || pacienteSelecionado;
    const { data: aval } = await supabase.from('avaliacoes').select('*').eq('id', idAvaliacao).single();
    const { data: calc } = await supabase.from('dados_calculados').select('*').eq('id_avaliacao', idAvaliacao).maybeSingle();

    if (aval) {
      setAvaliacaoAtual(aval);
      let idade = 25;
      if (pac.data_nascimento) {
        const birthDate = new Date(pac.data_nascimento + 'T12:00:00');
        const evalDate = new Date((aval.data_avaliacao || '') + 'T12:00:00');
        idade = evalDate.getFullYear() - birthDate.getFullYear();
        const m = evalDate.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && evalDate.getDate() < birthDate.getDate())) idade--;
      }

      let bfSalvo = aval.percentual_de_gordura || '';
      if (!bfSalvo && calc && calc.massa_gorda && aval.peso_paciente) {
        bfSalvo = ((calc.massa_gorda / aval.peso_paciente) * 100).toFixed(1);
      }

      setFormData(prev => ({
        ...prev, gender: pac.sexo || 'M', age: idade, weight: aval.peso_paciente || '', height: aval.altura_paciente || '', bf: bfSalvo
      }));
    }
  };

  const handleSalvarNoBanco = async () => {
    if (!avaliacaoAtual) return alert('Nenhuma avaliação selecionada.');
    if (!results) return alert('Por favor, calcule os resultados primeiro.');

    setSalvando(true);

    let payload = {
      taxa_metabolica_basal: results.bmr,
      gasto_energetico_total: results.tdee,
      fator_atividade: Number(results.activityFactor),
      equacao_metabolica: results.formulaUsed,
    };

    if (objetivoPlano === 'emagrecimento' && plannerResults) {
      payload = {
        ...payload,
        peso_alvo: Number(plannerResults.pesoAlcancado),
        dias_alvo: Number(plannerData.timeframeDays),
        calorias_fase_mudanca: plannerResults.caloriasFaseMudanca,
        calorias_manutencao_futura: plannerResults.getFuturo,
        meta_bf_percentual: plannerResults.bfFinal || null,
        perda_peso_total_kg: plannerResults.pesoPerdidoKg || null,
        perda_massa_gorda_kg: plannerResults.massaGordaPerdidaKg || null,
        perda_bf_percentual: plannerResults.bfPerdido || null
      };
    } else if (objetivoPlano === 'hipertrofia' && hipertrofiaResultados) {
      const pesoEstimadoMedio = parseFloat(formData.weight) + ((hipertrofiaResultados.lyleAno[0] + hipertrofiaResultados.lyleAno[1])/2);
      payload = {
        ...payload,
        peso_alvo: Number(pesoEstimadoMedio.toFixed(1)),
        dias_alvo: 365,
        calorias_fase_mudanca: Math.round((hipertrofiaResultados.kcalMin + hipertrofiaResultados.kcalMax)/2),
        calorias_manutencao_futura: results.tdee, 
      };
    }

    const { error } = await supabase.from('dados_calculados').update(payload).eq('id_avaliacao', avaliacaoAtual.id);
    setSalvando(false);

    if (error) {
      alert('Erro ao salvar planejamento: ' + error.message);
    } else {
      alert('Planejamento Calórico e Metabólico salvo com sucesso!');
      navigate('/laudo-antropometrico', { state: { avaliacaoId: avaliacaoAtual.id } });
    }
  };

  const precisaBF = plannerData.simulationMode === 'target_bf' || plannerData.simulationMode === 'target_fat_loss';
  const faltaBF_Save = (objetivoPlano === 'hipertrofia' || (objetivoPlano === 'emagrecimento' && precisaBF)) && (!formData.bf || formData.bf <= 0);

  return (
    <section className="py-6 md:py-24 bg-slate-50 px-2 sm:px-6 container mx-auto max-w-5xl text-left">

      {/* SEÇÃO DE PESQUISA DE PACIENTE (Z-INDEX AJUSTADO) */}
      <div className="bg-white p-4 sm:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-emerald-100 mb-6 sm:mb-8 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Planejamento Dietético e Metas</h2>
          <p className="text-sm text-slate-500 mb-4">Selecione o paciente e a avaliação para importar os dados e salvar o plano.</p>
        </div>

        <div className="space-y-2 relative" ref={dropdownRef}>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Pesquisar Paciente</label>
          <input type="text" value={busca} onChange={(e) => { setBusca(e.target.value); setShowDropdown(true); }} onFocus={() => setShowDropdown(true)} placeholder="Digite o nome..." className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
          {showDropdown && pacientesFiltrados.length > 0 && (
            <ul className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {pacientesFiltrados.map(p => (
                <li key={p.id} onClick={() => selecionarPacienteBusca(p)} className="px-4 py-3 cursor-pointer hover:bg-emerald-50 text-sm font-medium border-b border-slate-100 last:border-0">{p.nome_completo} <span className="text-xs text-slate-400 font-normal ml-2">({p.sexo})</span></li>
              ))}
            </ul>
          )}
        </div>

        {pacienteSelecionado && avaliacaoAtual && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 gap-4 animate-in fade-in">
            <div>
              <p className="text-sm text-slate-700">Avaliando: <strong className="text-emerald-800">{pacienteSelecionado.nome_completo}</strong></p>
              <p className="text-xs text-slate-500 mt-1">Peso Base Coletado: {avaliacaoAtual.peso_paciente || 0} kg</p>
            </div>
            {historicoAvaliacoes.length > 0 && (
              <div className="w-full sm:w-auto">
                <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">Avaliação Selecionada</label>
                <select value={avaliacaoAtual.id} onChange={(e) => selecionarAvaliacaoDoHistorico(e.target.value)} className="w-full sm:w-48 px-3 py-2 border border-emerald-200 rounded-md text-sm outline-none bg-white font-semibold">
                  {historicoAvaliacoes.map(hist => <option key={hist.id} value={hist.id}>{new Date(hist.data_avaliacao).toLocaleDateString('pt-BR')} (Ref: {String(hist.id).slice(0, 4)})</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-2 sm:p-10 md:p-16 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col gap-6 md:gap-12">

        {/* COMPONENTE 1: CALCULADORA BÁSICA E TDEE */}
        <CalculadoraGET 
          formData={formData} 
          setFormData={setFormData} 
          results={results} 
          setResults={setResults} 
          setPlannerResults={setPlannerResults} 
        />

        {/* HUB DE PLANEJAMENTO METABÓLICO (SÓ APARECE APÓS CALCULAR O TDEE) */}
        {results && (
          <div className="bg-white p-2 sm:p-10 md:p-16 rounded-[1.5rem] sm:rounded-[2.5rem] md:rounded-[4rem] shadow-2xl border border-slate-200 flex flex-col gap-6 md:gap-8 mt-6 md:mt-12 animate-in slide-in-from-bottom-10">

            <div className="text-center mb-2 md:mb-4 px-2">
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase italic">
                Hub de Planejamento <span className="text-blue-600">Metabólico</span>
              </h2>
              <p className="text-slate-500 font-medium text-xs sm:text-sm mt-2 max-w-2xl mx-auto">
                Selecione o objetivo principal do paciente para simular a dieta, calcular adaptações e projetar a composição corporal futura.
              </p>
            </div>

            {/* SELETOR DE ABAS */}
            <div className="flex bg-slate-100 p-1 md:p-1.5 rounded-[1.5rem] w-full max-w-lg mx-auto shadow-inner border border-slate-200/60">
              <button 
                onClick={() => setObjetivoPlano('emagrecimento')} 
                className={`flex-1 py-3 md:py-4 text-[10px] sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-2 ${objetivoPlano === 'emagrecimento' ? 'bg-white text-blue-600 shadow-md border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5"/> Emagrecimento
              </button>
              <button 
                onClick={() => setObjetivoPlano('hipertrofia')} 
                className={`flex-1 py-3 md:py-4 text-[10px] sm:text-sm font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 sm:gap-2 ${objetivoPlano === 'hipertrofia' ? 'bg-emerald-600 text-white shadow-md border border-emerald-500' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5"/> Bulking (Ganho)
              </button>
            </div>

            {/* COMPONENTE 2: EMAGRECIMENTO (BODY WP) */}
            {objetivoPlano === 'emagrecimento' && (
              <BodyWP 
                formData={formData} 
                results={results} 
                plannerData={plannerData} 
                setPlannerData={setPlannerData} 
                plannerResults={plannerResults} 
                setPlannerResults={setPlannerResults} 
                advancedControls={advancedControls} 
                setAdvancedControls={setAdvancedControls} 
              />
            )}

            {/* COMPONENTE 3: HIPERTROFIA (BULKING) */}
            {objetivoPlano === 'hipertrofia' && (
              <Hipertrofia 
                formData={formData} 
                results={results} 
                nivelTreino={nivelTreino} 
                setNivelTreino={setNivelTreino} 
                hipertrofiaResultados={hipertrofiaResultados} 
                setHipertrofiaResultados={setHipertrofiaResultados} 
              />
            )}

            {/* BOTÃO MESTRE DE SALVAR NO BANCO */}
            {avaliacaoAtual && results && (objetivoPlano === 'hipertrofia' || plannerResults) && !faltaBF_Save && (
              <div className="px-2">
                <button onClick={handleSalvarNoBanco} disabled={salvando} className="w-full mt-4 md:mt-6 bg-slate-900 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-4 md:py-6 rounded-2xl md:rounded-[2rem] text-sm md:text-xl uppercase tracking-widest shadow-xl hover:shadow-2xl transition-all">
                  {salvando ? 'Salvando...' : '💾 Salvar Planejamento na Avaliação'}
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </section>
  );
}
