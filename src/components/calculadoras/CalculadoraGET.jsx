import React from 'react';
import { Calculator, Activity, HeartPulse, CheckCircle2, User, Info } from 'lucide-react';

export const metOptions = [
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

export const getBMR = (weight, height, age, isMale, bf, activeFormula) => {
  let lbm = weight;
  if (bf && bf > 0) lbm = weight * (1 - (bf / 100));

  switch (activeFormula) {
    case 'mifflin': return isMale ? (10 * weight) + (6.25 * height) - (5 * age) + 5 : (10 * weight) + (6.25 * height) - (5 * age) - 161;
    case 'harris': return isMale ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age) : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    case 'cunningham': return 500 + (22 * lbm);
    case 'tinsley': return (bf && bf > 0) ? (25.9 * lbm + 284) : (24.8 * weight + 10);
    default: return 0;
  }
};

export default function CalculadoraGET({ formData, setFormData, results, setResults, setPlannerResults }) {
  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
    } else if (formData.activityCalcMethod === 'manual') {
      finalFA = parseFloat(formData.manualFA) || 1.2;
      tdee = bmr * finalFA;
    } else if (formData.activityCalcMethod === 'mets') {
      let metCalories = 0;
      formData.metActivities.forEach(act => {
        const metVal = parseFloat(act.met); const mins = parseFloat(act.minutes);
        if (metVal > 0 && mins > 0) metCalories += metVal * weight * (mins / 60);
      });
      tdee = (bmr * 1.2) + metCalories;
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

  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-[1.25rem] sm:rounded-[2rem] md:rounded-[3.5rem] p-3 sm:p-8 md:p-12 border border-slate-200 dark:border-slate-700 shadow-inner">
      <h2 className="text-xl md:text-3xl font-black text-slate-800 dark:text-slate-200 uppercase italic mb-6 md:mb-8 border-b border-primary-200 dark:border-primary-800 pb-3 md:pb-4 flex items-center gap-2 md:gap-3">
        <Calculator className="text-primary-700 dark:text-primary-400 w-5 h-5 md:w-8 md:h-8 flex-shrink-0"/> Calculadora de Gasto Calórico
      </h2>
      
      <form onSubmit={handleCalculate} className="space-y-6 md:space-y-10">
        {/* ETAPA 1 */}
        <section>
          <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-200 uppercase italic mb-4 flex items-center gap-2">
            <User className="text-primary-700 dark:text-primary-400 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /> 1. Parâmetros do Paciente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 px-1">
            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 md:mb-2 uppercase">Sexo</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-2.5 md:p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-900 font-medium outline-none text-sm">
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 md:mb-2 uppercase">Idade (anos)</label>
              <input type="number" name="age" value={formData.age} onChange={handleInputChange} required className="w-full p-2.5 md:p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 md:mb-2 uppercase">Peso (kg)</label>
              <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleInputChange} required className="w-full p-2.5 md:p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
            </div>
            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 md:mb-2 uppercase">Altura (cm)</label>
              <input type="number" name="height" value={formData.height} onChange={handleInputChange} required className="w-full p-2.5 md:p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 md:mb-2 uppercase">% Gordura <span className="text-slate-400 dark:text-slate-400 normal-case block sm:inline mt-0.5 sm:mt-0">- Para hipertrofia e atletas</span></label>
              <input type="number" step="0.1" name="bf" value={formData.bf} onChange={handleInputChange} className="w-full p-2.5 md:p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
            </div>
          </div>
        </section>
        
        {/* ETAPA 2 */}
        <section>
          <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-200 uppercase italic mb-4 flex items-center gap-2">
            <Activity className="text-primary-700 dark:text-primary-400 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /> 2. Perfil Biológico
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 px-1">
            {[
              {id: 'average', label: 'Biotipo Comum'}, 
              {id: 'obese', label: 'Sobrepeso / Obesidade'}, 
              {id: 'bodybuilder', label: 'Musculoso'}, 
              {id: 'endurance', label: 'Atleta Endurance'}
            ].map(item => (
              <label key={item.id} className={`p-2.5 md:p-3 border-2 rounded-xl cursor-pointer text-center text-sm md:text-base ${formData.bodyType === item.id ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 font-bold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-white dark:hover:bg-slate-800'}`}>
                <input type="radio" name="bodyType" value={item.id} checked={formData.bodyType === item.id} onChange={handleInputChange} className="hidden" />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* ETAPA 3 */}
        <section>
          <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-200 uppercase italic mb-4 flex items-center gap-2">
            <HeartPulse className="text-primary-700 dark:text-primary-400 w-4 h-4 md:w-5 h-5 flex-shrink-0" /> 3. Fator de Atividade
          </h3>
          <div className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[1.25rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap gap-2 mb-5 md:mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 md:pb-6">
              <button type="button" onClick={() => setFormData({...formData, activityCalcMethod: 'auto'})} className={`px-3 md:px-4 py-2 rounded-xl font-bold text-[10px] md:text-xs ${formData.activityCalcMethod === 'auto' ? 'bg-primary-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>Automático</button>
              <button type="button" onClick={() => setFormData({...formData, activityCalcMethod: 'manual'})} className={`px-3 md:px-4 py-2 rounded-xl font-bold text-[10px] md:text-xs ${formData.activityCalcMethod === 'manual' ? 'bg-primary-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>Manual</button>
              <button type="button" onClick={() => setFormData({...formData, activityCalcMethod: 'mets'})} className={`px-3 md:px-4 py-2 rounded-xl font-bold text-[10px] md:text-xs ${formData.activityCalcMethod === 'mets' ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>METs</button>
            </div>

            {formData.activityCalcMethod === 'auto' && (
              <div className="space-y-5 md:space-y-6">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 md:mb-3">Rotina de trabalho:</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                    {[
                      {id: 'sedentary', label: 'Sentado'}, 
                      {id: 'standing', label: 'Em pé/Caminhando'}, 
                      {id: 'physical', label: 'Trabalho físico'}
                    ].map(item => (
                      <label key={item.id} className={`p-2.5 md:p-3 border-2 rounded-xl cursor-pointer font-bold text-center text-[11px] md:text-sm ${formData.routine === item.id ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
                        <input type="radio" name="routine" value={item.id} checked={formData.routine === item.id} onChange={handleInputChange} className="hidden" />{item.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 md:mb-3">Horas semanais de CARDIO:</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
                    {[
                      {id: 'none', label: '0h'}, 
                      {id: 'light', label: '1 a 2h'}, 
                      {id: 'moderate', label: '3 a 5h'}, 
                      {id: 'intense', label: '6 a 9h'}, 
                      {id: 'endurance', label: '10h+'}
                    ].map(item => (
                      <label key={`cardio-${item.id}`} className={`p-2.5 border-2 rounded-xl cursor-pointer font-bold text-center text-[10px] md:text-xs ${formData.exerciseCardio === item.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
                        <input type="radio" name="exerciseCardio" value={item.id} checked={formData.exerciseCardio === item.id} onChange={handleInputChange} className="hidden" />{item.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 md:mb-3">Horas semanais de FORÇA:</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                    {[
                      {id: 'none', label: '0h'}, 
                      {id: 'light', label: '1 a 2h'}, 
                      {id: 'moderate', label: '3 a 5h'}, 
                      {id: 'intense', label: '6h+'}
                    ].map(item => (
                      <label key={`str-${item.id}`} className={`p-2.5 border-2 rounded-xl cursor-pointer font-bold text-center text-[10px] md:text-xs ${formData.exerciseStrength === item.id ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
                        <input type="radio" name="exerciseStrength" value={item.id} checked={formData.exerciseStrength === item.id} onChange={handleInputChange} className="hidden" />{item.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {formData.activityCalcMethod === 'manual' && (
              <div>
                <label className="block text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Fator (FA)</label>
                <input type="number" step="0.01" name="manualFA" value={formData.manualFA} onChange={handleInputChange} className="w-full md:w-1/2 p-2.5 md:p-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl outline-none" />
              </div>
            )}
            {formData.activityCalcMethod === 'mets' && (
              <div className="space-y-3 md:space-y-4">
                {[0,1,2,3].map(index => (
                  <div key={index} className="flex gap-2 md:gap-4">
                    <select value={formData.metActivities[index].met} onChange={(e) => handleMetChange(index, 'met', e.target.value)} className="w-2/3 p-2.5 md:p-3 border-2 rounded-xl outline-none text-[10px] md:text-sm">
                      {metOptions.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <input type="number" placeholder="Min" value={formData.metActivities[index].minutes} onChange={(e) => handleMetChange(index, 'minutes', e.target.value)} className="w-1/3 p-2.5 md:p-3 border-2 rounded-xl outline-none text-sm" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ETAPA 4 */}
        <section className="bg-white dark:bg-slate-900 p-4 md:p-8 rounded-[1.25rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-slate-200 uppercase italic mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-primary-700 dark:text-primary-400 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" /> 4. Seleção da Equação
          </h3>
          <div className="flex gap-4 md:gap-6 mb-5 md:mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="calculationMode" value="auto" checked={formData.calculationMode === 'auto'} onChange={handleInputChange} className="w-4 h-4 md:w-5 md:h-5 accent-primary-600" />
              <span className="font-bold text-xs md:text-base">Automática</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="calculationMode" value="manual" checked={formData.calculationMode === 'manual'} onChange={handleInputChange} className="w-4 h-4 md:w-5 md:h-5 accent-primary-600" />
              <span className="font-bold text-xs md:text-base">Manual</span>
            </label>
          </div>
          {formData.calculationMode === 'manual' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {[
                {id: 'mifflin', name: 'Mifflin'}, 
                {id: 'harris', name: 'Harris-Benedict'}, 
                {id: 'cunningham', name: 'Cunningham'}, 
                {id: 'tinsley', name: 'Tinsley'}
              ].map(f => (
                <label key={f.id} className={`p-3 md:p-4 border-2 rounded-xl font-black cursor-pointer text-xs md:text-sm ${formData.manualFormula === f.id ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-700'}`}>
                  <input type="radio" name="manualFormula" value={f.id} checked={formData.manualFormula === f.id} onChange={handleInputChange} className="mr-2 accent-primary-600"/>{f.name}
                </label>
              ))}
            </div>
          )}
        </section>

        <button type="submit" className="w-full bg-slate-900 hover:bg-primary-700 text-white font-black py-4 md:py-5 rounded-[1.25rem] md:rounded-[1.5rem] text-sm md:text-lg uppercase tracking-widest transition-all">
          Processar Metabolismo
        </button>
      </form>

      {/* RESULTADOS DA BASE ATUAL */}
      {results && (
        <div className="mt-8 md:mt-16 bg-slate-900 text-white p-6 sm:p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] animate-in fade-in slide-in-from-bottom-8 duration-500 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600"></div>

          <h2 className="text-2xl md:text-3xl font-black mb-8 md:mb-10 text-center uppercase italic flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-3">
            <CheckCircle2 className="text-primary-500 w-6 h-6 md:w-8 md:h-8" /> Resultados da Base Atual
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10">
            <div className="bg-slate-800/50 dark:bg-slate-800/70 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-700 text-center flex flex-col justify-center">
              <h3 className="text-slate-400 dark:text-slate-400 font-bold mb-3 md:mb-4 uppercase tracking-widest text-[10px] md:text-xs">Taxa Metabólica Basal (GEB)</h3>
              <div className="text-5xl md:text-6xl font-black text-white mb-2">{results.bmr}</div>
              <span className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium mb-4 md:mb-6">kcal / dia</span>
              <p className="text-xs md:text-sm text-slate-400 dark:text-slate-400 text-left pt-4 md:pt-6 border-t border-slate-700 font-medium leading-relaxed">
                A energia exata que o corpo queima parado em repouso absoluto, apenas para manter as funções vitais.
              </p>
            </div>

            <div className="bg-primary-900/40 dark:bg-primary-900/20 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-primary-800 text-center flex flex-col justify-center relative mt-4 md:mt-0">
              <span className="absolute -top-3 md:-top-4 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white text-[10px] md:text-xs font-black px-4 md:px-6 py-1.5 md:py-2 rounded-full tracking-widest uppercase shadow-lg whitespace-nowrap">Calorias de Manutenção</span>
              <h3 className="text-primary-300 font-bold mb-3 md:mb-4 uppercase tracking-widest text-[10px] md:text-xs mt-3 md:mt-4">Gasto Energético Total (GET)</h3>
              <div className="text-5xl md:text-6xl font-black text-primary-400 mb-2">{results.tdee}</div>
              <span className="text-base md:text-lg text-primary-700 dark:text-primary-400 font-medium mb-4 md:mb-6">kcal / dia</span>
              <p className="text-xs md:text-sm text-primary-200/80 text-left pt-4 md:pt-6 border-t border-primary-800 font-medium leading-relaxed">
                Queima total estimada para o dia. Consumir este valor manterá o peso atual inalterado.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-800 p-5 md:p-6 rounded-2xl text-xs md:text-sm border border-slate-700 gap-4 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3">
              <Info className="w-5 h-5 md:w-6 md:h-6 text-primary-500 flex-shrink-0" />
              <span className="font-medium text-slate-300">Equação matemática utilizada: <strong className="text-white ml-1 block sm:inline">{results.formulaUsed}</strong></span>
            </div>
            <div className="bg-slate-900 px-4 md:px-5 py-2 md:py-2.5 rounded-full text-primary-400 font-black text-[10px] md:text-xs uppercase tracking-widest border border-slate-700 flex-shrink-0">
              Fator de Atividade: x{results.activityFactor}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}