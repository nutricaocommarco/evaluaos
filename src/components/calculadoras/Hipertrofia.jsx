import React, { useEffect } from 'react';
import { Dumbbell, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { calcularFFMI, projetarGanhosHipertrofia, gerarRecomendacaoNutricional } from '../../utils/motorHipertrofia';

export default function Hipertrofia({ formData, results, nivelTreino, setNivelTreino, hipertrofiaResultados, setHipertrofiaResultados }) {
  
  useEffect(() => {
    if (results) {
      const pesoAtual = parseFloat(formData.weight) || 0;
      const bfAtual = parseFloat(formData.bf) || 0;
      const alturaAtual = parseFloat(formData.height) || 0;
      
      if (pesoAtual > 0 && alturaAtual > 0 && bfAtual > 0) {
        const dadosFFMI = calcularFFMI(pesoAtual, bfAtual, alturaAtual);
        const projecao = projetarGanhosHipertrofia(formData.gender, nivelTreino, pesoAtual, dadosFFMI.mlg);
        const nutricao = gerarRecomendacaoNutricional(nivelTreino);

        const tdeeArredondado = results.tdee;
        const kcalMin = Math.round(tdeeArredondado * (1 + nutricao.superavitNum[0]));
        const kcalMax = Math.round(tdeeArredondado * (1 + nutricao.superavitNum[1]));

        setHipertrofiaResultados({ ...dadosFFMI, ...projecao, nutricao, kcalMin, kcalMax });
      } else {
        setHipertrofiaResultados(null);
      }
    }
  }, [results, nivelTreino, formData.weight, formData.bf, formData.height, formData.gender, setHipertrofiaResultados]);

  const faltaBF = !formData.bf || formData.bf <= 0;

  return (
    <div className="animate-in fade-in duration-300">
      {faltaBF ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl flex gap-4 items-start">
          <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-black text-red-800 uppercase mb-1">Cálculo de Massa Livre de Gordura Impossibilitado</h3>
            <p className="text-xs font-bold text-red-700 leading-relaxed">
              Para calcular a velocidade de hipertrofia muscular e o teto genético de ganhos (FFMI), é estritamente necessário que você preencha o <strong>Percentual de Gordura (%)</strong> do paciente no Passo 1 da calculadora.
            </p>
          </div>
        </div>
      ) : hipertrofiaResultados && (
        <div className="space-y-8">
          
          <div className="flex justify-between items-end border-b border-emerald-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-emerald-800 flex items-center gap-2">💪 Potencial de Hipertrofia Natural</h3>
              <p className="text-xs text-slate-500 mt-1">Predição científica integrada com o Gasto Energético (GET) do paciente.</p>
            </div>
            <div className="w-64">
              <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Idade de Treino (Experiência)</label>
              <select value={nivelTreino} onChange={(e) => setNivelTreino(e.target.value)} className="w-full p-3 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-900 focus:ring-2 outline-none">
                <option value="iniciante">Ano 1 (Novato)</option>
                <option value="intermediario">Ano 2 (Intermediário)</option>
                <option value="avancado">Ano 3 (Avançado)</option>
                <option value="veterano">Ano 4+ (Veterano/Limite)</option>
              </select>
            </div>
          </div>

          {(formData.gender === 'M' && hipertrofiaResultados.ffmiNormalizado >= 24.0) && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-xs font-bold text-amber-800 leading-relaxed">
                Atenção: O FFMI Normalizado do paciente está em {hipertrofiaResultados.ffmiNormalizado}. Valores próximos ou superiores a 25.0 indicam limite genético biológico. Ganhos reais de massa muscular serão extremamente marginais, e o risco de acúmulo de gordura em superávit é total.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* CARD: PROJEÇÃO E RITMO DE GANHO */}
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-200">
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                <TrendingUp className="text-emerald-600 w-5 h-5" /> Ritmo de Ganho de Massa
              </h4>
              
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-2xl border border-emerald-100 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base de Partida</span>
                    <span className="text-xs font-bold text-slate-600">MLG Atual: {hipertrofiaResultados.mlg} kg</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest">FFMI Normalizado</span>
                    <span className="text-xl font-black text-blue-700">{hipertrofiaResultados.ffmiNormalizado}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Projeção Mensal (Lyle McDonald & Aragon)</span>
                  <div className="text-3xl font-black text-slate-800">
                    +{hipertrofiaResultados.lyleMes[0]} a {hipertrofiaResultados.lyleMes[1]} <span className="text-sm text-slate-500 font-bold">kg / mês</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-2">
                    Expectativa de ganho orgânico (equivale a {hipertrofiaResultados.aragonMesPct[0]}% - {hipertrofiaResultados.aragonMesPct[1]}% do peso total).
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Projeção Anual de Massa Magra</span>
                  <div className="text-lg font-black text-emerald-700">
                    Evolução para: {hipertrofiaResultados.mlgProjetadaAnoLyle[0]} kg a {hipertrofiaResultados.mlgProjetadaAnoLyle[1]} kg
                  </div>
                </div>
              </div>
            </div>

            {/* CARD: MACROS E AMBIENTE METABÓLICO INTEGRADO AO BMR */}
            <div className="bg-emerald-900 text-white p-6 md:p-8 rounded-3xl border border-emerald-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
              
              <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Target className="w-5 h-5" /> Dieta de Bulking Exata
              </h4>

              <div className="space-y-6 relative z-10">
                <div className="text-center bg-emerald-950/50 p-5 rounded-2xl border border-emerald-800/50">
                  <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Prescrição Calórica Diária</span>
                  <div className="text-4xl font-black text-white">
                    {hipertrofiaResultados.kcalMin} a {hipertrofiaResultados.kcalMax}
                  </div>
                  <span className="text-xs text-emerald-300 font-bold">Kcal / dia</span>
                  <p className="text-[10px] text-emerald-500 mt-2 leading-relaxed">
                    Calculado aplicando {hipertrofiaResultados.nutricao.superavit} sobre o seu Gasto Energético Total atual ({results?.tdee} kcal).
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-emerald-800/50 pb-2">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase">Proteína Alvo</span>
                    <span className="font-black text-white">{hipertrofiaResultados.nutricao.proteina}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-emerald-800/50 pb-2">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase">Alvo de Peso na Balança</span>
                    <span className="font-black text-white">+{hipertrofiaResultados.nutricao.alvoPesoSemanal} / semana</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase">Risco vs Particionamento</span>
                    <span className="font-black text-white">{hipertrofiaResultados.nutricao.particionamento}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
