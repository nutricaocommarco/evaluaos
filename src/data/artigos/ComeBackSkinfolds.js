export const ARTIGO_COME_BACK_SKINFOLDS = {
  id: 'come-back-skinfolds-2021',
  titulo: 'Come Back Skinfolds, All Is Forgiven: O Resgate Científico das Dobras Cutâneas',
  subtitulo: 'Uma revisão crítica sobre a eficácia dos métodos de composição corporal no esporte de alto rendimento.',
  autores: 'Andreas M. Kasper, Carl Langan-Evans, James P. Morton, Graeme L. Close et al. (2021)',
  revista: 'Nutrients (MDPI)',
  doiUrl: 'https://doi.org/10.3390/nu13041075',
  categoria: 'Artigos e Ciência',
  tipo: 'artigo',
  tempoLeitura: '10 min de leitura',
  capa: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',

  resumoCard: 'Entenda por que o DXA não é o padrão-ouro absoluto que todos pensavam e por que o Somatório de Dobras (ISAK) é a ferramenta mais confiável e imune a erros de hidratação na prática clínica.',

  conteudoCompleto: {
    introducao: `
      <p className="text-gray-700 leading-relaxed mb-4">
        No meio esportivo e clínico, criou-se nos últimos anos a falsa narrativa de que a avaliação de dobras cutâneas com plicômetro (caliper) teria ficado obsoleta com a chegada de tecnologias de imagem avançadas, como a Densitometria Óssea (DXA) e a Bioimpedância (BIA).
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        No entanto, este estudo publicado na prestigiada revista <em>Nutrients</em> faz uma provocação necessária e cientificamente embasada: <strong>"Voltem dobras cutâneas, estão todas perdoadas!"</strong>. Os pesquisadores da Liverpool John Moores University analisaram os bastidores do esporte de elite para demonstrar que o DXA sofre de limitações severas na prática do dia a dia.
      </p>
    `,

    oMitoDoDXA: `
      <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2">
        🚫 O Mito do DXA como "Padrão-Ouro" Inquestionável
      </h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        Embora o DXA seja excelente para avaliar o Conteúdo Mineral Ósseo (BMC) e a assimetria muscular de membros lesionados, ele apresenta grande sensibilidade a fatores biológicos cotidianos do atleta que produzem erros grosseiros de leitura:
      </p>
      <ol className="list-decimal pl-5 space-y-3 text-gray-700 mb-6">
        <li><strong>Glicocênio e Água Muscular:</strong> Uma supercompensação de carboidratos (carbo-loading) aumenta a água intramuscular e faz o DXA registrar um ganho fictício de Massa Magra (LM) de até 2,5%. Se o atleta estiver em depleção de glicocênio, o exame aponta falsa perda muscular.</li>
        <li><strong>Refeições e Hidratação:</strong> Uma simples refeição sólida antes do exame pode alterar o percentual de gordura estimado no DXA em até 2,6%.</li>
        <li><strong>Erros Fisiologicamente Impossíveis:</strong> Em atletas de artes marciais (MMA) e esportes de combate submetidos a perda rápida de peso (desidratação), o DXA registrou flutuações absurdas de massa magra de até 17,5% em apenas 4 dias — uma variação biologicamente impossível.</li>
        <li><strong>Tamanho da Cama do Aparelho:</strong> Atletas muito altos (&gt; 195 cm) ou muito largos (como jogadores de rugby) não cabem perfeitamente na área de varredura. Mudar a posição da cabeça/pés no mesmo dia variou a estimativa de gordura em mais de 3 kg no mesmo indivíduo.</li>
      </ol>
    `,

    aVitoriaDasDobras: `
      <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2">
        📏 Por que as Dobras Cutâneas Vencem na Prática?
      </h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        A medição de dobras cutâneas avalia a espessura da gordura subcutânea diretamente. Ao contrário do DXA e da Bioimpedância, <strong>o plicômetro é praticamente imune a alterações agudas de refeições, uso de suplementos (como creatina) ou estado de hidratação do dia</strong>.
      </p>
      <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-6">
        <li><strong>Confiabilidade Prática:</strong> Quando realizada por um avaliador treinado e certificado (padrão ISAK), a dobra cutânea mede o tecido adiposo com altíssima reprodutibilidade.</li>
        <li><strong>Custo e Portabilidade:</strong> O equipamento é barato, leve, não emite radiação ionizante e pode ser realizado semanalmente na beira do campo, quadra ou consultório.</li>
      </ul>
    `,

    aAlertadaDasEquacoes: `
      <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2">
        ⚠️ A Armadilha do "% de Gordura" e a Solução do Somatório (mm)
      </h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        Um dos alertas mais importantes do estudo é sobre a <strong>conversão das dobras em Percentual de Gordura (%GC)</strong> através de equações matemáticas (ex: Jackson & Pollock, Durnin & Womersley, Withers, etc.).
      </p>
      <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-4">
        <li>Existem mais de 100 equações na literatura, cada uma criada para uma população específica (jovens, idosos, sedentários, atletas de determinado esporte).</li>
        <li>Usar a equação errada no mesmo paciente pode variar o percentual de gordura de 4% para 8% instantaneamente.</li>
        <li>Nenhuma equação foi validada para rastrear mudanças longitudinais frequentes em atletas.</li>
      </ul>

      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
        <h4 className="font-bold text-emerald-900 text-sm mb-2">💡 A Recomendação dos Autores e do EvaluaOS:</h4>
        <p className="text-emerald-800 text-xs leading-relaxed">
          Pare de tentar adivinhar o percentual de gordura relativo via equações para comparar resultados! A melhor conduta científica é utilizar o <strong>Somatório de Dobras Cutâneas em milímetros (ex: Sum das 8 Dobras ISAK - Σ8SF)</strong>. O somatório em mm reflete a evolução real do paciente com absoluta precisão e sem as distorções causadas por fórmulas preditivas.
        </p>
      </div>
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
            <strong className="text-white">Pontos Fortes:</strong> Um dos artigos mais corajosos da nutrição esportiva recente. Ele desmonta a ideia do DXA como "padrão-ouro infalível" ao demonstrar com dados concretos como flutuações cotidianas de glicocênio, hidratação e refeições geram erros gritantes de leitura.
          </p>

          <p>
            <strong className="text-white">Limitações do Estudo:</strong> O foco do artigo é voltado para atletas de alto rendimento sujeitos a variações agudas e extremas de peso/água (ex: lutadores de MMA e jogadores de rugby). Em indivíduos com obesidade grau II ou III em consultório geral, a medição de dobras com plicômetro pode apresentar dificuldade técnica de pinçamento.
          </p>

          <p>
            <strong className="text-white">Aplicação Clínica Prática:</strong> Reforça a diretriz máxima da ISAK: em vez de ficar preso às distorções de porcentagens preditivas relativas (%GC), acompanhe a evolução longitudinal do seu paciente pelo <strong>Somatório de Dobras Cutâneas em milímetros (∑SF)</strong>.
          </p>
        </div>
      </div>
    `,


    conclusaoEPratica: `
      <div className="bg-gray-900 text-white rounded-2xl p-6 mt-8 shadow-lg space-y-2">
        <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-wider">🎯 Aplicação no Consultório e Mensagem Final</h4>
        <p className="text-xs text-gray-300 leading-relaxed">
          Se o seu objetivo no consultório é acompanhar a perda de gordura e o ganho de massa ao longo do tempo em pacientes livres e atletas, <strong>as dobras cutâneas em milímetros são mais confiáveis, práticas e reproduzíveis do que exames caros como o DXA</strong>.
        </p>
        <p className="text-xs text-gray-400 leading-relaxed">
          O DXA deve ser reservado para momentos específicos onde se deseja avaliar a densidade mineral óssea (ex: suspeita de baixa disponibilidade energética / RED-S) ou assimetrias de membros pós-lesão.
        </p>
      </div>
    `
  }
}
