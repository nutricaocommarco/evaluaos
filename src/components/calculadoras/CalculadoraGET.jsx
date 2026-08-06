import React from 'react';
import { Calculator, Activity, HeartPulse, CheckCircle2, User } from 'lucide-react';

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
    <div className="bg-slate-50 rounded-[2rem] md:rounded-[3.5rem] p-5 sm:p-8 md:p-12 border border-slate-200 shadow-inner">
      <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase italic mb-8 border-b border-emerald-200 pb-4 flex items-center gap-3">
        <Calculator className="text-emerald-700 w-6 h-6 md:w-8 md:h-8 flex-shrink-0"/> Calculadora de Gasto Calórico
      </h2>
      
      <form onSubmit={handleCalculate} className="space-y-10">
        {/* ETAPA 1 */}
        <section>
          <h3 className="text-lg font-black text-slate-800 uppercase italic mb-5 flex items-center gap-2">
            <User className="text-emerald-700 w-5 h-5 flex-shrink-0" /> 1. Parâmetros do Paciente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Sexo</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white font-medium outline-none">
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Idade (anos)</label>
              <input type="number" name="age" value={formData.age} onChange={handleInputChange} required className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Peso (kg)</label>
              <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleInputChange} required className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">Altura (cm)</label>
              <input type="number" name="height" value={formData.height} onChange={handleInputChange} required className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">% Gordura <span className="text-slate-400 normal-case">- Necessário para cálculos atléticos e hipertrofia</span></label>
              <input type="number" step="0.1" name="bf" value={formData.bf} onChange={handleInputChange} className="w-full p-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>
        </section>
        
        {/* ETAPA 2 */}
        <section>
          <h3 className="text-lg font-black text-slate-800 uppercase italic mb-5 flex items-center gap-2">
            <Activity className="text-emerald-700 w-5 h-5 flex-shrink-0" /> 2. Perfil Biológico
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {id: 'average', label: 'Biotipo Comum'}, 
              {id: 'obese', label: 'Sobrepeso / Obesidade'}, 
              {id: 'bodybuilder', label: 'Musculoso'}, 
              {id: 'endurance', label: 'Atleta Endurance'}
            ].map(item => (
              <label key={item.id} className={`p-3 border-2 rounded-xl cursor-pointer text-center ${formData.bodyType === item.id ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200 text-slate-600 font-bold hover:bg-white'}`}>
                <input type="radio" name="bodyType" value={item.id} checked={formData.bodyType === item.id} onChange={handleInputChange} className="hidden" />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* ETAPA 3 */}
        <section>
          <h3 className="text-lg font-black text-slate-800 uppercase italic mb-5 flex items-center gap-2">
            <HeartPulse className="text-emerald-700 w-5 h-5 flex-shrink-0" /> 3. Fator de Atividade
          </h3>
          <div className="bg-white p-5 md:p-8 rounded-[1.5rem] border border-slate-100 shadow-sm">
            <div className="flex flex-wrap gap-2 md:gap-4 mb-6 border-b border-slate-100 pb-6">
              <button type="button" onClick={() => setFormData({...formData, activityCalcMethod: 'auto'})} className={`px-4 py-2.5 rounded-full font-bold text-xs ${formData.activityCalcMethod === 'auto' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>Automático</button>
              <button type="button" onClick={() => setFormData({...formData, activityCalcMethod: 'manual'})} className={`px-4 py-2.5 rounded-full font-bold text-xs ${formData.activityCalcMethod === 'manual' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'}`}>Manual</button>
              <button type="button" onClick={() => setFormData({...formData, activityCalcMethod: 'mets'})} className={`px-4 py-2.5 rounded-full font-bold text-xs ${formData.activityCalcMethod === 'mets' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>METs</button>
            </div>

            {formData.activityCalcMethod === 'auto' && (
              <div className="space-y-6">
                <div>
                  <label className="block font-bold text-slate-800 mb-3">Rotina de trabalho:</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {id: 'sedentary', label: 'Sentado'}, 
                      {id: 'standing', label: 'Em pé/Caminhando'}, 
                      {id: 'physical', label: 'Trabalho físico'}
                    ].map(item => (
                      <label key={item.id} className={`p-3 border-2 rounded-xl cursor-pointer font-bold text-center text-sm ${formData.routine === item.id ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50'}`}>
                        <input type="radio" name="routine" value={item.id} checked={formData.routine === item.id} onChange={handleInputChange} className="hidden" />{item.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-3">Horas semanais de CARDIO:</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      {id: 'none', label: '0h'}, 
                      {id: 'light', label: '1 a 2h'}, 
                      {id: 'moderate', label: '3 a 5h'}, 
                      {id: 'intense', label: '6 a 9h'}, 
                      {id: 'endurance', label: '10h+'}
                    ].map(item => (
                      <label key={`cardio-${item.id}`} className={`p-3 border-2 rounded-xl cursor-pointer font-bold text-center text-xs ${formData.exerciseCardio === item.id ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 bg-slate-50'}`}>
                        <input type="radio" name="exerciseCardio" value={item.id} checked={formData.exerciseCardio === item.id} onChange={handleInputChange} className="hidden" />{item.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-3">Horas semanais de FORÇA:</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {id: 'none', label: '0h'}, 
                      {id: 'light', label: '1 a 2h'}, 
                      {id: 'moderate', label: '3 a 5h'}, 
                      {id: 'intense', label: '6h+'}
                    ].map(item => (
                      <label key={`str-${item.id}`} className={`p-3 border-2 rounded-xl cursor-pointer font-bold text-center text-xs ${formData.exerciseStrength === item.id ? 'border-orange-500 bg-orange-50 text-orange-800' : 'border-slate-200 bg-slate-50'}`}>
                        <input type="radio" name="exerciseStrength" value={item.id} checked={formData.exerciseStrength === item.id} onChange={handleInputChange} className="hidden" />{item.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {formData.activityCalcMethod === 'manual' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Fator (FA)</label>
                <input type="number" step="0.01" name="manualFA" value={formData.manualFA} onChange={handleInputChange} className="w-full md:w-1/2 p-3 border-2 border-slate-200 rounded-xl outline-none" />
              </div>
            )}
            {formData.activityCalcMethod === 'mets' && (
              <div className="space-y-4">
                {[0,1,2,3].map(index => (
                  <div key={index} className="flex gap-4">
                    <select value={formData.metActivities[index].met} onChange={(e) => handleMetChange(index, 'met', e.target.value)} className="w-2/3 p-3 border-2 rounded-xl outline-none">
                      {metOptions.map(opt => <option key={opt.label} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <input type="number" placeholder="Min" value={formData.metActivities[index].minutes} onChange={(e) => handleMetChange(index, 'minutes', e.target.value)} className="w-1/3 p-3 border-2 rounded-xl outline-none" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ETAPA 4 */}
        <section className="bg-white p-5 md:p-8 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 uppercase italic mb-5 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-700 w-5 h-5 flex-shrink-0" /> 4. Seleção da Equação
          </h3>
          <div className="flex gap-6 mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="calculationMode" value="auto" checked={formData.calculationMode === 'auto'} onChange={handleInputChange} className="w-5 h-5 accent-emerald-600" />
              <span className="font-bold">Automática</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="calculationMode" value="manual" checked={formData.calculationMode === 'manual'} onChange={handleInputChange} className="w-5 h-5 accent-emerald-600" />
              <span className="font-bold">Manual</span>
            </label>
          </div>
          {formData.calculationMode === 'manual' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {id: 'mifflin', name: 'Mifflin'}, 
                {id: 'harris', name: 'Harris-Benedict'}, 
                {id: 'cunningham', name: 'Cunningham'}, 
                {id: 'tinsley', name: 'Tinsley'}
              ].map(f => (
                <label key={f.id} className={`p-4 border-2 rounded-xl font-black cursor-pointer ${formData.manualFormula === f.id ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}>
                  <input type="radio" name="manualFormula" value={f.id} checked={formData.manualFormula === f.id} onChange={handleInputChange} className="mr-3 accent-emerald-600"/>{f.name}
                </label>
              ))}
            </div>
          )}
        </section>

        <button type="submit" className="w-full bg-slate-900 hover:bg-emerald-700 text-white font-black py-5 rounded-[1.5rem] text-lg uppercase tracking-widest transition-all">
          Processar Metabolismo
        </button>
      </form>

      {/* RESULTADOS BÁSICOS */}
      {results && (
        <div className="mt-12 bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
          <h2 className="text-2xl font-black mb-8 text-center uppercase italic flex justify-center items-center gap-2">
            <CheckCircle2 className="text-emerald-500 w-6 h-6"/> Resultados da Base Atual
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-800 p-6 rounded-[1.5rem] border border-slate-700 text-center">
              <h3 className="text-slate-400 font-bold mb-2 uppercase text-[10px]">Taxa Metabólica Basal</h3>
              <div className="text-5xl font-black text-white mb-2">{results.bmr}</div>
              <span className="text-sm text-slate-500 font-medium">kcal / dia</span>
            </div>
            <div className="bg-emerald-900/40 p-6 rounded-[1.5rem] border border-emerald-800 text-center relative">
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black px-4 py-1 rounded-full uppercase">Manutenção Atual</span>
              <h3 className="text-emerald-300 font-bold mb-2 uppercase text-[10px] mt-2">Gasto Energético Total</h3>
              <div className="text-5xl font-black text-emerald-400 mb-2">{results.tdee}</div>
              <span className="text-sm text-emerald-700 font-medium">kcal / dia</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
