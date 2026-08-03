export const ARTIGO_DURNIN_WOMERSLEY_1974 = {
  id: 'durnin-womersley-1974',
  titulo: 'Durnin & Womersley (1974): A Equação Clássica das 4 Dobras Cutâneas',
  subtitulo: 'Entenda a ciência por trás da estimativa da densidade corporal e gordura em diferentes faixas etárias.',
  autores: 'J. V. G. A. Durnin e J. Womersley (University of Glasgow)',
  revista: 'British Journal of Nutrition (Vol. 32, pp. 77-97)',
  doiUrl: 'https://doi.org/10.1079/BJN19740060',
  categoria: 'Artigos e Ciência',
  tipo: 'artigo',
  tempoLeitura: '8 min de leitura',
  capa: '/Imagens/capas/DurninWomersley1974.webp',

  resumoCard: 'Aprenda como o estudo de 1974 revolucionou a avaliação da densidade corporal usando a transformação logarítmica de 4 dobras cutâneas divididas por idade e sexo.',

  conteudoCompleto: {
    introducao: `
      <p className="text-gray-700 leading-relaxed mb-4">
        Publicado em 1974 no <em>British Journal of Nutrition</em> por pesquisadores do Instituto de Fisiologia da Universidade de Glasgow, o estudo de <strong>J. V. G. A. Durnin e J. Womersley</strong> é um marco histórico no cálculo da densidade e gordura corporal por antropometria.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        Os autores avaliaram <strong>481 indivíduos (209 homens e 272 mulheres)</strong> com idades entre 16 e 72 anos, cobrindo uma variação de gordura de 5% a 61% do peso corporal. O grande diferencial foi comparar a espessura das dobras cutâneas com a densidade corporal real obtida por <strong>pesagem hidrostática (subaquática)</strong>.
      </p>
    `,

    aTransformacaoLogaritmica: `
      <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2">
        📐 Por que usar a Soma Logarítmica das Dobras?
      </h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        Durnin & Womersley observaram que a relação entre a espessura das dobras em milímetros e a densidade corporal não é linear em pessoas com maior adiposidade. Nesses indivíduos, aumentos expressivos na espessura da dobra subcutânea geram variações menores na densidade.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        A solução genial dos autores foi aplicar a **transformação logarítmica** [ $\\log_{10}(\\sum 4\\text{ dobras})$ ], tornando a curva de regressão perfeitamente linear em todas as idades.
      </p>

      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
        <h4 className="font-bold text-emerald-900 text-sm mb-2">📌 As 4 Dobras do Protocolo Durnin & Womersley:</h4>
        <ul className="list-disc pl-5 space-y-1 text-emerald-800 text-xs">
          <li><strong>Bíceps:</strong> Ponto médio do braço (face anterior).</li>
          <li><strong>Tríceps:</strong> Ponto médio do braço (face posterior).</li>
          <li><strong>Subescapular:</strong> 1 a 2 cm abaixo do ângulo inferior da escápula (45°).</li>
          <li><strong>Supra-ilíaca:</strong> Acima da crista ilíaca na linha axilar média.</li>
        </ul>
      </div>
    `,

    oEfeitoDaIdadeEDoSexo: `
      <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2">
        👴 Efeito do Sexo e do Envelhecimento na Densidade
      </h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        O estudo demonstrou que, para o mesmo valor de somatório de dobras cutâneas, a densidade corporal diminui progressivamente conforme a idade avança. Isso ocorre por dois motivos fisiológicos centrais:
      </p>
      <ol className="list-decimal pl-5 space-y-3 text-gray-700 mb-6">
        <li><strong>Redistribuição de Gordura:</strong> Com o envelhecimento, uma maior proporção do tecido adiposo total é depositada nas vísceras e cavidades internas, e não no tecido subcutâneo.</li>
        <li><strong>Desmineralização Óssea:</strong> A densidade da Massa Livre de Gordura (FFM) sofre uma leve redução natural com a idade devido à perda gradual de minerais ósseos (especialmente em mulheres pós-menopausa).</li>
      </ol>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
        <h4 className="font-bold text-gray-900 text-sm mb-2">🧮 Equação Geral de Densidade Corporal (BD):</h4>
        <p className="font-mono text-xs text-emerald-700 mb-2"><strong>BD = C - [ M × log10 (Bíceps + Tríceps + Subescapular + Supra-ilíaca) ]</strong></p>
        <p className="text-xs text-gray-600">Onde <strong>C</strong> (intercepto) e <strong>M</strong> (inclinação) variam conforme o sexo e a faixa etária (16-19, 20-29, 30-39, 40-49 e 50+ anos).</p>
      </div>
    `,

 conversaoParaGordura: `
      <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2">
        ⚖️ Conversão de Densidade para % de Gordura (Siri / Brožek)
      </h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        Após obter a densidade corporal (<em>D</em>), converte-se o valor para o percentual de gordura corporal (%GC) utilizando a clássica equação de Siri (1956):
      </p>
      
      <div className="my-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-center font-mono font-bold text-emerald-700 text-sm shadow-inner">
        % Gordura = [ (4,95 / Densidade) - 4,50 ] × 100
      </div>

      <p className="text-gray-700 leading-relaxed mb-4">
        Essa combinação (Durnin & Womersley + Siri) tornou-se um dos protocolos mais replicados no mundo para populações adultas e sedentárias.
      </p>
    `,

    analiticaCritica: `
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 mt-8 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <span className="text-lg">🧐</span>
          <h4 className="text-amber-400 font-bold text-sm uppercase tracking-wider">
            Análise Crítica & Limitações Metodológicas
          </h4>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <p>
            <strong className="text-white">Pontos Fortes:</strong> O estudo foi revolucionário ao introduzir a transformação logarítmica para corrigir a não-linearidade da espessura das dobras cutâneas em sujeitos mais obesos, além de demonstrar que a idade e o sexo alteram drasticamente a relação entre gordura subcutânea e densidade corporal.
          </p>

          <p>
            <strong className="text-white">Limitações do Estudo:</strong> A equação foi construída sobre o modelo bicompartimental de Siri (1956), que assume uma densidade fixa e imutável para a Massa Livre de Gordura (FFM) de 1,100 g/cm³. Em populações com densidade óssea atípica (ex: idosos com osteopenia/osteoporose ou atletas de alto impacto), essa premissa falha, podendo superestimar a gordura corporal.
          </p>

          <p>
            <strong className="text-white">Aplicação Clínica Prática:</strong> É uma equação de excelência para a <strong>população adulta geral sedentária ou moderadamente ativa</strong>. Evite utilizá-la para atletas de elite ou indivíduos com hipertrofia muscular acentuada — nesses casos, utilize o Somatório de Dobras bruto em mm ou equações específicas para atletas.
          </p>
        </div>
      </div>
    `,

    conclusao: `
      <div className="bg-gray-900 text-white rounded-2xl p-6 mt-8 shadow-lg space-y-2">
        <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-wider">🎯 Aplicação Prática no EvaluaOS</h4>
        <p className="text-xs text-gray-300 leading-relaxed">
          O EvaluaOS executa o protocolo de Durnin & Womersley calculando a soma logarítmica exata para cada faixa etária de forma instantânea. Isso garante precisão para pacientes adultos gerais e pessoas de meia-idade no seu consultório!
        </p>
      </div>
    `
  }
}
