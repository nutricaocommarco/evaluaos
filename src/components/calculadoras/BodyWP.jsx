import React, { useState } from 'react';
import { Settings, Info, AlertTriangle, TrendingDown } from 'lucide-react';
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
      const uncertainty = (i / days) * currentWeight * 0.075; 
      let currentBf = currentWeight > 0 ? (currentFM / currentWeight) * 100 : 0;
      
      data.push({ 
        dia: i, 
        pesoEstimado: Number(currentWeight.toFixed(1)), 
        pesoAlto: Number((currentWeight + uncertainty).toFixed(1)), 
        pesoBaixo: Number((currentWeight - uncertainty).toFixed(1)), 
        bfEstimado: Number(currentBf.toFixed(1)) 
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
      targetW = parseFloat(plannerData.targetWeight); if (!targetW) return;
      for (let iter = 0; iter < 40; iter++) {
        let midIntake = (minIntake + maxIntake) / 2; 
        let sim = simulateWeightTrajectory(midIntake, days, w, h, a, isMale, bf, pal, form, getAtual, rmrOverride);
        if (sim.finalWeight > targetW) maxIntake = midIntake; else minIntake = midIntake; 
        appliedIntake = midIntake; finalChartData = sim.data; achievedWeight = sim.finalWeight; achievedFM = sim.finalFM;
      }
    } else if (mode === 'target_bf') {
      if (!targetBF || !bf) return;
      for (let iter = 0; iter < 40; iter++) {
        let midIntake = (minIntake + maxIntake) / 2; 
        let sim = simulateWeightTrajectory(midIntake, days, w, h, a, isMale, bf, pal, form, getAtual, rmrOverride); 
        let finalBf = (sim.finalFM / sim.finalWeight) * 100;
        if (targetBF < bf) { if (finalBf > targetBF) maxIntake = midIntake; else minIntake = midIntake; } else { if (finalBf < targetBF) minIntake = midIntake; else maxIntake = midIntake; }
        appliedIntake = midIntake; finalChartData = sim.data; achievedWeight = sim.finalWeight; achievedFM = sim.finalFM;
      }
    } else if (mode === 'target_fat_loss') {
      if (!targetFatLoss || !bf) return;
      let initialFM = w * (bf / 100);
      for (let iter = 0; iter < 40; iter++) {
        let midIntake = (minIntake + maxIntake) / 2; 
        let sim = simulateWeightTrajectory(midIntake, days, w, h, a, isMale, bf, pal, form, getAtual, rmrOverride); 
        let fatLost = initialFM - sim.finalFM;
        if (fatLost < targetFatLoss) maxIntake = midIntake; else minIntake = midIntake; 
        appliedIntake = midIntake; finalChartData = sim.data; achievedWeight = sim.finalWeight; achievedFM = sim.finalFM;
      }
    } else {
      appliedIntake = parseFloat(plannerData.targetCalories); if (!appliedIntake) return;
      let sim = simulateWeightTrajectory(appliedIntake, days, w, h, a, isMale, bf, pal, form, getAtual, rmrOverride); 
      finalChartData = sim.data; achievedWeight = sim.finalWeight; achievedFM = sim.finalFM; targetW = achievedWeight;
    }

    let bmrFuturo = rmrOverride ? rmrOverride * (achievedWeight / w) : getBMR(achievedWeight, h, a + (days/365), isMale, bf ? ((achievedFM/achievedWeight)*100) : 0, form);
    const getFuturo = bmrFuturo * pal;

    let currentWarning = ''; 
    const safeMin = isMale ? 1200 : 1000;
    if (mode !== 'target_calories' && appliedIntake < safeMin) {
      currentWarning = `Objetivo agressivo! A predição exigiria ${Math.round(appliedIntake)} kcal/dia. Ajustamos para o limite de ${safeMin} kcal/dia.`;
      appliedIntake = safeMin; 
      const safeSim = simulateWeightTrajectory(safeMin, days, w, h, a, isMale, bf, pal, form, getAtual, rmrOverride); 
      finalChartData = safeSim.data; achievedWeight = safeSim.finalWeight; achievedFM = safeSim.finalFM;
    } else if (mode === 'target_calories' && appliedIntake < safeMin) {
      currentWarning = `Atenção: Dieta de ${appliedIntake} kcal/dia abaixo do limite basal.`;
    }

    let pesoPerdidoKg = 0; let massaGordaPerdidaKg = 0; let bfFinal = null; let bfPerdido = null;
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
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">🔥 Emagrecimento e Recomposição</h3>
        <button onClick={() => setAdvancedControls({...advancedControls, enabled: !advancedControls.enabled})} className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${advancedControls.enabled ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-500 border-slate-200'}`}><Settings className="w-4 h-4 inline-block mr-1" />Avançado {advancedControls.enabled ? 'ON' : 'OFF'}</button>
      </div>

      {advancedControls.enabled && (
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mb-6 flex gap-4"><Info className="w-8 h-8 text-blue-500 flex-shrink-0" /><div><label className="block text-xs font-bold text-slate-700 uppercase mb-2">Sobrescrever GEB (Calorimetria)</label><input type="number" value={advancedControls.rmrOverride} onChange={(e) => setAdvancedControls({...advancedControls, rmrOverride: e.target.value})} placeholder={`Atual: ${results?.bmr || 0} kcal`} className="p-3 border-2 border-blue-200 rounded-xl outline-none" /></div></div>
      )}

      <div className="bg-slate-50 p-6 md:p-10 rounded-[2rem] border border-slate-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 justify-center mb-8 border-b border-slate-200 pb-6">
          <button onClick={() => setPlannerData({...plannerData, simulationMode: 'target_weight'})} className={`px-3 py-3 font-black text-[10px] sm:text-xs uppercase rounded-xl transition-all ${plannerData.simulationMode === 'target_weight' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 border'}`}>Peso Alvo</button>
          <button onClick={() => setPlannerData({...plannerData, simulationMode: 'target_bf'})} className={`px-3 py-3 font-black text-[10px] sm:text-xs uppercase rounded-xl transition-all ${plannerData.simulationMode === 'target_bf' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-slate-500 border'}`}>Meta %GC</button>
          <button onClick={() => setPlannerData({...plannerData, simulationMode: 'target_fat_loss'})} className={`px-3 py-3 font-black text-[10px] sm:text-xs uppercase rounded-xl transition-all ${plannerData.simulationMode === 'target_fat_loss' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-slate-500 border'}`}>Kg Gordura</button>
          <button onClick={() => setPlannerData({...plannerData, simulationMode: 'target_calories'})} className={`px-3 py-3 font-black text-[10px] sm:text-xs uppercase rounded-xl transition-all ${plannerData.simulationMode === 'target_calories' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-500 border'}`}>Fixar Dieta</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            {faltaBF && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex gap-3 items-start"><AlertTriangle className="w-5 h-5 text-red-600" /><p className="text-xs font-bold text-red-800">Preencha o %GC no Passo 1 para simular composição.</p></div>}
            
            {!faltaBF && plannerData.simulationMode === 'target_weight' && (<div><label className="block text-xs font-bold text-slate-600 uppercase mb-2">Quero pesar (kg)</label><input type="number" value={plannerData.targetWeight} onChange={(e) => setPlannerData({...plannerData, targetWeight: e.target.value})} className="w-full p-4 border-2 border-slate-300 rounded-2xl font-black text-2xl outline-none" /></div>)}
            {!faltaBF && plannerData.simulationMode === 'target_bf' && (<div><label className="block text-xs font-bold text-slate-600 uppercase mb-2">Meta de %GC</label><input type="number" value={plannerData.targetBF} onChange={(e) => setPlannerData({...plannerData, targetBF: e.target.value})} className="w-full p-4 border-2 border-slate-300 rounded-2xl font-black text-2xl outline-none" /></div>)}
            {!faltaBF && plannerData.simulationMode === 'target_fat_loss' && (<div><label className="block text-xs font-bold text-slate-600 uppercase mb-2">Kg gordura a perder</label><input type="number" value={plannerData.targetFatLoss} onChange={(e) => setPlannerData({...plannerData, targetFatLoss: e.target.value})} className="w-full p-4 border-2 border-slate-300 rounded-2xl font-black text-2xl outline-none" /></div>)}
            {!faltaBF && plannerData.simulationMode === 'target_calories' && (<div><label className="block text-xs font-bold text-slate-600 uppercase mb-2">Dieta Fixa (kcal)</label><input type="number" value={plannerData.targetCalories} onChange={(e) => setPlannerData({...plannerData, targetCalories: e.target.value})} className="w-full p-4 border-2 border-slate-300 rounded-2xl font-black text-2xl outline-none" /></div>)}

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Em quanto tempo (Dias)?</label>
              <input type="number" value={plannerData.timeframeDays} onChange={(e) => setPlannerData({...plannerData, timeframeDays: e.target.value})} className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-xl text-center outline-none mb-3" />
              <div className="flex gap-2 justify-center flex-wrap">
                {[30, 90, 180, 365].map(d => <button key={d} onClick={(e) => { e.preventDefault(); setPlannerData({...plannerData, timeframeDays: d})}} className={`text-xs px-3 py-1.5 font-bold rounded-lg transition-colors ${plannerData.timeframeDays == d ? 'bg-blue-600 text-white' : 'bg-white border text-slate-600'}`}>{d} dias</button>)}
              </div>
            </div>

            <button onClick={runPlanner} disabled={faltaBF || !plannerData.timeframeDays} className="w-full bg-slate-900 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-lg transition-all mt-4">Simular Trajetória</button>
          </div>

          {plannerResults ? (
            <div className="space-y-6 h-full flex flex-col justify-center">
              {plannerWarning && <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-xl flex gap-3"><AlertTriangle className="w-5 h-5 text-orange-600" /><p className="text-xs font-bold text-orange-800">{plannerWarning}</p></div>}
              
              <div className={`bg-white border-2 p-6 rounded-3xl text-center shadow-sm ${plannerData.simulationMode === 'target_calories' ? 'border-emerald-100' : 'border-blue-100'}`}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{plannerData.simulationMode === 'target_calories' ? 'Peso alcançado após dieta:' : 'Dieta exigida para bater a meta:'}</span>
                <div className={`text-5xl font-black mt-2 mb-1 ${plannerData.simulationMode === 'target_calories' ? 'text-emerald-600' : 'text-blue-600'}`}>{plannerData.simulationMode === 'target_calories' ? plannerResults.pesoAlcancado : plannerResults.caloriasFaseMudanca}</div>
                <span className="text-xs font-bold text-slate-500">{plannerData.simulationMode === 'target_calories' ? 'kg' : 'Kcal / dia'}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-5 rounded-3xl text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nova Dieta de Manutenção (Futuro):</span>
                <div className="text-3xl font-black text-slate-800 mt-1">{plannerResults.getFuturo} <span className="text-sm font-bold text-slate-500">Kcal / dia</span></div>
              </div>

              {plannerResults.bfFinal !== null && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-white border border-slate-200 p-3 rounded-xl text-center"><span className="text-[9px] font-bold text-slate-400 uppercase block">Gordura Perdida</span><span className="text-lg font-black text-amber-500">{plannerResults.massaGordaPerdidaKg}kg</span></div>
                  <div className="bg-white border border-slate-200 p-3 rounded-xl text-center"><span className="text-[9px] font-bold text-slate-400 uppercase block">Novo %GC</span><span className="text-lg font-black text-emerald-600">{plannerResults.bfFinal}%</span></div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 rounded-3xl text-slate-400"><TrendingDown className="w-12 h-12 mb-3 opacity-50" /><p className="text-center font-bold text-sm">Configure a meta ao lado para visualizar a predição.</p></div>
          )}
        </div>
      </div>

      {plannerResults && (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6 mt-8">
          <h3 className="text-lg font-black text-slate-800"><TrendingDown className="w-5 h-5 inline-block text-blue-600 mr-2" /> Curva de Emagrecimento</h3>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={plannerResults.dadosGrafico} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => `Dia ${val}`} minTickGap={30} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => `${val}kg`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="pesoAlto" stroke="none" fill="#bae6fd" fillOpacity={0.4} />
                <Area type="monotone" dataKey="pesoBaixo" stroke="none" fill="#ffffff" fillOpacity={1} />
                <Line type="monotone" dataKey="pesoEstimado" stroke="#2563eb" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
