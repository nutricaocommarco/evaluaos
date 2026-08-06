import React, { useState } from 'react';
import { Settings, Info, AlertTriangle, TrendingDown, Target, Droplet, Utensils, CalendarDays, Scale, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { getBMR } from './CalculadoraGET';

export default function BodyWP({ formData, results, plannerData, setPlannerData, plannerResults, setPlannerResults, advancedControls, setAdvancedControls }) {
  const [plannerWarning, setPlannerWarning] = useState('');

  const simulateWeightTrajectory = (intake, days, initialWeight, height, age, isMale, bf, pal, formula, baselineTDEE, rmrOverride) => {
    let currentWeight = initialWeight; 
    let initialFM = bf ? initialWeight * (bf / 100) : 0; 
    let currentFM = initialFM; 
    let data = [];
    const metabolicAdaptation = intake < baselineTDEE ? (baselineTDEE - intake) * 0.14 : 0; 
    const energyDensity = 7300; 
    
    for (let i = 0; i <= days; i++) {
      // Incerteza progressiva conforme o BWP original
      const uncertainty = Number(((i / 90) * 2.8).toFixed(1)); 
      const bfUncertainty = Number(((i / 90) * 1.3).toFixed(1));
      let currentBf = currentWeight > 0 ? (currentFM / currentWeight) * 100 : 0;
      
      const pesoAlto = Number((currentWeight + uncertainty).toFixed(1));
      const pesoBaixo = Number((Math.max(30, currentWeight - uncertainty)).toFixed(1));
      const bfAlto = Number((currentBf + bfUncertainty).toFixed(1));
      const bfBaixo = Number((Math.max(3, currentBf - bfUncertainty)).toFixed(1));

      data.push({ 
        dia: i, 
        pesoEstimado: Number(currentWeight.toFixed(1)), 
        pesoAlto, 
        pesoBaixo, 
        bfEstimado: Number(currentBf.toFixed(1)),
        bfAlto,
        bfBaixo
      });

      let dailyBMR = rmrOverride ? rmrOverride * (currentWeight / initialWeight) : getBMR(currentWeight, height, age, isMale, currentBf, formula);
      const theoreticalTDEE = dailyBMR * pal; 
      const actualTDEE = theoreticalTDEE - metabolicAdaptation; 
      const dailyBalance = actualTDEE - intake; 
      const weightChange = dailyBalance / energyDensity; 
      
      currentWeight -= weightChange;
      
      if (weightChange > 0) currentFM -= (weightChange * 0.75); 
      else currentFM -= (weightChange * 0.50); 
      
      if (currentFM < (currentWeight * 0.03)) currentFM = currentWeight * 0.03; 
    }

    const finalUncertainty = Number(((days / 90) * 2.8).toFixed(1));
    const pesoMaximo = Number((currentWeight + finalUncertainty).toFixed(1));
    const pesoMinimo = Number((Math.max(30, currentWeight - finalUncertainty)).toFixed(1));

    return { 
      finalWeight: currentWeight, 
      finalFM: currentFM, 
      pesoMaximo,
      pesoMinimo,
      data 
    };
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
    let simFinal = null;

    if (mode === 'target_weight') {
      targetW = parseFloat(plannerData.targetWeight); if (!targetW) return;
      for (let iter = 0; iter < 40; iter++) {
        let midIntake = (minIntake + maxIntake) / 2; 
        let sim = simulateWeightTrajectory(midIntake, days, w, h, a, isMale, bf, pal, form, getAtual, rmrOverride);
        if (sim.finalWeight > targetW) maxIntake = midIntake; else minIntake = midIntake; 
        appliedIntake = midIntake; 
        finalChartData = sim.data; 
        achievedWeight = sim.finalWeight; 
        achievedFM = sim.finalFM;
        simFinal = sim;
      }
    } else if (mode === 'target_bf') {
      if (!targetBF || !bf) return;
      for (let iter = 0; iter < 40; iter++) {
        let midIntake = (minIntake + maxIntake) / 2; 
        let sim = simulateWeightTrajectory(midIntake, days, w, h, a, isMale, bf, pal, form, getAtual, rmrOverride); 
        let finalBf = (sim.finalFM / sim.finalWeight) * 100;
        if (targetBF < bf) { if (finalBf > targetBF) maxIntake = midIntake; else minIntake = midIntake; } else { if (finalBf < targetBF) minIntake = midIntake; else maxIntake = midIntake; }
        appliedIntake = midIntake; 
        finalChartData = sim.data; 
        achievedWeight = sim.finalWeight; 
        achievedFM = sim.finalFM;
        simFinal = sim;
      }
    } else if (mode === 'target_fat_loss') {
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
        simFinal = sim;
      }
    } else {
      appliedIntake = parseFloat(plannerData.targetCalories); if (!appliedIntake) return;
      let sim = simulateWeightTrajectory(appliedIntake, days, w, h, a, isMale, bf, pal, form, getAtual, rmrOverride); 
      finalChartData = sim.data; 
      achievedWeight = sim.finalWeight; 
      achievedFM = sim.finalFM; 
      targetW = achievedWeight;
      simFinal = sim;
    }

    let bmrFuturo = rmrOverride ? rmrOverride * (achievedWeight / w) : getBMR(achievedWeight, h, a + (days/365), isMale, bf ? ((achievedFM/achievedWeight)*100) : 0, form);
    const getFuturo = bmrFuturo * pal;

    let currentWarning = ''; 
    const safeMin = isMale ? 1200 : 1000;
    if (mode !== 'target_calories' && appliedIntake < safeMin) {
      currentWarning = `Objetivo agressivo! A predição exigiria ${Math.round(appliedIntake)} kcal/dia. Ajustamos para o limite de ${safeMin} kcal/dia.`;
      appliedIntake = safeMin; 
      const safeSim = simulateWeightTrajectory(safeMin, days, w, h, a, isMale, bf, pal, form, getAtual, rmrOverride); 
      finalChartData = safeSim.data; 
      achievedWeight = safeSim.finalWeight; 
      achievedFM = safeSim.finalFM;
      simFinal = safeSim;
    } else if (mode === 'target_calories' && appliedIntake < safeMin) {
      currentWarning = `Atenção: Dieta de ${appliedIntake} kcal/dia abaixo do limite basal.`;
    }

    let pesoPerdidoKg = 0; 
    let massaGordaPerdidaKg = 0; 
    let bfFinal = null; 
    let bfPerdido = null;
    let massaGordaFinalKg = null;
    let massaLivreGorduraFinalKg = null;
    let imcFinal = null;

    if (h > 0 && achievedWeight > 0) {
      const hM = h / 100;
      imcFinal = Number((achievedWeight / (hM * hM)).toFixed(1));
    }

    if (bf && bf > 0) { 
      pesoPerdidoKg = w - achievedWeight; 
      let initialFM = w * (bf / 100); 
      massaGordaPerdidaKg = initialFM - achievedFM; 
      bfFinal = (achievedFM / achievedWeight) * 100; 
      bfPerdido = bf - bfFinal; 
      massaGordaFinalKg = achievedFM;
      massaLivreGorduraFinalKg = achievedWeight - achievedFM;
    } else { 
      pesoPerdidoKg = w - achievedWeight; 
    }

    setPlannerWarning(currentWarning);
    setPlannerResults({ 
      getFuturo: Math.round(getFuturo), 
      caloriasFaseMudanca: Math.round(appliedIntake), 
      pesoAlcancado: Number(achievedWeight.toFixed(1)), 
      pesoMinimo: simFinal ? Number(simFinal.pesoMinimo.toFixed(1)) : Number((achievedWeight * 0.96).toFixed(1)),
      pesoMaximo: simFinal ? Number(simFinal.pesoMaximo.toFixed(1)) : Number((achievedWeight * 1.04).toFixed(1)),
      pesoPerdidoKg: Number(pesoPerdidoKg.toFixed(1)), 
      massaGordaFinalKg: massaGordaFinalKg !== null ? Number(massaGordaFinalKg.toFixed(1)) : null,
      massaLivreGorduraFinalKg: massaLivreGorduraFinalKg !== null ? Number(massaLivreGorduraFinalKg.toFixed(1)) : null,
      massaGordaPerdidaKg: massaGordaPerdidaKg !== 0 ? Number(massaGordaPerdidaKg.toFixed(1)) : null, 
      bfFinal: bfFinal !== null ? Number(bfFinal.toFixed(1)) : null, 
      bfPerdido: bfPerdido !== null ? Number(bfPerdido.toFixed(1)) : null, 
      imcFinal,
      dadosGrafico: finalChartData 
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs space-y-1.5">
          <p className="font-black text-slate-300 border-b border-slate-700 pb-1 flex justify-between gap-4">
            <span>Dia {label}</span>
            <span className="text-emerald-400 font-bold">{data.pesoEstimado} kg</span>
          </p>
          <div className="space-y-0.5 text-[11px]">
            <p className="text-slate-300 font-medium flex justify-between gap-4">
              <span>Faixa Esperada:</span>
              <span className="font-bold text-blue-300">[{data.pesoBaixo} kg a {data.pesoAlto} kg]</span>
            </p>
            {data.bfEstimado > 0 && (
              <p className="text-slate-300 font-medium flex justify-between gap-4 pt-1">
                <span>Gordura Estimada:</span>
                <span className="font-bold text-amber-400">{data.bfEstimado}%</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const precisaBF = plannerData.simulationMode === 'target_bf' || plannerData.simulationMode === 'target_fat_loss';
  const faltaBF = precisaBF && (!formData.bf || formData.bf <= 0);
  const massaGordaAtualKg = formData.weight > 0 && formData.bf > 0 ? (formData.weight * (formData.bf / 100)).toFixed(1) : 0;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-4 md:mb-6 px-1">
        <h3 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2">🔥 Emagrecimento & Recomposição</h3>
        <button onClick={() => setAdvancedControls({...advancedControls, enabled: !advancedControls.enabled})} className={`px-3 py-2 rounded-xl text-[10px] md:text-xs font-bold border transition-all ${advancedControls.enabled ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
          <Settings className="w-3 h-3 md:w-4 md:h-4 inline-block mr-1" />Avançado {advancedControls.enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {advancedControls.enabled && (
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4 md:mb-6 flex gap-3">
          <Info className="w-6 h-6 text-blue-500 flex-shrink-0" />
          <div className="w-full">
            <label className="block text-[10px] md:text-xs font-bold text-slate-700 uppercase mb-2">Sobrescrever GEB (Calorimetria Indireta)</label>
            <input type="number" value={advancedControls.rmrOverride} onChange={(e) => setAdvancedControls({...advancedControls, rmrOverride: e.target.value})} placeholder={`Atual: ${results?.bmr || 0} kcal`} className="w-full sm:w-1/2 p-2.5 border-2 border-blue-200 rounded-xl outline-none text-sm" />
          </div>
        </div>
      )}

      <div className="bg-slate-50 p-3 sm:p-6 md:p-10 rounded-[1.25rem] md:rounded-[2rem] border border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 justify-center mb-6 md:mb-8 border-b border-slate-200 pb-4 md:pb-6">
          <button onClick={() => setPlannerData({...plannerData, simulationMode: 'target_weight'})} className={`px-2 py-3 font-black text-[9px] sm:text-[10px] md:text-xs uppercase rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${plannerData.simulationMode === 'target_weight' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-blue-50'}`}>
            <Target className="w-3 h-3 sm:w-4 sm:h-4"/> Peso Alvo
          </button>
          <button onClick={() => setPlannerData({...plannerData, simulationMode: 'target_bf'})} className={`px-2 py-3 font-black text-[9px] sm:text-[10px] md:text-xs uppercase rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${plannerData.simulationMode === 'target_bf' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-amber-50'}`}>
            <Droplet className="w-3 h-3 sm:w-4 sm:h-4"/> Meta %GC
          </button>
          <button onClick={() => setPlannerData({...plannerData, simulationMode: 'target_fat_loss'})} className={`px-2 py-3 font-black text-[9px] sm:text-[10px] md:text-xs uppercase rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${plannerData.simulationMode === 'target_fat_loss' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-orange-50'}`}>
            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4"/> Kg Gordura
          </button>
          <button onClick={() => setPlannerData({...plannerData, simulationMode: 'target_calories'})} className={`px-2 py-3 font-black text-[9px] sm:text-[10px] md:text-xs uppercase rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${plannerData.simulationMode === 'target_calories' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:bg-emerald-50'}`}>
            <Utensils className="w-3 h-3 sm:w-4 sm:h-4"/> Fixar Dieta
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          <div className="space-y-4 md:space-y-6">
            {faltaBF && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex gap-3 items-start"><AlertTriangle className="w-5 h-5 text-red-600" /><p className="text-[10px] sm:text-xs font-bold text-red-800">Preencha o %GC no Passo 1 para simular composição.</p></div>}
            
            {!faltaBF && plannerData.simulationMode === 'target_weight' && (
              <div className="animate-in fade-in">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] md:text-xs font-bold text-slate-600 uppercase">Quero pesar (kg)</label>
                  <span className="text-[9px] md:text-[10px] font-bold text-blue-700 bg-blue-100/50 border border-blue-200 px-2.5 py-1 rounded-md shadow-sm">Atual: {formData.weight || 0} kg</span>
                </div>
                <input type="number" value={plannerData.targetWeight} onChange={(e) => setPlannerData({...plannerData, targetWeight: e.target.value})} placeholder={`Ex: ${formData.weight ? (formData.weight - 5).toFixed(1) : 70}`} className="w-full p-3 md:p-4 border-2 border-slate-300 rounded-xl md:rounded-2xl font-black text-xl md:text-2xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
              </div>
            )}
            
            {!faltaBF && plannerData.simulationMode === 'target_bf' && (
              <div className="animate-in fade-in">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] md:text-xs font-bold text-slate-600 uppercase">Meta de %GC</label>
                  <span className="text-[9px] md:text-[10px] font-bold text-amber-700 bg-amber-100/50 border border-amber-200 px-2.5 py-1 rounded-md shadow-sm">Atual: {formData.bf || 0}%</span>
                </div>
                <input type="number" value={plannerData.targetBF} onChange={(e) => setPlannerData({...plannerData, targetBF: e.target.value})} placeholder={`Ex: ${formData.bf ? (formData.bf - 2).toFixed(1) : 15}`} className="w-full p-3 md:p-4 border-2 border-slate-300 rounded-xl md:rounded-2xl font-black text-xl md:text-2xl outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all" />
              </div>
            )}
            
            {!faltaBF && plannerData.simulationMode === 'target_fat_loss' && (
              <div className="animate-in fade-in">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] md:text-xs font-bold text-slate-600 uppercase">Kg gordura a perder</label>
                  <span className="text-[9px] md:text-[10px] font-bold text-orange-700 bg-orange-100/50 border border-orange-200 px-2.5 py-1 rounded-md shadow-sm">Atual: {massaGordaAtualKg} kg</span>
                </div>
                <input type="number" value={plannerData.targetFatLoss} placeholder="Ex: 5" onChange={(e) => setPlannerData({...plannerData, targetFatLoss: e.target.value})} className="w-full p-3 md:p-4 border-2 border-slate-300 rounded-xl md:rounded-2xl font-black text-xl md:text-2xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all" />
              </div>
            )}

            {!faltaBF && plannerData.simulationMode === 'target_calories' && (
              <div className="animate-in fade-in">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] md:text-xs font-bold text-slate-600 uppercase">Dieta Fixa (kcal)</label>
                  <span className="text-[9px] md:text-[10px] font-bold text-emerald-700 bg-emerald-100/50 border border-emerald-200 px-2.5 py-1 rounded-md shadow-sm">GET Atual: {results.tdee} kcal</span>
                </div>
                <input type="number" value={plannerData.targetCalories} placeholder={`Ex: ${results.tdee ? results.tdee - 500 : 1500}`} onChange={(e) => setPlannerData({...plannerData, targetCalories: e.target.value})} className="w-full p-3 md:p-4 border-2 border-slate-300 rounded-xl md:rounded-2xl font-black text-xl md:text-2xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all" />
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/60">
              <label className="block text-[10px] md:text-xs font-bold text-slate-600 uppercase mb-2">Em quanto tempo?</label>
              <div className="flex gap-2 mb-3">
                <input type="number" value={plannerData.timeframeDays} onChange={(e) => setPlannerData({...plannerData, timeframeDays: e.target.value})} className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-lg md:text-xl text-center outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" />
              </div>
              <div className="flex gap-2 justify-center flex-wrap mb-3">
                {[30, 90, 180, 365].map(d => <button key={d} onClick={(e) => { e.preventDefault(); setPlannerData({...plannerData, timeframeDays: d})}} className={`text-[10px] md:text-xs px-2.5 md:px-3 py-1.5 font-bold rounded-lg transition-colors ${plannerData.timeframeDays == d ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>{d} dias</button>)}
              </div>
            </div>

            <button onClick={runPlanner} disabled={faltaBF || !plannerData.timeframeDays} className="w-full bg-slate-900 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-xl md:rounded-2xl text-xs md:text-sm uppercase tracking-widest shadow-md transition-all mt-2">
              Processar Simulação Iterativa
            </button>
          </div>

          {/* PAINEL DE RESULTADOS COMPLETO E RECONSTRUÍDO DO BWP */}
          {plannerResults ? (
            <div className="space-y-4 md:space-y-5 h-full flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-500">
              {plannerWarning && <div className="bg-orange-50 border-l-4 border-orange-500 p-3 md:p-4 rounded-xl flex gap-2 md:gap-3"><AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-orange-600 flex-shrink-0" /><p className="text-[10px] md:text-xs font-bold text-orange-800">{plannerWarning}</p></div>}
              
              {/* CARD 1: FAIXA DE PESO ESPERADA (MÍNIMO, MÉDIO E MÁXIMO) */}
              <div className="bg-white border-2 border-blue-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm space-y-3">
                <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">Faixa de Peso Esperada (BWP)</span>
                
                <div className="text-center">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block">Peso Médio Estimado</span>
                  <div className="text-3xl md:text-4xl font-black text-blue-600">{plannerResults.pesoAlcancado} <span className="text-xs font-bold text-slate-400">kg</span></div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-200/60">
                    <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
                      <ArrowDownRight className="w-3 h-3 text-emerald-600" /> Peso Mínimo
                    </span>
                    <span className="text-base md:text-lg font-black text-slate-800">{plannerResults.pesoMinimo} kg</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl text-center border border-slate-200/60">
                    <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-blue-600" /> Peso Máximo
                    </span>
                    <span className="text-base md:text-lg font-black text-slate-800">{plannerResults.pesoMaximo} kg</span>
                  </div>
                </div>
              </div>

              {/* CARD 2: DIETA E MANUTENÇÃO */}
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <div className="bg-blue-50/70 border border-blue-200 p-3 md:p-4 rounded-xl md:rounded-2xl text-center">
                  <span className="text-[8px] md:text-[9px] font-bold text-blue-800 uppercase tracking-widest block mb-1">Dieta Recomendada</span>
                  <span className="text-xl md:text-2xl font-black text-blue-700">{plannerResults.caloriasFaseMudanca}</span>
                  <span className="text-[9px] text-blue-600 font-bold block">Kcal / dia</span>
                </div>
                <div className="bg-slate-100/70 border border-slate-200 p-3 md:p-4 rounded-xl md:rounded-2xl text-center">
                  <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Manutenção Futura</span>
                  <span className="text-xl md:text-2xl font-black text-slate-800">{plannerResults.getFuturo}</span>
                  <span className="text-[9px] text-slate-500 font-bold block">Kcal / dia</span>
                </div>
              </div>

              {/* CARD 3: COMPOSIÇÃO CORPORAL & FRACIONAMENTO BWP */}
              {plannerResults.bfFinal !== null && (
                <div className="bg-white border border-slate-200 p-3 md:p-4 rounded-2xl space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block text-center border-b border-slate-100 pb-1">Composição Corporal Projetada</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl text-center">
                      <span className="text-[8px] md:text-[9px] font-bold text-amber-700 uppercase block">Gordura (Massa Gorda)</span>
                      <span className="text-sm md:text-base font-black text-amber-600">{plannerResults.massaGordaFinalKg} kg</span>
                      {plannerResults.massaGordaPerdidaKg && (
                        <span className="text-[8px] font-bold text-amber-600 block mt-0.5">(-{plannerResults.massaGordaPerdidaKg}kg)</span>
                      )}
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-xl text-center">
                      <span className="text-[8px] md:text-[9px] font-bold text-emerald-700 uppercase block">Massa Livre Gordura</span>
                      <span className="text-sm md:text-base font-black text-emerald-600">{plannerResults.massaLivreGorduraFinalKg} kg</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-slate-50 p-2 rounded-xl text-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase block">Novo %GC</span>
                      <span className="text-xs md:text-sm font-black text-slate-800">{plannerResults.bfFinal}%</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl text-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase block">IMC Estimado</span>
                      <span className="text-xs md:text-sm font-black text-slate-800">{plannerResults.imcFinal || '-'} kg/m²</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 min-h-[200px]"><TrendingDown className="w-8 h-8 md:w-12 md:h-12 mb-2 opacity-50" /><p className="text-center font-bold text-xs md:text-sm">Configure a meta ao lado para predição.</p></div>
          )}
        </div>
      </div>

      {plannerResults && (
        <div className="bg-white p-3 sm:p-6 md:p-8 rounded-[1.25rem] sm:rounded-[2rem] border border-slate-200 shadow-sm space-y-4 md:space-y-6 mt-6 md:mt-8">
          <h3 className="text-base md:text-lg font-black text-slate-800 px-2"><TrendingDown className="w-4 h-4 md:w-5 md:h-5 inline-block text-blue-600 mr-1 md:mr-2" /> Curva de Emagrecimento (Trajetória)</h3>
          <div className="w-full h-[250px] md:h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={plannerResults.dadosGrafico} margin={{ top: 20, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => `Dia ${val}`} minTickGap={20} tickLine={false} axisLine={false} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => `${val}kg`} tickLine={false} axisLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="pesoAlto" stroke="none" fill="#bae6fd" fillOpacity={0.4} />
                <Area type="monotone" dataKey="pesoBaixo" stroke="none" fill="#ffffff" fillOpacity={1} />
                <Line type="monotone" dataKey="pesoEstimado" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}