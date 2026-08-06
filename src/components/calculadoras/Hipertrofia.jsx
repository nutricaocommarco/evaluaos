import React, { useState, useEffect } from 'react';
import { Dumbbell, TrendingUp, AlertTriangle, Target, Info, ChevronRight, Settings2 } from 'lucide-react';
import { calcularFFMI, projetarGanhosHipertrofia, gerarRecomendacaoNutricional } from '../../utils/motorHipertrofia';

export default function Hipertrofia({ formData, results, nivelTreino, setNivelTreino, hipertrofiaResultados, setHipertrofiaResultados }) {
  
  // Controle local para o Ajuste Calórico Fino
  const [ajusteCalorico, setAjusteCalorico] = useState(0); // -10, -5, 0, 5, 10
  const [abaTabelaLyle, setAbaTabelaLyle] = useState('M'); // 'M' ou 'F'

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

        // Seta o sexo da tabela automaticamente de acordo com o paciente
        setAbaTabelaLyle(formData.gender);

        setHipertrofiaResultados({ ...dadosFFMI, ...projecao, nutricao, kcalMin, kcalMax });
      } else {
        setHipertrofiaResultados(null);
      }
    }
  }, [results, nivelTreino, formData.weight, formData.bf, formData.height, formData.gender, setHipertrofiaResultados]);

  const faltaBF = !formData.bf || formData.bf <= 0;

  // Renderizador da Tabela de Estimativas
  const renderTabelaLyle = () => {
    const isM = abaTabelaLyle === 'M';
    return (
      <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-700">
        <div className="p-4 md:p-6 pb-0">
          <h4 className="text-white font-black text-sm uppercase tracking-wider">Estimativas de Lyle Mcdonald</h4>
          <p className="text-slate-400 text-[10px] md:text-xs">Massa muscular · boa genética + treino/dieta adequados</p>
        </div>
        
        <div className="flex bg-slate-800 m-4 md:m-6 p-1 rounded-xl">
          <button 
            onClick={(e) => { e.preventDefault(); setAbaTabelaLyle('M'); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${isM ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Homens
          </button>
          <button 
            onClick={(e) => { e.preventDefault(); setAbaTabelaLyle('F'); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${!isM ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Mulheres
          </button>
        </div>

        <div className="bg-slate-50 px-4 md:px-6 py-4">
          <div className="grid grid-cols-3 text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            <div>Treino Adequado</div>
            <div className="text-center">Músculo / Ano</div>
            <div className="text-right">Por Mês</div>
          </div>

          <div className="space-y-1">
            {/* Ano 1 */}
            <div className={`grid grid-cols-3 items-center p-3 rounded-xl transition-colors ${nivelTreino === 'iniciante' ? 'bg-emerald-100/50 border border-emerald-200' : 'hover:bg-slate-100'}`}>
              <div className="font-black text-slate-800 text-xs md:text-sm">Ano 1</div>
              <div className="text-center font-black text-emerald-700 text-sm md:text-base">{isM ? '9,0 - 11,3 kg' : '4,5 - 5,4 kg'}</div>
              <div className="text-right font-medium text-slate-500 text-xs md:text-sm">{isM ? '~0,85 kg/mês' : '~0,41 kg/mês'}</div>
            </div>
            {/* Ano 2 */}
            <div className={`grid grid-cols-3 items-center p-3 rounded-xl transition-colors ${nivelTreino === 'intermediario' ? 'bg-emerald-100/50 border border-emerald-200' : 'hover:bg-slate-100'}`}>
              <div className="font-black text-slate-800 text-xs md:text-sm">Ano 2</div>
              <div className="text-center font-black text-emerald-700 text-sm md:text-base">{isM ? '4,5 - 5,4 kg' : '2,2 - 2,7 kg'}</div>
              <div className="text-right font-medium text-slate-500 text-xs md:text-sm">{isM ? '~0,41 kg/mês' : '~0,21 kg/mês'}</div>
            </div>
            {/* Ano 3 */}
            <div className={`grid grid-cols-3 items-center p-3 rounded-xl transition-colors ${nivelTreino === 'avancado' ? 'bg-emerald-100/50 border border-emerald-200' : 'hover:bg-slate-100'}`}>
              <div className="font-black text-slate-800 text-xs md:text-sm">Ano 3</div>
              <div className="text-center font-black text-emerald-700 text-sm md:text-base">{isM ? '2,3 - 2,7 kg' : '1,1 - 1,4 kg'}</div>
              <div className="text-right font-medium text-slate-500 text-xs md:text-sm">{isM ? '~0,21 kg/mês' : '~0,11 kg/mês'}</div>
            </div>
            {/* Ano 4+ */}
            <div className={`grid grid-cols-3 items-center p-3 rounded-xl transition-colors ${nivelTreino === 'veterano' ? 'bg-emerald-100/50 border border-emerald-200' : 'hover:bg-slate-100'}`}>
              <div className="font-black text-slate-800 text-xs md:text-sm">Ano 4+</div>
              <div className="text-center font-black text-emerald-700 text-sm md:text-base">{isM ? '1,1 - 1,4 kg' : '0,4 - 0,7 kg'}</div>
              <div className="text-right font-medium text-slate-500 text-[10px] md:text-xs">ganho muito lento</div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200">
             <p className="text-[10px] text-slate-400 leading-relaxed text-justify">
               Observação de praticantes avançados (não estudo controlado). Massa muscular em indivíduos com boa genética; tendem a sobrestimar a média populacional. A linha do ano selecionado guia a sua meta.
             </p>
          </div>
        </div>
      </div>
    );
  };

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
              <p className="text-[10px] md:text-xs text-slate-500 mt-1">Predição científica baseada na Fisiologia e no método de Lyle McDonald.</p>
            </div>
            <div className="w-full sm:w-56">
              <label className="block text-[9px] md:text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Experiência de Treino</label>
              <select value={nivelTreino} onChange={(e) => setNivelTreino(e.target.value)} className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl font-bold text-emerald-900 focus:ring-2 outline-none text-xs md:text-sm cursor-pointer hover:bg-emerald-100 transition-colors">
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

          {/* GRID PRINCIPAL: TABELA LYLE X PRESCRIÇÃO CALÓRICA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            
            {/* LADO ESQUERDO: TABELA DE LYLE MCDONALD */}
            <div className="space-y-4">
              {renderTabelaLyle()}
              
              <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-200 flex justify-between items-center shadow-sm">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Base Preditiva</span>
                  <span className="text-xs font-bold text-slate-600">MLG Atual do Paciente</span>
                </div>
                <div className="text-right">
                  <span className="text-xl md:text-2xl font-black text-slate-800">{hipertrofiaResultados.mlg} <span className="text-sm text-slate-400 font-bold">kg</span></span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 md:p-5 rounded-3xl border border-blue-100 flex justify-between items-center shadow-sm">
                <div>
                  <span className="block text-[9px] font-bold text-blue-500 uppercase tracking-widest">Potencial Atual</span>
                  <span className="text-xs font-bold text-blue-800">Teto Genético (FFMI Normalizado)</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-700">{hipertrofiaResultados.ffmiNormalizado}</span>
                </div>
              </div>
            </div>

            {/* LADO DIREITO: CÁLCULOS E AJUSTE FINO */}
            <div className="space-y-6">
              
              {/* CARD: MACROS */}
              <div className="bg-emerald-900 text-white p-5 sm:p-6 md:p-8 rounded-[1.5rem] md:rounded-3xl border border-emerald-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-emerald-500 rounded-full blur-2xl md:blur-3xl opacity-20"></div>
                
                <h4 className="text-xs md:text-sm font-bold text-emerald-300 uppercase tracking-wider mb-4 md:mb-6 flex items-center gap-2">
                  <Target className="w-4 h-4 md:w-5 md:h-5" /> Dieta de Bulking Base
                </h4>

                <div className="space-y-4 relative z-10">
                  <div className="text-center bg-emerald-950/50 p-4 md:p-5 rounded-xl md:rounded-2xl border border-emerald-800/50">
                    <span className="block text-[8px] md:text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Prescrição Calórica Diária (Média)</span>
                    <div className="text-4xl md:text-5xl font-black text-white drop-shadow-md">
                      {Math.round((hipertrofiaResultados.kcalMin + hipertrofiaResultados.kcalMax) / 2)}
                    </div>
                    <span className="text-[10px] md:text-xs text-emerald-300 font-bold">Kcal / dia</span>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <div className="flex justify-between items-center border-b border-emerald-800/50 pb-2">
                      <span className="text-[9px] md:text-[11px] font-bold text-emerald-400 uppercase">Proteína Alvo</span>
                      <span className="text-xs md:text-sm font-black text-white">{hipertrofiaResultados.nutricao.proteina}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-emerald-800/50 pb-2">
                      <span className="text-[9px] md:text-[11px] font-bold text-emerald-400 uppercase">Superávit Aplicado no GET</span>
                      <span className="text-xs md:text-sm font-black text-white">{hipertrofiaResultados.nutricao.superavit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] md:text-[11px] font-bold text-emerald-400 uppercase">Alvo na Balança</span>
                      <span className="text-[10px] md:text-xs font-black text-white text-right">+{hipertrofiaResultados.nutricao.alvoPesoSemanal} / sem</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CALCULADORA DE AJUSTE CALÓRICO */}
              <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-emerald-600" /> Calculadora de Ajuste Calórico
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed mb-5">
                  Quando a indicação de ajuste estiver fundamentada (treino estagnado com boa aderência), selecione a nova estratégia a partir da base atual. Mantenha o novo valor por 4-6 semanas antes de reavaliar.
                </p>

                <div className="space-y-2 text-xs md:text-sm font-medium">
                  {/* -10% */}
                  <div 
                    onClick={() => setAjusteCalorico(-10)}
                    className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-colors border ${ajusteCalorico === -10 ? 'bg-red-50 border-red-200 text-red-900 font-bold' : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span>Reduzir superávit • -10%</span>
                    <span className="font-bold">{Math.round(((hipertrofiaResultados.kcalMin + hipertrofiaResultados.kcalMax) / 2) * 0.90)} kcal</span>
                  </div>

                  {/* -5% */}
                  <div 
                    onClick={() => setAjusteCalorico(-5)}
                    className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-colors border ${ajusteCalorico === -5 ? 'bg-orange-50 border-orange-200 text-orange-900 font-bold' : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span>Reduzir superávit • -5%</span>
                    <span className="font-bold">{Math.round(((hipertrofiaResultados.kcalMin + hipertrofiaResultados.kcalMax) / 2) * 0.95)} kcal</span>
                  </div>

                  {/* VALOR ATUAL (0%) */}
                  <div 
                    onClick={() => setAjusteCalorico(0)}
                    className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-colors border ${ajusteCalorico === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold shadow-sm' : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="flex items-center gap-2">Valor atual {ajusteCalorico === 0 && <ChevronRight className="w-4 h-4 text-emerald-500" />}</span>
                    <span className="font-black text-emerald-700">{Math.round((hipertrofiaResultados.kcalMin + hipertrofiaResultados.kcalMax) / 2)} kcal</span>
                  </div>

                  {/* +5% */}
                  <div 
                    onClick={() => setAjusteCalorico(5)}
                    className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-colors border ${ajusteCalorico === 5 ? 'bg-teal-50 border-teal-200 text-teal-900 font-bold' : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span>Aumentar • +5%</span>
                    <span className="font-bold">{Math.round(((hipertrofiaResultados.kcalMin + hipertrofiaResultados.kcalMax) / 2) * 1.05)} kcal</span>
                  </div>

                  {/* +10% */}
                  <div 
                    onClick={() => setAjusteCalorico(10)}
                    className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-colors border ${ajusteCalorico === 10 ? 'bg-blue-50 border-blue-200 text-blue-900 font-bold' : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span>Aumentar • +10%</span>
                    <span className="font-bold">{Math.round(((hipertrofiaResultados.kcalMin + hipertrofiaResultados.kcalMax) / 2) * 1.10)} kcal</span>
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