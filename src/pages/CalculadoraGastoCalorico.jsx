import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ImagemOtimizada from '../components/ImagemOtimizada';
import { Calculator, Activity, Info, CheckCircle2, User, HeartPulse, AlertTriangle, Settings, Zap, Dumbbell, Timer, Target, TrendingDown, Scale } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, ComposedChart 
} from 'recharts';

const CalculatorImage = "https://raw.githubusercontent.com/nutricaocommarco/nutricaocommarco/main/Imagens/Calculadora-de-Gasto-Calorico.webp";

// Dicionário de METs Expandido para o Modo Avançado
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

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

  // ESTADOS DO SIMULADOR (Body Weight Planner)
  const [plannerData, setPlannerData] = useState({
    targetWeight: '',
    timeframeDays: 90
  });
  const [plannerResults, setPlannerResults] = useState(null);
  const [plannerWarning, setPlannerWarning] = useState('');

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

  // EXTRACTED BMR CALCULATION FOR REUSE IN SIMULATOR
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
      internalFormulaKey: activeFormula // needed for simulator
    });
    setPlannerResults(null); // Reset planner if main calc changes
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    calculateCalories();
  };

  // ==========================================
  // LÓGICA DO BODY WEIGHT PLANNER (SIMULADOR)
  // ==========================================
  const simulateWeightTrajectory = (intake, days, initialWeight, height, age, isMale, bf, pal, formula) => {
    let currentWeight = initialWeight;
    let data = [];
    
    for (let i = 0; i <= days; i++) {
      const uncertainty = (i / days) * 1.5; 
      
      data.push({ 
        dia: i, 
        pesoEstimado: Number(currentWeight.toFixed(1)),
        pesoAlto: Number((currentWeight + uncertainty).toFixed(1)),
        pesoBaixo: Number((currentWeight - uncertainty).toFixed(1))
      });

      // Recalcula o Gasto Dia a Dia (Adaptação Metabólica)
      // Ajuste simplificado: o % de gordura cai/sobe proporcionalmente ao peso para Tinsley/Cunningham
      let currentBf = bf ? (bf * (currentWeight / initialWeight)) : 0; 
      const dailyBMR = getBMR(currentWeight, height, age, isMale, currentBf, formula);
      const dailyTDEE = dailyBMR * pal;
      
      const dailyBalance = dailyTDEE - intake;
      const weightChange = dailyBalance / 7700; // 1 kg = 7700 kcal
      
      currentWeight -= weightChange;
    }
    return { finalWeight: currentWeight, data };
  };

  const runPlanner = () => {
    if (!results) return;

    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height);
    const a = parseInt(formData.age);
    const bf = parseFloat(formData.bf);
    const targetW = parseFloat(plannerData.targetWeight);
    const days = parseInt(plannerData.timeframeDays);
    const pal = parseFloat(results.activityFactor);
    const isMale = formData.gender === 'M';
    const form = results.internalFormulaKey;

    if (!targetW || !days || days <= 0) return;

    const getAtual = results.tdee;
    const bmrFuturo = getBMR(targetW, h, a + (days/365), isMale, bf ? (bf * (targetW/w)) : 0, form);
    const getFuturo = bmrFuturo * pal;

    let minIntake = 500;
    let maxIntake = 6000;
    let requiredIntake = 0;
    let finalChartData = [];
    let achievedWeight = 0;

    for (let iter = 0; iter < 40; iter++) {
      let midIntake = (minIntake + maxIntake) / 2;
      let sim = simulateWeightTrajectory(midIntake, days, w, h, a, isMale, bf, pal, form);
      
      if (sim.finalWeight > targetW) {
        maxIntake = midIntake; 
      } else {
        minIntake = midIntake; 
      }
      requiredIntake = midIntake;
      finalChartData = sim.data;
      achievedWeight = sim.finalWeight;
    }

    let currentWarning = '';
    const safeMin = isMale ? 1200 : 1000;
    let appliedIntake = requiredIntake;

    if (targetW < w && requiredIntake < safeMin) {
      currentWarning = `Objetivo muito agressivo! Para chegar a ${targetW}kg em ${days} dias, você precisaria consumir apenas ${Math.round(requiredIntake)} kcal/dia. A simulação foi ajustada para o limite seguro clínico de ${safeMin} kcal/dia.`;
      appliedIntake = safeMin;
      const safeSim = simulateWeightTrajectory(safeMin, days, w, h, a, isMale, bf, pal, form);
      finalChartData = safeSim.data;
      achievedWeight = safeSim.finalWeight;
    } else if (targetW > w && requiredIntake > getAtual + 1500) {
      currentWarning = `Ganho de peso muito rápido! O consumo sugerido de ${Math.round(requiredIntake)} kcal/dia é muito elevado e pode resultar em alto acúmulo de gordura.`;
    }

    setPlannerWarning(currentWarning);
    setPlannerResults({
      getFuturo: Math.round(getFuturo),
      caloriasFaseMudanca: Math.round(appliedIntake),
      pesoAlcancado: Number(achievedWeight.toFixed(1)),
      dadosGrafico: finalChartData
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs">
          <p className="font-bold mb-2 border-b border-slate-700 pb-1">Dia {label}</p>
          <p className="text-emerald-400">Peso Estimado: <span className="font-bold">{payload[0].value} kg</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="py-16 md:py-24 bg-slate-50 px-4 sm:px-6 container mx-auto max-w-5xl text-left">
      <div className="bg-white p-6 sm:p-10 md:p-16 rounded-[2rem] md:rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col gap-8 md:gap-12">

        <article className="prose prose-base md:prose-lg max-w-none text-left w-full">
          <span className="inline-block bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 md:mb-6">
            Calculadora de Gasto Calórico • Metabolismo
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-6 md:mb-10 uppercase italic leading-tight text-slate-900">
            A Importância de Usar uma <span className="text-green-700">Calculadora de Gasto Calórico</span>
          </h1>

          <div className="space-y-4 md:space-y-6 text-base md:text-lg text-slate-600 font-medium leading-relaxed">
            <p>Se você está se perguntando como calcular meu gasto calórico diário de forma precisa, a resposta mais eficiente e segura é utilizar uma <strong>Calculadora de Gasto Calórico</strong> desenvolvida com base científica rigorosa. Entender exatamente a quantidade de energia que o seu corpo consome todos os dias é o primeiro passo absoluto para qualquer objetivo estético ou de saúde, seja ele emagrecer de forma sustentável, manter o peso atual ou focar no ganho de massa muscular. Muitas pessoas tentam adivinhar a sua taxa metabólica basal ou o seu gasto energético total e acabam frustradas com a falta de resultados práticos na balança ou no espelho por estarem consumindo a quantidade errada de nutrientes.</p>

<figure className="my-12 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 group flex flex-col bg-slate-200">
            <div className="relative w-full aspect-video overflow-hidden bg-slate-100">
              <ImagemOtimizada 
                src={CalculatorImage}
                alt="Mascote Pingus vestido de nutricionista apontando para a Calculadora de Gasto Calórico."
                title="Calculadora de Gasto Calórico e Taxa Metabólica Basal"
                className="absolute inset-0 group-hover:scale-105 transition-transform duration-700"
                priority="high"
              />
            </div>
            <figcaption className="bg-slate-50 p-4 md:p-6 text-center border-t border-slate-200 relative z-10">
              <p className="text-sm md:text-base text-slate-600 font-medium italic text-center m-0 max-w-lg mx-auto">
                Nossa Calculadora de Gasto Calórico analisa o seu perfil físico e nível de atividade para descobrir a sua necessidade energética exata.
              </p>
            </figcaption>
          </figure>



            <p>Noutra perspectiva, a nossa ferramenta age como uma verdadeira <strong>Calculadora de Gasto Calórico</strong> inteligente que se adapta à sua realidade biológica. Ao invés de exigir que você escolha multiplicadores confusos em tabelas genéricas, o nosso sistema cruza os seus dados básicos com o seu nível real de atividade física diária e o seu perfil corporal específico. Com essas informações em mãos, a inteligência da plataforma seleciona automaticamente a equação matemática mais adequada para o seu biotipo, podendo utilizar a fórmula de Mifflin-St Jeor para a população geral e pessoas com sobrepeso, a clássica equação de Harris-Benedict, ou até mesmo os métodos avançados de Cunningham e Tinsley, que são perfeitos para atletas de musculação e fisiculturistas que buscam o máximo de precisão na dieta.</p>

            <p>Descobrir o seu déficit calórico exato para secar ou a sua necessidade energética ideal para hipertrofia nunca foi tão simples, rápido e acessível. Basta preencher os seus dados básicos no formulário da <strong>Calculadora de Gasto Calórico</strong> logo abaixo, informar como é a sua rotina de trabalho e a frequência dos seus treinos semanais, e deixar que o sistema faça toda a matemática complexa por você em questão de segundos. Aproveite esta ferramenta poderosa para estruturar a sua alimentação com inteligência e descubra agora mesmo os números exatos que vão guiar a transformação do seu corpo.</p>
          </div>
        </article>

        <div className="bg-slate-50 rounded-[2rem] md:rounded-[3.5rem] p-5 sm:p-8 md:p-12 border border-slate-200 shadow-inner mt-2 md:mt-4">
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase italic mb-8 md:mb-10 border-b border-green-200 pb-4 flex items-center gap-3">
            <Calculator className="text-green-700 w-6 h-6 md:w-8 md:h-8 flex-shrink-0"/> Calculadora de Gasto Calórico
          </h2>

          <form onSubmit={handleCalculate} className="space-y-10 md:space-y-12">

            {/* ETAPA 1: SOBRE VOCÊ */}
            <section>
              <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase italic mb-5 md:mb-6 flex items-center gap-2">
                <User className="text-green-700 w-5 h-5 md:w-6 md:h-6 flex-shrink-0" /> 1. Sobre Você
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <div>
                  <label htmlFor="gender-select" className="block text-xs md:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Sexo</label>
                  <select id="gender-select" name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-3 md:p-4 border-2 border-slate-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white font-medium text-slate-700 transition-all outline-none">
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="age-input" className="block text-xs md:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Idade (anos)</label>
                  <input id="age-input" type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="Ex: 30" required className="w-full p-3 md:p-4 border-2 border-slate-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white font-medium text-slate-700 transition-all outline-none" />
                </div>
                <div>
                  <label htmlFor="weight-input" className="block text-xs md:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Peso (kg)</label>
                  <input id="weight-input" type="number" step="0.1" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="Ex: 75.5" required className="w-full p-3 md:p-4 border-2 border-slate-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white font-medium text-slate-700 transition-all outline-none" />
                </div>
                <div>
                  <label htmlFor="height-input" className="block text-xs md:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Altura (cm)</label>
                  <input id="height-input" type="number" name="height" value={formData.height} onChange={handleInputChange} placeholder="Ex: 175" required className="w-full p-3 md:p-4 border-2 border-slate-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white font-medium text-slate-700 transition-all outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="bf-input" className="block text-xs md:text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                    Percentual de Gordura (%) <span className="text-slate-500 font-normal normal-case block sm:inline mt-1 sm:mt-0">- Opcional, aumenta muito a precisão</span>
                  </label>
                  <input id="bf-input" type="number" name="bf" value={formData.bf} onChange={handleInputChange} placeholder="Ex: 15" className="w-full p-3 md:p-4 border-2 border-slate-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white font-medium text-slate-700 transition-all outline-none" />
                </div>
              </div>
            </section>

            {/* ETAPA 2: PERFIL FÍSICO */}
            <section>
              <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase italic mb-5 md:mb-6 flex items-center gap-2">
                <Activity className="text-green-700 w-5 h-5 md:w-6 md:h-6 flex-shrink-0" /> 2. Seu Perfil Físico
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {[
                  {id: 'average', label: 'Biotipo Comum / Médio'},
                  {id: 'obese', label: 'Sobrepeso / Obesidade'},
                  {id: 'bodybuilder', label: 'Musculoso / Fisiculturista'},
                  {id: 'endurance', label: 'Atleta Endurance'}
                ].map(item => (
                  <label key={item.id} className={`p-3 md:p-4 border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all flex items-center justify-center text-center ${formData.bodyType === item.id ? 'border-green-600 bg-green-50 text-green-800 shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'}`}>
                    <input type="radio" name="bodyType" value={item.id} checked={formData.bodyType === item.id} onChange={handleInputChange} className="hidden" />
                    <span className="font-bold text-sm md:text-base">{item.label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* ETAPA 3: FATOR DE ATIVIDADE */}
            <section>
              <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase italic mb-5 md:mb-6 flex items-center gap-2">
                <HeartPulse className="text-green-700 w-5 h-5 md:w-6 md:h-6 flex-shrink-0" /> 3. Rotina e Movimento (Nível de Atividade)
              </h3>

              <div className="bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm">

                <div className="flex flex-wrap gap-2 md:gap-4 mb-8 border-b border-slate-100 pb-6">
                  <button type="button" onClick={() => setFormData({...formData, activityCalcMethod: 'auto'})} className={`px-4 py-2.5 rounded-full font-bold text-xs md:text-sm transition-all flex items-center gap-2 ${formData.activityCalcMethod === 'auto' ? 'bg-green-700 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <Zap className="w-4 h-4"/> Automático
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, activityCalcMethod: 'manual'})} className={`px-4 py-2.5 rounded-full font-bold text-xs md:text-sm transition-all flex items-center gap-2 ${formData.activityCalcMethod === 'manual' ? 'bg-green-700 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <Settings className="w-4 h-4"/> Inserir Manual
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, activityCalcMethod: 'mets'})} className={`px-4 py-2.5 rounded-full font-bold text-xs md:text-sm transition-all flex items-center gap-2 ${formData.activityCalcMethod === 'mets' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    <Activity className="w-4 h-4"/> Avançado (METs)
                  </button>
                </div>

                {formData.activityCalcMethod === 'auto' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <div>
                      <label className="block font-bold text-slate-800 mb-3 md:mb-4">Como é a sua rotina de trabalho diária?</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        {[{id: 'sedentary', label: 'Sentado (Escritório)'},
                          {id: 'standing', label: 'Em pé ou caminhando'},
                          {id: 'physical', label: 'Trabalho físico pesado'}].map(item => (
                          <label key={item.id} className={`p-3 md:p-4 border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all ${formData.routine === item.id ? 'border-green-600 bg-green-50 text-green-800' : 'border-slate-200 bg-slate-50 hover:border-slate-300 text-slate-700'}`}>
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
                        {[{id: 'none', label: 'Não faço'},
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
                        {[{id: 'none', label: 'Não faço'},
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
                    <input id="manual-fa-input" type="number" step="0.01" min="1.0" max="2.5" name="manualFA" value={formData.manualFA} onChange={handleInputChange} placeholder="Ex: 1.55" className="w-full md:w-1/2 p-3 md:p-4 border-2 border-slate-200 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white font-medium text-slate-700 transition-all outline-none" />
                    <p className="mt-4 text-sm text-slate-500 leading-relaxed max-w-2xl">
                      <strong>Guia Rápido:</strong> 1.2 (Sedentário) • 1.375 (Leve) • 1.55 (Moderado) • 1.725 (Intenso) • 1.9 a 2.2 (Extremo / Atleta)
                    </p>
                  </div>
                )}

                {formData.activityCalcMethod === 'mets' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-slate-900 text-white p-4 md:p-5 rounded-2xl mb-6 shadow-md border-l-4 border-yellow-400">
                      <p className="text-sm font-medium leading-relaxed">
                        <strong className="text-green-400">Cálculo de Alta Precisão (Diário):</strong> O sistema assumirá que você é sedentário no restante do dia (Fator Base 1.2) e somará as calorias exatas torradas no seu treino baseado no equivalente metabólico da tarefa (MET). <br/><br/>
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
                          <label htmlFor={`minutes-input-${index}`} className="block text-xs font-black text-green-700 mb-2 uppercase tracking-wide">Tempo POR DIA (Minutos)</label>
                          <input 
                            id={`minutes-input-${index}`}
                            type="number" 
                            placeholder="Ex: 60" 
                            value={formData.metActivities[index].minutes} 
                            onChange={(e) => handleMetChange(index, 'minutes', e.target.value)} 
                            className="w-full p-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 bg-white font-medium text-slate-700 transition-all outline-none" 
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
                <CheckCircle2 className="text-green-700 w-5 h-5 md:w-6 md:h-6 flex-shrink-0" /> 4. Seleção da Equação Basal
              </h3>

              <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 mb-6 md:mb-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="calculationMode" value="auto" checked={formData.calculationMode === 'auto'} onChange={handleInputChange} className="w-5 h-5 text-green-700 focus:ring-green-500 accent-green-600 flex-shrink-0" />
                  <span className="font-bold text-slate-800">Modo Automático</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="calculationMode" value="manual" checked={formData.calculationMode === 'manual'} onChange={handleInputChange} className="w-5 h-5 text-green-700 focus:ring-green-500 accent-green-600 flex-shrink-0" />
                  <span className="font-bold text-slate-800">Escolher Manualmente</span>
                </label>
              </div>

              {formData.calculationMode === 'auto' ? (
                <div className="bg-green-50 text-green-900 p-5 md:p-6 rounded-2xl border border-green-200 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 md:gap-4">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0 sm:mt-1 text-green-700" />
                  <p className="text-sm md:text-base font-medium leading-relaxed">
                    <strong>Inteligência Avançada Ativada.</strong> O sistema analisa a relação do seu percentual de gordura com o seu Perfil Físico, filtrando incongruências, para selecionar a equação metabólica mais confiável para o seu biotipo real.
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
                      <label key={formula.id} className={`p-4 md:p-6 border-2 rounded-xl md:rounded-2xl cursor-pointer flex flex-col gap-2 transition-all ${formData.manualFormula === formula.id ? 'border-green-600 bg-green-50 shadow-md' : 'border-slate-200 bg-slate-50 hover:border-green-300'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="manualFormula" value={formula.id} checked={formData.manualFormula === formula.id} onChange={handleInputChange} className="w-5 h-5 text-green-700 focus:ring-green-500 accent-green-600 flex-shrink-0" />
                          <span className="font-black text-slate-900 text-base md:text-lg uppercase italic">{formula.name}</span>
                        </div>
                        <p className="text-xs md:text-sm text-slate-600 pl-8 font-medium leading-relaxed">{formula.desc}</p>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <button type="submit" className="w-full bg-slate-900 hover:bg-green-700 text-white font-black py-5 md:py-6 px-6 md:px-8 rounded-[1.5rem] md:rounded-full shadow-xl transform transition-all hover:-translate-y-1 hover:shadow-2xl text-lg md:text-xl uppercase tracking-widest flex justify-center items-center gap-2 md:gap-3">
              Calcular <span className="hidden sm:inline">Gasto Calórico</span>
            </button>
          </form>

          {results && (
            <div className="mt-12 md:mt-16 bg-slate-900 text-white p-6 sm:p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] animate-in fade-in slide-in-from-bottom-8 duration-500 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-green-600"></div>

              <h2 className="text-2xl md:text-3xl font-black mb-8 md:mb-10 text-center uppercase italic flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-3">
                <CheckCircle2 className="text-green-500 w-6 h-6 md:w-8 md:h-8" /> Seus Resultados Base
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10">
                <div className="bg-slate-800/50 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-700 text-center flex flex-col justify-center">
                  <h3 className="text-slate-400 font-bold mb-3 md:mb-4 uppercase tracking-widest text-[10px] md:text-xs">Taxa Metabólica Basal (TMB)</h3>
                  <div className="text-5xl md:text-6xl font-black text-white mb-2">{results.bmr}</div>
                  <span className="text-base md:text-lg text-slate-500 font-medium mb-4 md:mb-6">kcal / dia</span>
                  <p className="text-xs md:text-sm text-slate-400 text-left pt-4 md:pt-6 border-t border-slate-700 font-medium leading-relaxed">
                    A energia exata que o seu corpo queima parado em repouso absoluto, apenas para manter os órgãos vitais funcionando.
                  </p>
                </div>

                <div className="bg-green-900/40 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-green-800 text-center flex flex-col justify-center relative mt-4 md:mt-0">
                  <span className="absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-[10px] md:text-xs font-black px-4 md:px-6 py-1.5 md:py-2 rounded-full tracking-widest uppercase shadow-lg whitespace-nowrap">Manutenção</span>
                  <h3 className="text-green-300 font-bold mb-3 md:mb-4 uppercase tracking-widest text-[10px] md:text-xs mt-3 md:mt-4">Gasto Energético Total (GET)</h3>
                  <div className="text-5xl md:text-6xl font-black text-green-400 mb-2">{results.tdee}</div>
                  <span className="text-base md:text-lg text-green-700 font-medium mb-4 md:mb-6">kcal / dia</span>
                  <p className="text-xs md:text-sm text-green-200/80 text-left pt-4 md:pt-6 border-t border-green-800 font-medium leading-relaxed">
                    Sua queima total estimada para o dia inteiro. Consuma esse valor para manter o peso atual.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-800 p-5 md:p-6 rounded-2xl text-xs md:text-sm border border-slate-700 gap-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3">
                  <Info className="w-5 h-5 md:w-6 md:h-6 text-green-500 flex-shrink-0" />
                  <span className="font-medium text-slate-300">Equação matemática utilizada: <strong className="text-white ml-1 block sm:inline">{results.formulaUsed}</strong></span>
                </div>
                <div className="bg-slate-900 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-green-400 font-black text-[10px] md:text-xs uppercase tracking-widest border border-slate-700 flex-shrink-0">
                  Fator Fisiológico: x{results.activityFactor}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* PARTE NOVA: SIMULADOR DE MUDANÇA DE ESTILO DE VIDA (NIH PLANNER) */}
        {/* ============================================================== */}
        {results && (
          <div className="bg-white p-6 sm:p-10 md:p-16 rounded-[2rem] md:rounded-[4rem] shadow-2xl border border-blue-100 flex flex-col gap-8 md:gap-12 mt-12">
            
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <span className="inline-block bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                Body Weight Planner (NIH)
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase italic">
                Simulador de <span className="text-blue-600">Adaptação Metabólica</span>
              </h2>
              <p className="text-slate-600 font-medium text-sm md:text-base">
                O corpo humano não é uma máquina matemática linear. Conforme você emagrece, seu Gasto Basal diminui. Informe seu objetivo abaixo para o simulador calcular a caloria exata que você precisa comer para vencer o platô metabólico.
              </p>
            </div>

            <div className="bg-slate-50 p-6 md:p-10 rounded-[2rem] border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" /> Eu quero pesar (Objetivo)
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
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Timer className="w-4 h-4 text-blue-600" /> Em quanto tempo?
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={plannerData.timeframeDays} 
                        onChange={(e) => setPlannerData({...plannerData, timeframeDays: e.target.value})} 
                        placeholder="Ex: 90" 
                        className="w-full p-4 border-2 border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 font-black text-2xl text-slate-800 outline-none" 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Dias</span>
                    </div>
                    <div className="flex gap-2 mt-3 justify-start">
                      {[30, 90, 180].map(d => (
                        <button 
                          key={d} 
                          onClick={() => setPlannerData({...plannerData, timeframeDays: d})} 
                          className={`text-xs px-4 py-1.5 font-bold rounded-lg transition-colors ${plannerData.timeframeDays == d ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'}`}
                        >
                          {d} dias
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={runPlanner}
                    disabled={!plannerData.targetWeight || !plannerData.timeframeDays}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-lg transition-all"
                  >
                    Rodar Simulação
                  </button>
                </div>

                {plannerResults ? (
                  <div className="space-y-6">
                    {plannerWarning && (
                      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-xl flex gap-3 items-start animate-in fade-in">
                        <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                        <p className="text-xs font-bold text-orange-800 leading-relaxed">{plannerWarning}</p>
                      </div>
                    )}
                    
                    <div className="bg-white border-2 border-blue-100 p-6 rounded-3xl shadow-sm text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Para bater a meta no tempo estipulado, consuma:</span>
                      <div className="text-5xl font-black text-blue-600 mt-2 mb-1">{plannerResults.caloriasFaseMudanca}</div>
                      <span className="text-xs font-bold text-slate-500">Kcal / dia</span>
                    </div>

                    <div className="bg-white border-2 border-slate-100 p-6 rounded-3xl shadow-sm text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Para manter o novo peso ({plannerResults.pesoAlcancado}kg) depois, consuma:</span>
                      <div className="text-4xl font-black text-slate-800 mt-2 mb-1">{plannerResults.getFuturo}</div>
                      <span className="text-xs font-bold text-slate-500">Kcal / dia</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-3xl text-slate-400">
                    <TrendingDown className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-center font-bold text-sm">Preencha o peso e o tempo para gerar a curva preditiva.</p>
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
                      <TrendingDown className="w-5 h-5 text-blue-600" /> Curva de Emagrecimento
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Simulação do peso diário até atingir o platô alvo.</p>
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

                <div className="flex items-center gap-2 justify-center pt-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-4">Trajetória do Peso</span>
                  <div className="w-3 h-3 bg-blue-100 rounded-sm border border-blue-200"></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Margem de Erro Fisiológica</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
