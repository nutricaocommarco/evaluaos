import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  Calculator, Activity, Info, CheckCircle2, User, HeartPulse, 
  AlertTriangle, Settings, Zap, Dumbbell, Timer, Target, TrendingDown, Scale, Utensils, CalendarDays, Droplet
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Area, ComposedChart 
} from 'recharts';

const metOptions = [
  { label: "Selecione a atividade...", value: "0" },
  { label: "🏋️ Musculação (Pesada / Intensa)", value: "6.0" },
  { label: "🏋️ Musculação (Moderada)", value: "3.5" },
  { label: "🏋️ Crossfit / Treino Funcional", value: "8.0" },
  { label: "🚴 Ciclismo (16-19 km/h - Leve)", value: "6.8" },
  { label: "🚴 Ciclismo (20-22 km/h - Moderado)", value: "8.0" },
  { label: "🚴 Ciclismo (25+ km/h - Vigoroso)", value: "10.0" },
  { label: "🚴 Ciclismo (Pelotão / 30+ km/h)", value: "12.0" },
  { label: "🚴 Ciclismo Indoor / Spinning", value: "8.9" },
  { label: "🏃 Corrida (6-7 km/h - Jogging/Leve)", value: "7.0" },
  { label: "🏃 Corrida (8 km/h - Trote)", value: "8.3" },
  { label: "🏃 Corrida (10 km/h - Moderada)", value: "9.8" },
  { label: "🏃 Corrida (12 km/h - Intensa)", value: "11.5" },
  { label: "🏃 Corrida (15+ km/h - Muito Intensa)", value: "14.0" },
  { label: "🚶 Caminhada (3-4 km/h - Leve)", value: "3.0" },
  { label: "🚶 Caminhada Rápida (5-6 km/h)", value: "4.3" },
  { label: "🚶 Subir Escadas", value: "8.0" },
  { label: "🧗 Escalada (Indoor / Bouldering)", value: "7.5" },
  { label: "🏊 Natação (Lazer / Leve)", value: "6.0" },
  { label: "🏊 Natação (Crawl - Moderado)", value: "8.3" },
  { label: "🏊 Natação (Borboleta / Vigoroso)", value: "10.0" },
  { label: "🏊 Hidroginástica", value: "4.0" },
  { label: "🏄 Surfe (Prática / Lazer)", value: "5.0" },
  { label: "🚣 Remo / Ergômetro (Moderado)", value: "7.0" },
  { label: "🚣 Remo / Ergômetro (Vigoroso)", value: "8.5" },
  { label: "🥊 Artes Marciais (Jiu-Jitsu, Muay Thai, Boxe)", value: "10.3" },
  { label: "⚽ Futebol / Basquete / Vôlei", value: "8.0" },
  { label: "🎾 Tênis (Simples)", value: "8.0" },
  { label: "🛹 Skate (Lazer / Prática)", value: "5.0" },
  { label: "🛼 Patins (Lazer / Moderado)", value: "7.0" },
  { label: "⚡ Pular Corda (Moderado)", value: "10.0" },
  { label: "⚡ Pular Corda (Rápido)", value: "12.0" },
  { label: "💃 Dança Aeróbica / Zumba", value: "7.3" },
  { label: "🧘 Yoga / Alongamento / Pilates", value: "2.5" },
  { label: "🧹 Faxina Pesada / Trabalho Doméstico", value: "3.5" }
];

export default function CalculadoraGastoCalorico() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // ==========================================
  // ESTADOS DO SUPABASE (BUSCA DE PACIENTE)
  // ==========================================
  const [busca, setBusca] = useState('');
  const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [historicoAvaliacoes, setHistoricoAvaliacoes] = useState([]);
  const [avaliacaoAtual, setAvaliacaoAtual] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // ==========================================
  // ESTADOS DA CALCULADORA E SIMULADOR
  // ==========================================
  const [formData, setFormData] = useState({
    gender: 'M',
    age: '',
    weight: '',
    height: '',
    bf: '',
    calculationMode: 'auto',
    manualFormula: 'mifflin',
    bodyType: 'average',
    activityCalcMethod: 'auto',
    routine: 'sedentary',
    exerciseCardio: 'none',
    exerciseStrength: 'none',
    manualFA: '1.55',
    metActivities: [
      { id: 1, met: '0', minutes: '' },
      { id: 2, met: '0', minutes: '' },
      { id: 3, met: '0', minutes: '' },
      { id: 4, met: '0', minutes: '' }
    ]
  });

  const [results, setResults] = useState(null);
  const [advancedControls, setAdvancedControls] = useState({ enabled: false, rmrOverride: '' });
  
  const [plannerData, setPlannerData] = useState({ 
    simulationMode: 'target_weight', // 'target_weight', 'target_bf', 'target_fat_loss', 'target_calories'
    targetWeight: '', 
    targetBF: '',
    targetFatLoss: '',
    targetCalories: '',
    timeframeDays: 180 
  });
  const [plannerResults, setPlannerResults] = useState(null);
  const [plannerWarning, setPlannerWarning] = useState('');

  // ==========================================
  // CÁLCULO GORDURA ATUAL EM KG (PARA UI)
  // ==========================================
  const pesoAtualBase = parseFloat(formData.weight) || 0;
  const bfAtualBase = parseFloat(formData.bf) || 0;
  const massaGordaAtualKg = pesoAtualBase > 0 && bfAtualBase > 0 ? (pesoAtualBase * (bfAtualBase / 100)).toFixed(1) : 0;

  // ==========================================
  // EFEITOS DO SUPABASE
  // ==========================================
  useEffect(() => {
    const buscarPacientes = async () => {
      if (busca.length < 1) {
        setPacientesFiltrados([]);
        return;
      }
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, nome_completo, sexo, data_nascimento')
        .ilike('nome_completo', `%${busca}%`)
        .limit(5);

      if (!error && data) setPacientesFiltrados(data);
    };
    
    const delayDebounce = setTimeout(() => buscarPacientes(), 300);
    return () => clearTimeout(delayDebounce);
  }, [busca]);

  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const selecionarPacienteBusca = async (paciente) => {
    setPacienteSelecionado(paciente);
    setBusca(paciente.nome_completo);
    setShowDropdown(false);
    setResults(null);
    setPlannerResults(null);

    const { data: historico } = await supabase
      .from('avaliacoes')
      .select('id, data_avaliacao, peso_paciente')
      .eq('id_paciente', paciente.id)
      .order('data_avaliacao', { ascending: false });

    if (historico && historico.length > 0) {
      setHistoricoAvaliacoes(historico);
      selecionarAvaliacaoDoHistorico(historico[0].id, paciente);
    } else {
      setHistoricoAvaliacoes([]);
      setAvaliacaoAtual(null);
      alert('Este paciente ainda não possui avaliações cadastradas.');
    }
  };

  const selecionarAvaliacaoDoHistorico = async (idAvaliacao, pacienteOverride) => {
    const pac = pacienteOverride || pacienteSelecionado;
    const { data: aval } = await supabase
      .from('avaliacoes')
      .select('*')
      .eq('id', idAvaliacao)
      .single();

    const { data: calc } = await supabase
      .from('dados_calculados')
      .select('*')
      .eq('id_avaliacao', idAvaliacao)
      .maybeSingle();

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
        ...prev,
        gender: pac.sexo || 'M',
        age: idade,
        weight: aval.peso_paciente || '',
        height: aval.altura_paciente || '',
        bf: bfSalvo
      }));
    }
  };

  // ==========================================
  // FUNÇÕES DA DATA DO PLANNER
  // ==========================================
  const getFormattedDate = (daysToAdd) => {
    const d = new Date();
    d.setDate(d.getDate() + (parseInt(daysToAdd) || 0));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (e) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-').map(Number);
    const selected = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const diffTime = selected.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      setPlannerData({...plannerData, timeframeDays: diffDays});
    } else {
      setPlannerData({...plannerData, timeframeDays: 1}); 
    }
  };

  // ==========================================
  // FUNÇÕES DA CALCULADORA (BMR & TDEE)
  // ==========================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMetChange = (index, field, value) => {
    const newMets = [...formData.metActivities];
    newMets[index][field] = value;
    setFormData({ ...formData, metActivities: newMets });
  };

  const calculateAutoActivityFactor = () => {
    let base = 1.2; 
    if (formData.routine === 'standing') base = 1.35;
    if (formData.routine === 'physical') base = 1.50;

    let cardioBonus = 0;
    if (formData.exerciseCardio === 'light') cardioBonus = 0.15; 
    if (formData.exerciseCardio === 'moderate') cardioBonus = 0.25; 
    if (formData.exerciseCardio === 'intense') cardioBonus = 0.40; 
    if (formData.exerciseCardio === 'endurance') cardioBonus = 0.60; 

    let strengthBonus = 0;
    if (formData.exerciseStrength === 'light') strengthBonus = 0.05; 
    if (formData.exerciseStrength === 'moderate') strengthBonus = 0.10; 
    if (formData.exerciseStrength === 'intense') strengthBonus = 0.15; 

    return base + cardioBonus + strengthBonus;
  };

  const determineBestFormula = (hasBF, bfValue, isMale, userSelectedBodyType) => {
    let bodyType = userSelectedBodyType;

    if (hasBF) {
      const isActuallyObese = (isMale && bfValue > 25) || (!isMale && bfValue > 32);
      if (isActuallyObese) return 'mifflin';
      if (bodyType === 'obese') bodyType = 'average';
      if (bodyType === 'endurance') return 'tinsley';
      return 'cunningham';
    }

    if (bodyType === 'obese') return 'mifflin';
    if (bodyType === 'bodybuilder' || bodyType === 'endurance') return 'tinsley'; 
    return 'harris'; 
  };

  const getBMR = (weight, height, age, isMale, bf, activeFormula) => {
    let lbm = weight;
    if (bf && bf > 0) lbm = weight * (1 - (bf / 100));

    switch (activeFormula) {
      case 'mifflin':
        return isMale
          ? (10 * weight) + (6.25 * height) - (5 * age) + 5
          : (10 * weight) + (6.25 * height) - (5 * age) - 161;
      case 'harris':
        return isMale
          ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
          : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      case 'cunningham':
        return 500 + (22 * lbm);
      case 'tinsley':
        return (bf && bf > 0) ? (25.9 * lbm + 284) : (24.8 * weight + 10);
      default:
        return 0;
    }
  };

  const calculateCalories = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    const age = parseInt(formData.age);
    const bf = parseFloat(formData.bf);
    const isMale = formData.gender === 'M';

    if (!weight || !height || !age) return;

    let hasBF = (bf && bf > 0);

    let activeFormula = formData.calculationMode === 'manual' 
      ? formData.manualFormula 
      : determineBestFormula(hasBF, bf, isMale, formData.bodyType);

    let selectedFormulaName = '';
    if (activeFormula === 'mifflin') selectedFormulaName = 'Mifflin-St Jeor';
    if (activeFormula === 'harris') selectedFormulaName = 'Harris-Benedict';
    if (activeFormula === 'cunningham') selectedFormulaName = 'Cunningham';
    if (activeFormula === 'tinsley') selectedFormulaName = 'Tinsley';

    const bmr = getBMR(weight, height, age, isMale, bf, activeFormula);

    let tdee = 0;
    let finalFA = 0;

    if (formData.activityCalcMethod === 'auto') {
      finalFA = calculateAutoActivityFactor();
      tdee = bmr * finalFA;
    } 
    else if (formData.activityCalcMethod === 'manual') {
      finalFA = parseFloat(formData.manualFA) || 1.2;
      tdee = bmr * finalFA;
    } 
    else if (formData.activityCalcMethod === 'mets') {
      let metCalories = 0;
      formData.metActivities.forEach(act => {
        const metVal = parseFloat(act.met);
        const mins = parseFloat(act.minutes);
        if (metVal > 0 && mins > 0) {
          metCalories += metVal * weight * (mins / 60);
        }
      });
      const baselineTdee = bmr * 1.2; 
      tdee = baselineTdee + metCalories;
      finalFA = tdee / bmr;
    }

    setResults({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      activityFactor: finalFA.toFixed(2),
      formulaUsed: selectedFormulaName,
      internalFormulaKey: activeFormula 
    });
    setPlannerResults(null); 
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    calculateCalories();
  };

  // ==========================================
  // LÓGICA DO BODY WEIGHT PLANNER (SIMULADOR DO NIH COM %GC)
  // ==========================================
  const simulateWeightTrajectory = (intake, days, initialWeight, height, age, isMale, bf, pal, formula, baselineTDEE, rmrOverride) => {
    let currentWeight = initialWeight;
    let initialFM = bf ? initialWeight * (bf / 100) : 0;
    let currentFM = initialFM;
    let data = [];
    
    const metabolicAdaptation = intake < baselineTDEE ? (baselineTDEE - intake) * 0.14 : 0;
    const energyDensity = 7300; 
    
    for (let i = 0; i <= days; i++) {
      const uncertainty = (i / days) * currentWeight * 0.075; 
      let currentBf = currentWeight > 0 ? (currentFM / currentWeight) * 100 : 0;
      
      data.push({ 
        dia: i, 
        pesoEstimado: Number(currentWeight.toFixed(1)),
        pesoAlto: Number((currentWeight + uncertainty).toFixed(1)),
        pesoBaixo: Number((currentWeight - uncertainty).toFixed(1)),
        bfEstimado: Number(currentBf.toFixed(1))
      });

      let dailyBMR = rmrOverride 
        ? rmrOverride * (currentWeight / initialWeight) 
        : getBMR(currentWeight, height, age, isMale, currentBf, formula);
        
      const theoreticalTDEE = dailyBMR * pal;
      const actualTDEE = theoreticalTDEE - metabolicAdaptation;
      const dailyBalance = actualTDEE - intake;
      const weightChange = dailyBalance / energyDensity; 
      
      currentWeight -= weightChange;
      
      // Proporção de perda: Regra de Forbes simplificada
      if (weightChange > 0) {
        currentFM -= (weightChange * 0.75); 
      } else {
        currentFM -= (weightChange * 0.50); 
      }
      if (currentFM < (currentWeight * 0.03)) currentFM = currentWeight * 0.03; 
    }
    
    return { finalWeight: currentWeight, finalFM: currentFM, data };
  };

  const runPlanner = () => {
    if (!results) return;

    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height);
    const a = parseInt(formData.age);
    const bf = parseFloat(formData.bf);
    const days = parseInt(plannerData.timeframeDays);
    const pal = parseFloat(results.activityFactor);
    const isMale = formData.gender === 'M';
    const form = results.internalFormulaKey;
    const mode = plannerData.simulationMode;
    const getAtual = results.tdee;
    const rmrOverride = advancedControls.enabled && advancedControls.rmrOverride ? parseFloat(advancedControls.rmrOverride) : null;

    if (!days || days <= 0) return;

    let targetW = w;
    let targetBF = parseFloat(plannerData.targetBF);
    let targetFatLoss = parseFloat(plannerData.targetFatLoss);
    
    let appliedIntake = 0;
    let finalChartData = [];
    let achievedWeight = w;
    let achievedFM = bf ? w * (bf / 100) : 0;

    let minIntake = 500;
    let maxIntake = 6000;

    if (mode === 'target_weight') {
      targetW = parseFloat(plannerData.targetWeight);
      if (!targetW) return;
      for (let iter = 0; iter < 40; iter++) {
        let midIntake = (minIntake + maxIntake) / 2;
        let sim = simulateWeightTrajectory(midIntake, days, w, h, a, isMale, bf, pal, form, getAtual, rmrOverride);
        if (sim.finalWeight > targetW) maxIntake = midIntake; else minIntake = midIntake; 
        appliedIntake = midIntake;
        finalChartData = sim.data;
        achievedWeight = sim.finalWeight;
        achievedFM = sim.finalFM;
      }
    } 
    else if (mode === 'target_bf') {
      if (!targetBF || !bf) return;
      for (let iter = 0; iter < 40; iter++) {
        let midIntake = (minIntake + maxIntake) / 2;
        let sim = simulateWeightTrajectory(midIntake, days, w, h, a, isMale, bf, pal, form, getAtual, rmrOverride);
        let finalBf = (sim.finalFM / sim.finalWeight) * 100;
        if (targetBF < bf) {
            if (finalBf > targetBF) maxIntake = midIntake; else minIntake = midIntake;
        } else {
            if (finalBf < targetBF) minIntake = midIntake; else maxIntake = midIntake;
        }
        appliedIntake = midIntake;
        finalChartData = sim.data;
        achievedWeight = sim.finalWeight;
        achievedFM = sim.finalFM;
      }
    }
    else if (mode === 'target_fat_loss') {
      if (!targetFatLoss || !bf) return;
      let initialFM = w * (bf / 100);
      for (let iter = 0; iter < 40; iter++) {
        let midIntake = (minIntake + maxIntake) / 2;
        let sim = simulateWeightTrajectory(midIntake, days, w, h, a, isMale, bf, pal, form, getAtual, rmrOverride);
        let fatLost = initialFM - sim.finalFM;
        if (fatLost < targetFatLoss) maxIntake = midIntake; else minIntake = midIntake;
        appliedIntake = midIntake;
        finalChartData = sim.data;
        achievedWeight = sim.finalWeight;
        achievedFM = sim.finalFM;
      }
    }
    else {
      // MODO DIETA (Kcal fixa)
      appliedIntake = parseFloat(plannerData.targetCalories);
      if (!appliedIntake) return;
      let sim = simulateWeightTrajectory(appliedIntake, days, w, h, a, isMale, bf, pal, form, getAtual, rmrOverride);
      finalChartData = sim.data;
      achievedWeight = sim.finalWeight;
      achievedFM = sim.finalFM;
      targetW = achievedWeight;
    }

    // Calcular novo metabolismo no final da jornada
    let bmrFuturo = rmrOverride 
      ? rmrOverride * (achievedWeight / w) 
      : getBMR(achievedWeight, h, a + (days/365), isMale, bf ? ((achievedFM/achievedWeight)*100) : 0, form);
    const getFuturo = bmrFuturo * pal;

    let currentWarning = '';
    const safeMin = isMale ? 1200 : 1000;

    if (mode !== 'target_calories' && appliedIntake < safeMin) {
      currentWarning = `Objetivo agressivo! A predição original exigiria apenas ${Math.round(appliedIntake)} kcal/dia. Ajustamos a simulação para o limite seguro clínico de ${safeMin} kcal/dia. O resultado ao longo do período será diferente do alvo original.`;
      appliedIntake = safeMin;
      const safeSim = simulateWeightTrajectory(safeMin, days, w, h, a, isMale, bf, pal, form, getAtual, rmrOverride);
      finalChartData = safeSim.data;
      achievedWeight = safeSim.finalWeight;
      achievedFM = safeSim.finalFM;
    } else if (mode === 'target_calories' && appliedIntake < safeMin) {
      currentWarning = `Atenção: A dieta programada de ${appliedIntake} kcal/dia está abaixo do limite basal de segurança recomendado (${safeMin} kcal/dia). Isso pode causar perda agressiva de massa magra.`;
    } else if (targetW > w && appliedIntake > getAtual + 1500) {
      currentWarning = `Ganho de peso rápido projetado! O consumo simulado de ${Math.round(appliedIntake)} kcal/dia é bastante elevado e resultará num acúmulo agressivo de gordura corporal.`;
    }

    let pesoPerdidoKg = 0;
    let massaGordaPerdidaKg = 0;
    let bfFinal = null;
    let bfPerdido = null;

    if (bf && bf > 0) {
      pesoPerdidoKg = w - achievedWeight;
      let initialFM = w * (bf / 100);
      massaGordaPerdidaKg = initialFM - achievedFM;
      bfFinal = (achievedFM / achievedWeight) * 100;
      bfPerdido = bf - bfFinal;
    } else {
      pesoPerdidoKg = w - achievedWeight;
    }

    setPlannerWarning(currentWarning);
    setPlannerResults({
      getFuturo: Math.round(getFuturo),
      caloriasFaseMudanca: Math.round(appliedIntake),
      pesoAlcancado: Number(achievedWeight.toFixed(1)),
      pesoPerdidoKg: Number(pesoPerdidoKg.toFixed(1)),
      massaGordaPerdidaKg: massaGordaPerdidaKg !== 0 ? Number(massaGordaPerdidaKg.toFixed(1)) : null,
      bfFinal: bfFinal !== null ? Number(bfFinal.toFixed(1)) : null,
      bfPerdido: bfPerdido !== null ? Number(bfPerdido.toFixed(1)) : null,
      dadosGrafico: finalChartData
    });
  };

  const handleSalvarNoBanco = async () => {
    if (!avaliacaoAtual) return alert('Nenhuma avaliação selecionada.');
    if (!results) return alert('Por favor, calcule os resultados primeiro.');

    setSalvando(true);

    const payload = {
      taxa_metabolica_basal: results.bmr,
      gasto_energetico_total: results.tdee,
      fator_atividade: Number(results.activityFactor),
      equacao_metabolica: results.formulaUsed,
      peso_alvo: plannerResults ? Number(plannerResults.pesoAlcancado) : null,
      dias_alvo: plannerResults ? Number(plannerData.timeframeDays) : null,
      calorias_fase_mudanca: plannerResults ? plannerResults.caloriasFaseMudanca : null,
      calorias_manutencao_futura: plannerResults ? plannerResults.getFuturo : null,
      meta_bf_percentual: plannerResults?.bfFinal || null,
      perda_peso_total_kg: plannerResults?.pesoPerdidoKg || null,
      perda_massa_gorda_kg: plannerResults?.massaGordaPerdidaKg || null,
      perda_bf_percentual: plannerResults?.bfPerdido || null
    };

    const { error } = await supabase
      .from('dados_calculados')
      .update(payload)
      .eq('id_avaliacao', avaliacaoAtual.id);

    setSalvando(false);

    if (error) {
      alert('Erro ao salvar planejamento: ' + error.message);
    } else {
      alert('Planejamento Calórico e Metabólico salvo com sucesso!');
      navigate('/laudo-antropometrico', { state: { avaliacaoId: avaliacaoAtual.id } });
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1">
          <p className="font-bold mb-2 border-b border-slate-700 pb-1 text-slate-300">Dia {label}</p>
          <p className="text-white font-medium">Peso Estimado: <span className="font-bold text-emerald-400">{data.pesoEstimado} kg</span> <span className="text-slate-400 font-normal ml-1">[{data.pesoBaixo}, {data.pesoAlto}]</span></p>
          {data.bfEstimado > 0 && (
            <p className="text-white font-medium pt-1">Gordura Corporal: <span className="font-bold text-amber-400">{data.bfEstimado}%</span></p>
          )}
        </div>
      );
    }
    return null;
  };

  const precisaBF = plannerData.simulationMode === 'target_bf' || plannerData.simulationMode === 'target_fat_loss';
  const faltaBF = precisaBF && (!formData.bf || formData.bf <= 0);

  return (
    <section className="py-16 md:py-24 bg-slate-50 px-4 sm:px-6 container mx-auto max-w-5xl text-left">
      
      {/* 🟢 SEÇÃO DE PESQUISA DE PACIENTE (SUPABASE) */}
      <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-emerald-100 mb-8 z-50 relative">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Planejamento Dietético e Metas</h2>
          <p className="text-sm text-slate-500 mb-4">Selecione o paciente e a avaliação para importar os dados e salvar o plano.</p>
        </div>

        <div className="space-y-2 relative" ref={dropdownRef}>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Pesquisar Paciente
          </label>
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Digite o nome (Ex: João...)"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          />
          
          {showDropdown && pacientesFiltrados.length > 0 && (
            <ul className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {pacientesFiltrados.map(p => (
                <li
                  key={p.id}
                  onClick={() => selecionarPacienteBusca(p)}
                  className="px-4 py-3 cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 text-sm font-medium border-b border-slate-100 last:border-0"
                >
                  {p.nome_completo} <span className="text-xs text-slate-400 font-normal ml-2">({p.sexo})</span>
                </li>
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
                <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">
                  Avaliação Selecionada
                </label>
                <select
                  value={avaliacaoAtual.id}
                  onChange={(e) => selecionarAvaliacaoDoHistorico(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 border border-emerald-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-emerald-900 font-semibold"
                >
                  {historicoAvaliacoes.map(hist => (
                    <option key={hist.id} value={hist.id}>
                      {new Date(hist.data_avaliacao).toLocaleDateString('pt-BR')} (Ref: {String(hist.id).slice(0, 4)})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-6 sm:p-10 md:p-16 rounded-[2rem] md:rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col gap-8 md:gap-12">
        <div className="bg-slate-50 rounded-[2rem] md:rounded-[3.5rem] p-5 sm:p-8 md:p-12 border border-slate-200 shadow-inner">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase italic mb-8 md:mb-10 border-b border-emerald-200 pb-4 flex items-center gap-3">
            <Calculator className="text-emerald-700 w-6 h-6 md:w-8 md:h-8 flex-shrink-0"/> Calculadora de Gasto Calórico
          </h2>

          <form onSubmit={handleCalculate} className="space-y-10 md:space-y-12">

            {/* ETAPA 1: SOBRE VOCÊ */}
            <section>
              <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase italic mb-5 md:mb-6 flex items-center gap-2">
                <User className="text-emerald-700 w-5 h-5 md:w-6 md:h-6 flex-shrink-0" /> 1. Parâmetros do Paciente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <div>
                  <label htmlFor="gender-select" className="block text-xs md:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Sexo</label>
                  <select id="gender-select" name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-3 md:p-4 border-2 border-slate-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium text-slate-700 transition-all outline-none">
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="age-input" className="block text-xs md:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Idade (anos)</label>
                  <input id="age-input" type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="Ex: 30" required className="w-full p-3 md:p-4 border-2 border-slate-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium text-slate-700 transition-all outline-none" />
                </div>
                <div>
                  <label htmlFor="weight-input" className="block text-xs md:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Peso (kg)</label>
                  <input id="weight-input" type="number" step="0.1" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="Ex: 75.5" required className="w-full p-3 md:p-4 border-2 border-slate-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium text-slate-700 transition-all outline-none" />
                </div>
                <div>
                  <label htmlFor="height-input" className="block text-xs md:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Altura (cm)</label>
                  <input id="height-input" type="number" name="height" value={formData.height} onChange={handleInputChange} placeholder="Ex: 175" required className="w-full p-3 md:p-4 border-2 border-slate-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium text-slate-700 transition-all outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="bf-input" className="block text-xs md:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Percentual de Gordura (%) <span className="text-slate-500 font-normal normal-case block sm:inline mt-1 sm:mt-0">- Essencial para equações atléticas e de projeção</span>
                  </label>
                  <input id="bf-input" type="number" step="0.1" name="bf" value={formData.bf} onChange={handleInputChange} placeholder="Ex: 15.5" className="w-full p-3 md:p-4 border-2 border-slate-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium text-slate-700 transition-all outline-none" />
                </div>
              </div>
            </section>

            {/* ETAPA 2: PERFIL FÍSICO */}
            <section>
              <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase italic mb-5 md:mb-6 flex items-center gap-2">
                <Activity className="text-emerald-700 w-5 h-5 md:w-6 md:h-6 flex-shrink-0" /> 2. Perfil Biológico (Inteligência)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                  {id: 'average', label: 'Biotipo Comum / Médio'},
                  {id: 'obese', label: 'Sobrepeso / Obesidade'},
                  {id: 'bodybuilder', label: 'Musculoso / Fisiculturista'},
                  {id: 'endurance', label: 'Atleta Endurance'}
                ].map(item => (
                  <label key={item.id} className={`p-3 md:p-4 border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all flex items-center justify-center text-center ${formData.bodyType === item.id ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'}`}>
                    <input type="radio" name="bodyType" value={item.id} checked={formData.bodyType === item.id} onChange={handleInputChange} className="hidden" />
                    <span className="font-bold text-sm md:text-base">{item.label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* ETAPA 3: FATOR DE ATIVIDADE */}
            <section>
              <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase italic mb-5 md:mb-6 flex items-center gap-2">
                <HeartPulse className="text-emerald-700 w-5 h-5 md:w-6 md:h-6 flex-shrink-0" /> 3. Gasto Energético de Atividade
              </h3>

              <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">

                <div className="flex flex-wrap gap-2 md:gap-4 mb-8 border-b border-slate-100 pb-6">
                  <button type="button" onClick={() => setFormData({...formData, activityCalcMethod: 'auto'})} className={`px-4 py-2.5 rounded-full font-bold text-xs md:text-sm transition-all flex items-center gap-2 ${formData.activityCalcMethod === 'auto' ? 'bg-emerald-700 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <Zap className="w-4 h-4"/> Questionário Automático
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, activityCalcMethod: 'manual'})} className={`px-4 py-2.5 rounded-full font-bold text-xs md:text-sm transition-all flex items-center gap-2 ${formData.activityCalcMethod === 'manual' ? 'bg-emerald-700 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <Settings className="w-4 h-4"/> Inserção de FA Manual
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, activityCalcMethod: 'mets'})} className={`px-4 py-2.5 rounded-full font-bold text-xs md:text-sm transition-all flex items-center gap-2 ${formData.activityCalcMethod === 'mets' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <Activity className="w-4 h-4"/> Modo Avançado (METs)
                  </button>
                </div>

                {formData.activityCalcMethod === 'auto' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div>
                      <label className="block font-bold text-slate-800 mb-3 md:mb-4">Como é a rotina de trabalho do paciente?</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        {[{id: 'sedentary', label: 'Sentado (Escritório)'},
                          {id: 'standing', label: 'Em pé ou caminhando'},
                          {id: 'physical', label: 'Trabalho físico pesado'}].map(item => (
                          <label key={item.id} className={`p-3 md:p-4 border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all ${formData.routine === item.id ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700'}`}>
                            <input type="radio" name="routine" value={item.id} checked={formData.routine === item.id} onChange={handleInputChange} className="hidden" />
                            <span className="text-sm font-bold block text-center">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <label className="block font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2">
                        <Timer className="w-5 h-5 text-blue-500" /> Horas semanais de CARDIO (Corrida, Ciclismo, Natação):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
                        {[{id: 'none', label: 'Não faz'},
                          {id: 'light', label: 'Leve (1 a 2h)'},
                          {id: 'moderate', label: 'Moderado (3 a 5h)'},
                          {id: 'intense', label: 'Intenso (6 a 9h)'},
                          {id: 'endurance', label: 'Extremo (10h+)'}].map(item => (
                          <label key={`cardio-${item.id}`} className={`p-3 border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all ${formData.exerciseCardio === item.id ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700'}`}>
                            <input type="radio" name="exerciseCardio" value={item.id} checked={formData.exerciseCardio === item.id} onChange={handleInputChange} className="hidden" />
                            <span className="text-xs md:text-sm font-bold block text-center">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <label className="block font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2">
                        <Dumbbell className="w-5 h-5 text-orange-500" /> Horas semanais de FORÇA (Musculação, Crossfit):
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {[{id: 'none', label: 'Não faz'},
                          {id: 'light', label: 'Leve (1 a 2h)'},
                          {id: 'moderate', label: 'Moderado (3 a 5h)'},
                          {id: 'intense', label: 'Intenso (6h+)'}].map(item => (
                          <label key={`strength-${item.id}`} className={`p-3 border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all ${formData.exerciseStrength === item.id ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700'}`}>
                            <input type="radio" name="exerciseStrength" value={item.id} checked={formData.exerciseStrength === item.id} onChange={handleInputChange} className="hidden" />
                            <span className="text-xs md:text-sm font-bold block text-center">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {formData.activityCalcMethod === 'manual' && (
                  <div className="animate-in fade-in duration-300">
                    <label htmlFor="manual-fa-input" className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Fator de Atividade (FA)</label>
                    <input id="manual-fa-input" type="number" step="0.01" min="1.0" max="2.5" name="manualFA" value={formData.manualFA} onChange={handleInputChange} placeholder="Ex: 1.55" className="w-full md:w-1/2 p-3 md:p-4 border-2 border-slate-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white font-medium text-slate-700 transition-all outline-none" />
                    <p className="mt-4 text-sm text-slate-500 leading-relaxed max-w-2xl">
                      <strong>Guia Rápido:</strong> 1.2 (Sedentário) • 1.375 (Leve) • 1.55 (Moderado) • 1.725 (Intenso) • 1.9 a 2.2 (Extremo / Atleta)
                    </p>
                  </div>
                )}

                {formData.activityCalcMethod === 'mets' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-slate-900 text-white p-4 md:p-5 rounded-2xl mb-6 shadow-md border-l-4 border-yellow-400">
                      <p className="text-sm font-medium leading-relaxed">
                        <strong className="text-emerald-400">Cálculo de Alta Precisão (Diário):</strong> O sistema assumirá que o paciente é sedentário no restante do dia (Fator Base 1.2) e somará as calorias exatas torradas no treino baseado no equivalente metabólico da tarefa (MET). <br/><br/>
                        <strong className="text-yellow-400 uppercase tracking-wide bg-yellow-400/20 px-2 py-1 rounded inline-block">Atenção:</strong> Preencha o tempo gasto em um <strong>ÚNICO DIA</strong>, e não a soma da semana inteira!
                      </p>
                    </div>

                    {[0, 1, 2, 3].map(index => (
                      <div key={index} className="flex flex-col sm:flex-row gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-full sm:w-2/3">
                          <label htmlFor={`met-select-${index}`} className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Atividade {index + 1}</label>
                          <select 
                            id={`met-select-${index}`}
                            value={formData.metActivities[index].met} 
                            onChange={(e) => handleMetChange(index, 'met', e.target.value)} 
                            className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 bg-white font-medium text-slate-700 outline-none"
                          >
                            {metOptions.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div className="w-full sm:w-1/3 relative">
                          <label htmlFor={`minutes-input-${index}`} className="block text-xs font-black text-emerald-700 mb-2 uppercase tracking-wide">Tempo POR DIA (Minutos)</label>
                          <input 
                            id={`minutes-input-${index}`}
                            type="number" 
                            placeholder="Ex: 60" 
                            value={formData.metActivities[index].minutes} 
                            onChange={(e) => handleMetChange(index, 'minutes', e.target.value)} 
                            className="w-full p-3 border-2 border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-700 transition-all outline-none" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </section>

            {/* ETAPA 4: SELEÇÃO DA FÓRMULA */}
            <section className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase italic mb-5 md:mb-6 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-700 w-5 h-5 md:w-6 md:h-6 flex-shrink-0" /> 4. Seleção da Equação Basal
              </h3>

              <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 mb-6 md:mb-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="calculationMode" value="auto" checked={formData.calculationMode === 'auto'} onChange={handleInputChange} className="w-5 h-5 text-emerald-700 focus:ring-emerald-500 accent-emerald-600 flex-shrink-0" />
                  <span className="font-bold text-slate-800">Seleção Inteligente Automática</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="calculationMode" value="manual" checked={formData.calculationMode === 'manual'} onChange={handleInputChange} className="w-5 h-5 text-emerald-700 focus:ring-emerald-500 accent-emerald-600 flex-shrink-0" />
                  <span className="font-bold text-slate-800">Forçar Equação Manualmente</span>
                </label>
              </div>

              {formData.calculationMode === 'auto' ? (
                <div className="bg-emerald-50 text-emerald-900 p-5 md:p-6 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 md:gap-4">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 sm:mt-1 text-emerald-700" />
                  <p className="text-sm md:text-base font-medium leading-relaxed">
                    <strong>Algoritmo Ativado.</strong> O sistema cruza o Percentual de Gordura com o Perfil Físico, para selecionar a equação metabólica mais confiável e validada para este biotipo.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {[
                      { id: 'mifflin', name: 'Mifflin-St Jeor', desc: 'A mais recomendada hoje para a população em geral e pessoas com sobrepeso.' },
                      { id: 'harris', name: 'Harris-Benedict', desc: 'A fórmula mais antiga e famosa, boa para estimativas gerais.' },
                      { id: 'cunningham', name: 'Cunningham', desc: 'Padrão ouro para atletas. Requer o % de gordura para usar a massa magra.' },
                      { id: 'tinsley', name: 'Tinsley', desc: 'Ótima para praticantes de musculação e endurance (com ou sem %GC).' }
                    ].map(formula => (
                      <label key={formula.id} className={`p-4 md:p-6 border-2 rounded-xl md:rounded-2xl cursor-pointer flex flex-col gap-2 transition-all ${formData.manualFormula === formula.id ? 'border-emerald-600 bg-emerald-50 shadow-md' : 'border-slate-200 bg-slate-50 hover:border-emerald-300'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="manualFormula" value={formula.id} checked={formData.manualFormula === formula.id} onChange={handleInputChange} className="w-5 h-5 text-emerald-700 focus:ring-emerald-500 accent-emerald-600 flex-shrink-0" />
                          <span className="font-black text-slate-900 text-base md:text-lg uppercase italic">{formula.name}</span>
                        </div>
                        <p className="text-xs md:text-sm text-slate-600 pl-8 font-medium leading-relaxed">{formula.desc}</p>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <button type="submit" className="w-full bg-slate-900 hover:bg-emerald-700 text-white font-black py-5 md:py-6 px-6 md:px-8 rounded-[1.5rem] md:rounded-full shadow-xl transform transition-all hover:-translate-y-1 hover:shadow-2xl text-lg md:text-xl uppercase tracking-widest flex justify-center items-center gap-2 md:gap-3">
              Processar <span className="hidden sm:inline">Metabolismo Atual</span>
            </button>
          </form>

          {/* ============================================================== */}
          {/* RESULTADOS DO GASTO ATUAL */}
          {/* ============================================================== */}
          {results && (
            <div className="mt-12 md:mt-16 bg-slate-900 text-white p-6 sm:p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] animate-in fade-in slide-in-from-bottom-8 duration-500 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>

              <h2 className="text-2xl md:text-3xl font-black mb-8 md:mb-10 text-center uppercase italic flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-3">
                <CheckCircle2 className="text-emerald-500 w-6 h-6 md:w-8 md:h-8" /> Resultados da Base Atual
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10">
                <div className="bg-slate-800/50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-700 text-center flex flex-col justify-center">
                  <h3 className="text-slate-400 font-bold mb-3 md:mb-4 uppercase tracking-widest text-[10px] md:text-xs">Taxa Metabólica Basal (GEB)</h3>
                  <div className="text-5xl md:text-6xl font-black text-white mb-2">{results.bmr}</div>
                  <span className="text-base md:text-lg text-slate-500 font-medium mb-4 md:mb-6">kcal / dia</span>
                  <p className="text-xs md:text-sm text-slate-400 text-left pt-4 md:pt-6 border-t border-slate-700 font-medium leading-relaxed">
                    A energia exata que o corpo queima parado em repouso absoluto, apenas para manter as funções vitais.
                  </p>
                </div>

                <div className="bg-emerald-900/40 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-emerald-800 text-center flex flex-col justify-center relative mt-4 md:mt-0">
                  <span className="absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white text-[10px] md:text-xs font-black px-4 md:px-6 py-1.5 md:py-2 rounded-full tracking-widest uppercase shadow-lg whitespace-nowrap">Calorias de Manutenção</span>
                  <h3 className="text-emerald-300 font-bold mb-3 md:mb-4 uppercase tracking-widest text-[10px] md:text-xs mt-3 md:mt-4">Gasto Energético Total (GET)</h3>
                  <div className="text-5xl md:text-6xl font-black text-emerald-400 mb-2">{results.tdee}</div>
                  <span className="text-base md:text-lg text-emerald-700 font-medium mb-4 md:mb-6">kcal / dia</span>
                  <p className="text-xs md:text-sm text-emerald-200/80 text-left pt-4 md:pt-6 border-t border-emerald-800 font-medium leading-relaxed">
                    Queima total estimada para o dia. Consumir este valor manterá o peso atual inalterado.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-800 p-5 md:p-6 rounded-2xl text-xs md:text-sm border border-slate-700 gap-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3">
                  <Info className="w-5 h-5 md:w-6 md:h-6 text-emerald-500 flex-shrink-0" />
                  <span className="font-medium text-slate-300">Equação matemática utilizada: <strong className="text-white ml-1 block sm:inline">{results.formulaUsed}</strong></span>
                </div>
                <div className="bg-slate-900 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-emerald-400 font-black text-[10px] md:text-xs uppercase tracking-widest border border-slate-700 flex-shrink-0">
                  Fator de Atividade: x{results.activityFactor}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* PARTE NOVA: SIMULADOR DE MUDANÇA DE ESTILO DE VIDA (NIH PLANNER) */}
        {/* ============================================================== */}
        {results && (
          <div className="bg-white p-6 sm:p-10 md:p-16 rounded-[2rem] md:rounded-[4rem] shadow-2xl border border-blue-100 flex flex-col gap-8 md:gap-12 mt-12 animate-in slide-in-from-bottom-10">
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left space-y-2">
                <span className="inline-block bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                  Body Weight Planner (NIH)
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase italic">
                  Simulador de <span className="text-blue-600">Recomposição</span>
                </h2>
                <p className="text-slate-600 font-medium text-sm md:text-base max-w-2xl">
                  Configure o objetivo abaixo para simular a trajetória real na balança e fracionamento de gordura, considerando a adaptação metabólica.
                </p>
              </div>

              {/* Botão de Controles Avançados */}
              <button 
                onClick={() => setAdvancedControls({...advancedControls, enabled: !advancedControls.enabled})}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${advancedControls.enabled ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                <Settings className="w-4 h-4" /> Controles Avançados {advancedControls.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Painel de Controles Avançados */}
            {advancedControls.enabled && (
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-2">
                <Info className="w-8 h-8 text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Sobrescrever Taxa Metabólica Basal (GEB)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={advancedControls.rmrOverride}
                      onChange={(e) => setAdvancedControls({...advancedControls, rmrOverride: e.target.value})}
                      placeholder={`Estimativa atual: ${results.bmr} kcal`}
                      className="w-full sm:w-64 p-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 outline-none" 
                    />
                    <span className="text-sm font-bold text-slate-500">kcal/dia</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Use esta opção caso tenha os dados exatos de um exame de <strong>Calorimetria Indireta</strong>.</p>
                </div>
              </div>
            )}

            <div className="bg-slate-50 p-6 md:p-10 rounded-[2rem] border border-slate-200">
              
              {/* TABS DE MODO DE SIMULAÇÃO */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 justify-center mb-8 border-b border-slate-200 pb-6">
                <button 
                  onClick={() => setPlannerData({...plannerData, simulationMode: 'target_weight', targetCalories: '', targetBF: '', targetFatLoss: ''})}
                  className={`px-4 py-3 font-black text-[10px] sm:text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all ${plannerData.simulationMode === 'target_weight' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white text-slate-500 border border-slate-200 hover:bg-blue-50'}`}
                >
                  <Target className="w-4 h-4 hidden sm:block"/> Peso Alvo
                </button>
                <button 
                  onClick={() => setPlannerData({...plannerData, simulationMode: 'target_bf', targetCalories: '', targetWeight: '', targetFatLoss: ''})}
                  className={`px-4 py-3 font-black text-[10px] sm:text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all ${plannerData.simulationMode === 'target_bf' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white text-slate-500 border border-slate-200 hover:bg-amber-50'}`}
                >
                  <Droplet className="w-4 h-4 hidden sm:block"/> Meta %GC
                </button>
                <button 
                  onClick={() => setPlannerData({...plannerData, simulationMode: 'target_fat_loss', targetCalories: '', targetWeight: '', targetBF: ''})}
                  className={`px-4 py-3 font-black text-[10px] sm:text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all ${plannerData.simulationMode === 'target_fat_loss' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' : 'bg-white text-slate-500 border border-slate-200 hover:bg-orange-50'}`}
                >
                  <TrendingDown className="w-4 h-4 hidden sm:block"/> Kg Gordura
                </button>
                <button 
                  onClick={() => setPlannerData({...plannerData, simulationMode: 'target_calories', targetWeight: '', targetBF: '', targetFatLoss: ''})}
                  className={`px-4 py-3 font-black text-[10px] sm:text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all ${plannerData.simulationMode === 'target_calories' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-white text-slate-500 border border-slate-200 hover:bg-emerald-50'}`}
                >
                  <Utensils className="w-4 h-4 hidden sm:block"/> Fixar Dieta
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                <div className="space-y-6">
                  {/* ALERTA SE NÃO TIVER BF */}
                  {faltaBF && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex gap-3 items-start animate-in fade-in">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-xs font-bold text-red-800 leading-relaxed">
                        Para simular metas de gordura ou composição corporal, você precisa preencher o <strong>Percentual de Gordura (%)</strong> do paciente lá no Passo 1.
                      </p>
                    </div>
                  )}

                  {/* INPUTS DINÂMICOS */}
                  {!faltaBF && plannerData.simulationMode === 'target_weight' && (
                    <div className="animate-in fade-in">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-600" /> Quero pesar (kg)
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={plannerData.targetWeight} 
                          onChange={(e) => setPlannerData({...plannerData, targetWeight: e.target.value})} 
                          placeholder="Ex: 70" 
                          className="w-full p-4 border-2 border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 font-black text-2xl text-slate-800 outline-none" 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">kg</span>
                      </div>
                    </div>
                  )}

                  {!faltaBF && plannerData.simulationMode === 'target_bf' && (
                    <div className="animate-in fade-in">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-amber-500" /> Meta de Percentual de Gordura
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={plannerData.targetBF} 
                          onChange={(e) => setPlannerData({...plannerData, targetBF: e.target.value})} 
                          placeholder={`Atual: ${formData.bf}%`} 
                          className="w-full p-4 border-2 border-slate-300 rounded-2xl focus:ring-2 focus:ring-amber-500 font-black text-2xl text-slate-800 outline-none" 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%GC</span>
                      </div>
                    </div>
                  )}

                  {!faltaBF && plannerData.simulationMode === 'target_fat_loss' && (
                    <div className="animate-in fade-in">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-orange-600" /> Quantos Kg de gordura quer perder?
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={plannerData.targetFatLoss} 
                          onChange={(e) => setPlannerData({...plannerData, targetFatLoss: e.target.value})} 
                          placeholder={massaGordaAtualKg > 0 ? `Atual: ${massaGordaAtualKg} kg` : "Ex: 5"} 
                          className="w-full p-4 border-2 border-slate-300 rounded-2xl focus:ring-2 focus:ring-orange-500 font-black text-2xl text-slate-800 outline-none" 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">kg</span>
                      </div>
                    </div>
                  )}

                  {!faltaBF && plannerData.simulationMode === 'target_calories' && (
                    <div className="animate-in fade-in">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-emerald-600" /> Prescrição da Dieta Fixa
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={plannerData.targetCalories} 
                          onChange={(e) => setPlannerData({...plannerData, targetCalories: e.target.value})} 
                          placeholder="Ex: 1300" 
                          className="w-full p-4 border-2 border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-black text-2xl text-slate-800 outline-none" 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Kcal / dia</span>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Timer className="w-4 h-4 text-blue-600" /> Em quanto tempo?
                    </label>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <input 
                        type="number" 
                        value={plannerData.timeframeDays} 
                        onChange={(e) => setPlannerData({...plannerData, timeframeDays: e.target.value})} 
                        className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-black text-xl text-slate-800 outline-none text-center" 
                      />
                      <span className="font-bold text-slate-500 uppercase text-xs">Dias</span>
                    </div>

                    <div className="flex gap-2 justify-center flex-wrap mb-4">
                      {[30, 90, 180, 365].map(d => (
                        <button 
                          key={d} 
                          onClick={(e) => { e.preventDefault(); setPlannerData({...plannerData, timeframeDays: d})}} 
                          className={`text-xs px-3 py-1.5 font-bold rounded-lg transition-colors ${plannerData.timeframeDays == d ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'}`}
                        >
                          {d} dias
                        </button>
                      ))}
                    </div>

                    <div className="relative text-center mb-3">
                      <span className="bg-slate-50 px-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Ou selecione uma data</span>
                      <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 z-0"></div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-slate-400" />
                      <input 
                        type="date"
                        value={getFormattedDate(plannerData.timeframeDays)}
                        onChange={handleDateChange}
                        className="w-full p-3 border-2 border-slate-200 rounded-xl text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={runPlanner}
                    disabled={
                      faltaBF ||
                      (plannerData.simulationMode === 'target_weight' && !plannerData.targetWeight) ||
                      (plannerData.simulationMode === 'target_bf' && !plannerData.targetBF) ||
                      (plannerData.simulationMode === 'target_fat_loss' && !plannerData.targetFatLoss) ||
                      (plannerData.simulationMode === 'target_calories' && !plannerData.targetCalories) || 
                      !plannerData.timeframeDays
                    }
                    className="w-full bg-slate-900 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-lg transition-all mt-4"
                  >
                    Processar Simulação Iterativa
                  </button>
                </div>

                {plannerResults ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 h-full flex flex-col justify-center">
                    {plannerWarning && (
                      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-xl flex gap-3 items-start">
                        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        <p className="text-xs font-bold text-orange-800 leading-relaxed">{plannerWarning}</p>
                      </div>
                    )}
                    
                    {plannerData.simulationMode === 'target_calories' ? (
                      <div className="bg-white border-2 border-emerald-100 p-6 rounded-3xl shadow-sm text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">O peso projetado ao final de {plannerData.timeframeDays} dias de dieta será de:</span>
                        <div className="text-5xl font-black text-emerald-600 mt-2 mb-1">{plannerResults.pesoAlcancado}</div>
                        <span className="text-xs font-bold text-slate-500">kg na balança</span>
                      </div>
                    ) : (
                      <div className="bg-white border-2 border-blue-100 p-6 rounded-3xl shadow-sm text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Para bater a meta na fase de mudança, a Dieta deve ser de:</span>
                        <div className="text-5xl font-black text-blue-600 mt-2 mb-1">{plannerResults.caloriasFaseMudanca}</div>
                        <span className="text-xs font-bold text-slate-500">Kcal / dia</span>
                      </div>
                    )}

                    <div className="bg-white border-2 border-slate-100 p-6 rounded-3xl shadow-sm text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Para manter o novo peso ({plannerResults.pesoAlcancado}kg) futuro, a Dieta deve ser:</span>
                      <div className="text-4xl font-black text-slate-800 mt-2 mb-1">{plannerResults.getFuturo}</div>
                      <span className="text-xs font-bold text-slate-500">Kcal / dia</span>
                    </div>

                    {/* PAINEL DE PERDAS FISIOLÓGICAS ESTIMADAS */}
                    {plannerResults.bfFinal !== null && (
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-200">
                        <div className="bg-white border border-slate-200 p-3 rounded-xl text-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Gordura Perdida</span>
                          <span className="text-xl font-black text-amber-500">{plannerResults.massaGordaPerdidaKg}kg</span>
                        </div>
                        <div className="bg-white border border-slate-200 p-3 rounded-xl text-center">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Novo % de Gordura</span>
                          <span className="text-xl font-black text-emerald-600">{plannerResults.bfFinal}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-3xl text-slate-400 min-h-[250px]">
                    <TrendingDown className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-center font-bold text-sm">Configure sua meta ou dieta ao lado para visualizar a predição clínica de recomposição corporal.</p>
                  </div>
                )}

              </div>
            </div>

            {/* GRÁFICO DO BODY WEIGHT PLANNER */}
            {plannerResults && (
              <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-blue-600" /> Curva de Emagrecimento (Trajetória)
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Simulação com reajuste diário contra adaptação metabólica.</p>
                  </div>
                </div>

                <div className="w-full h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={plannerResults.dadosGrafico} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="dia" 
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                        tickLine={false} 
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickFormatter={(val) => `Dia ${val}`}
                        minTickGap={30}
                      />
                      <YAxis 
                        domain={['dataMin - 2', 'dataMax + 2']} 
                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => `${val}kg`}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      
                      <Area 
                        type="monotone" 
                        dataKey="pesoAlto" 
                        stroke="none" 
                        fill="#bae6fd" 
                        fillOpacity={0.4} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="pesoBaixo" 
                        stroke="none" 
                        fill="#ffffff" 
                        fillOpacity={1} 
                      />
                      
                      <Line 
                        type="monotone" 
                        dataKey="pesoEstimado" 
                        stroke="#2563eb" 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center gap-2 justify-center pt-2 flex-wrap">
                  <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-4">Peso Médio Estimado</span>
                  <div className="w-3 h-3 bg-blue-100 rounded-sm border border-blue-200"></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Peso Máximo / Mínimo (Incerteza)</span>
                </div>
              </div>
            )}
            
            {/* BOTÃO DE SALVAR NO BANCO */}
            {avaliacaoAtual && results && (
              <button 
                onClick={handleSalvarNoBanco}
                disabled={salvando}
                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-6 rounded-[2rem] text-xl uppercase tracking-widest shadow-2xl transition-all"
              >
                {salvando ? 'Salvando...' : '💾 Salvar Planejamento na Avaliação'}
              </button>
            )}

          </div>
        )}

      </div>
    </section>
  );
}