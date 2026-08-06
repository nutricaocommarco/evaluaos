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
        <div className="bg-red-50 border-l-4 border-red-500 p-4 md:p-6 rounded-xl flex gap-3 items-start mx-1">
          <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="text-xs md:text-sm font-black text-red-800 uppercase mb-1">Massa Livre de Gordura Necessária</h3>
            <p className="text-[10px] md:text-xs font-bold text-red-700 leading-relaxed">
              Para calcular o teto genético de hipertrofia (FFMI), preencha o <strong>Percentual de Gordura (%)</strong> do paciente no Passo 1 da calculadora.
            </p>
          </div>
        </div>
      ) : hipertrofiaResultados && (
        <div className="space-y-6 md:space-y-8 px-1">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-emerald-100 pb-4">
            <div>
              <h3 className="text-lg md:text-xl font-black text-emerald-800 flex items-center gap-2">💪 Hipertrofia Natural</h3>
              <p className="text-[10px] md:text-xs text-slate-500 mt-1">Predição científica baseada em Lyle McDonald.</p>
            </div>
            <div className="w-full sm:w-56">
              <label className="block text-[9px] md:text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Experiência de Treino</label>
              <select value={nivelTreino} onChange={(e) => setNivelTreino(e.target.value)} className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-900 focus:ring-2 outline-none text-xs md:text-sm">
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
              <p className="text-[10px] md:text-xs font-bold text-amber-800 leading-relaxed">
                Atenção: FFMI Normalizado em {hipertrofiaResultados.ffmiNormalizado}. Próximo ao limite genético biológico. Risco altíssimo de acúmulo de gordura.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {/* CARD 1: GANHOS */}
            <div className="bg-slate-50 p-4 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-3xl border border-slate-200">
              <h4 className="text-xs md:text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 md:mb-6 flex items-center gap-2">
                <TrendingUp className="text-emerald-600 w-4 h-4 md:w-5 md:h-5" /> Ritmo de Ganho de Massa
              </h4>
              
              <div className="space-y-4 md:space-y-6">
                <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-emerald-100 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="block text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base de Partida</span>
                    <span className="text-[10px] md:text-xs font-bold text-slate-600">MLG Atual: {hipertrofiaResultados.mlg} kg</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] md:text-[10px] font-bold text-blue-500 uppercase tracking-widest">FFMI</span>
                    <span className="text-lg md:text-xl font-black text-blue-700">{hipertrofiaResultados.ffmiNormalizado}</span>
                  </div>
                </div>

                <div>
                  <span className="block text-[9px] md:text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Projeção Mensal</span>
                  <div className="text-2xl md:text-3xl font-black text-slate-800">
                    +{hipertrofiaResultados.lyleMes[0]} a {hipertrofiaResultados.lyleMes[1]} <span className="text-[10px] md:text-sm text-slate-500 font-bold">kg / mês</span>
                  </div>
                  <p className="text-[9px] md:text-xs font-medium text-slate-500 mt-1 md:mt-2">
                    Expectativa orgânica ({hipertrofiaResultados.aragonMesPct[0]}% - {hipertrofiaResultados.aragonMesPct[1]}% do peso total).
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <span className="block text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Evolução de MLG em 12 Meses</span>
                  <div className="text-base md:text-lg font-black text-emerald-700">
                    {hipertrofiaResultados.mlgProjetadaAnoLyle[0]} kg a {hipertrofiaResultados.mlgProjetadaAnoLyle[1]} kg
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: MACROS */}
            <div className="bg-emerald-900 text-white p-4 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-3xl border border-emerald-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-emerald-500 rounded-full blur-2xl md:blur-3xl opacity-20"></div>
              
              <h4 className="text-xs md:text-sm font-bold text-emerald-300 uppercase tracking-wider mb-4 md:mb-6 flex items-center gap-2">
                <Target className="w-4 h-4 md:w-5 md:h-5" /> Dieta de Bulking Exata
              </h4>

              <div className="space-y-4 md:space-y-6 relative z-10">
                <div className="text-center bg-emerald-950/50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-emerald-800/50">
                  <span className="block text-[8px] md:text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Prescrição Calórica Diária</span>
                  <div className="text-3xl md:text-4xl font-black text-white">
                    {hipertrofiaResultados.kcalMin} a {hipertrofiaResultados.kcalMax}
                  </div>
                  <span className="text-[10px] md:text-xs text-emerald-300 font-bold">Kcal / dia</span>
                </div>

                <div className="space-y-2 md:space-y-3">
                  <div className="flex justify-between items-center border-b border-emerald-800/50 pb-2">
                    <span className="text-[9px] md:text-[11px] font-bold text-emerald-400 uppercase">Proteína Alvo</span>
                    <span className="text-xs md:text-sm font-black text-white">{hipertrofiaResultados.nutricao.proteina}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-emerald-800/50 pb-2">
                    <span className="text-[9px] md:text-[11px] font-bold text-emerald-400 uppercase">Alvo na Balança</span>
                    <span className="text-xs md:text-sm font-black text-white">+{hipertrofiaResultados.nutricao.alvoPesoSemanal} / sem</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] md:text-[11px] font-bold text-emerald-400 uppercase">Risco Lipídico</span>
                    <span className="text-[10px] md:text-xs font-black text-white text-right">{hipertrofiaResultados.nutricao.particionamento}</span>
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
