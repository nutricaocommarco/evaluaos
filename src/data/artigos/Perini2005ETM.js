export const ARTIGO_PERINI_2005_ETM = {
  id: 'perini-2005-etm',
  titulo: 'Cálculo do Erro Técnico de Medição (ETM) em Antropometria: O Guia Definitivo',
  subtitulo: 'Aprenda a controlar a qualidade das suas medições e garantir a precisão dos laudos segundo os padrões ISAK.',
  autores: 'Talita Adão Perini, Glauber Lameira de Oliveira, Juliana dos Santos Ornellas e Fátima Palha de Oliveira (2005)',
  revista: 'Revista Brasileira de Medicina do Esporte (Labofise - UFRJ)',
  doiUrl: 'https://doi.org/10.1590/S1517-86922005000100009',
  categoria: 'Antropometria',
  tipo: 'artigo',
  tempoLeitura: '8 min de leitura',
  capa: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
  
  resumoCard: 'Entenda como calcular o ETM intra e interavaliador para garantir que as mudanças na composição corporal do paciente sejam reais e não erros da técnica.',

  conteudoCompleto: {
    introducao: `
      <p className="text-gray-700 leading-relaxed mb-4">
        As medidas antropométricas são amplamente utilizadas para monitorar a composição corporal, avaliar a resposta adaptativa ao treinamento e caracterizar o estado nutricional. No entanto, no ato de repetir uma medição, podem ocorrer variações biológicas e variações técnicas da própria medição.
      </p>
      <p className="text-gray-700 leading-relaxed mb-4">
        Para garantir dados confiáveis e controlar a qualidade do avaliador, este estudo clássico do Laboratório de Fisiologia do Exercício (Labofise/UFRJ) difunde a estratégia do <strong>Erro Técnico de Medição (ETM)</strong> segundo os padrões internacionais da <em>International Society for Advancement in Kinanthropometry (ISAK)</em> e a metodologia de Kevin Norton & Tim Olds.
      </p>
    `,

    oQueEETM: `
      <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2">
        📏 O que é o Erro Técnico de Medição (ETM)?
      </h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        O ETM é um índice de precisão que representa o desvio-padrão entre medidas repetidas. Ele mede o grau de variabilidade e o controle de qualidade do antropometrista:
      </p>
      <ul className="list-disc pl-5 space-y-2 text-gray-700 mb-6">
        <li><strong>ETM Intra-avaliador:</strong> Analisa a variação das medidas repetidas em uma mesma pessoa (ou grupo) feitas pelo <strong>mesmo</strong> avaliador em momentos/dias diferentes.</li>
        <li><strong>ETM Interavaliador:</strong> Analisa a variação das medidas feitas por <strong>diferentes</strong> avaliadores no mesmo grupo de pessoas. É indispensável em clínicas, academias ou clubes onde mais de um profissional avalia os alunos.</li>
      </ul>

      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
        <h4 className="font-bold text-emerald-900 text-sm mb-2">🎯 Padrões de Tolerância (Cortes Aceitáveis da ISAK):</h4>
        <ul className="list-disc pl-5 space-y-1 text-emerald-800 text-xs">
          <li><strong>Iniciantes / Estagiários:</strong> ETM até <strong>7,5%</strong> para dobras cutâneas e <strong>1,5%</strong> para outras medidas (perímetros/diâmetros).</li>
          <li><strong>Experientes / Certificados:</strong> ETM até <strong>5,0%</strong> para dobras cutâneas e <strong>1,0%</strong> para outras medidas.</li>
        </ul>
      </div>
    `,

    passoAPassoCalculo: `
      <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2">
        🧮 Como Calcular o ETM na Prática (Método das Diferenças)
      </h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        O cálculo do ETM absoluto e relativo envolve 4 etapas simples:
      </p>
      <ol className="list-decimal pl-5 space-y-3 text-gray-700 mb-6">
        <li><strong>Obter as diferenças (d):</strong> Calcule a diferença entre a 1ª e a 2ª medição de cada ponto em pelo menos 20 voluntários.</li>
        <li><strong>Elevar ao quadrado (d²):</strong> Eleve cada diferença individual ao quadrado.</li>
        <li>
          <strong>ETM Absoluto:</strong> Aplique a fórmula da raiz do somatório dos quadrados dividido por duas vezes o número de sujeitos (n):
          <div className="my-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-center font-mono font-bold text-emerald-700 text-sm shadow-inner">
            ETM Absoluto = √ ( Σ d² / 2n )
          </div>
        </li>
        <li>
          <strong>ETM Relativo (%):</strong> Divida o ETM absoluto pelo <strong>Valor Médio da Variável (VMV)</strong> e multiplique por 100:
          <div className="my-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-center font-mono font-bold text-emerald-700 text-sm shadow-inner">
            ETM Relativo (%) = ( ETM Absoluto / VMV ) × 100
          </div>
        </li>
      </ol>
    `,

    ondeOcorreOMaiorErro: `
      <h3 className="text-lg font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2">
        ⚠️ Locais de Maior Erro e Dicas Práticas
      </h3>
      <p className="text-gray-700 leading-relaxed mb-4">
        O estudo apontou que dobras cutâneas em regiões de <strong>maior acúmulo de gordura (como abdômen, supra-ilíaca e coxa)</strong> apresentam maior variação do ETM.
      </p>
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
        <h4 className="font-bold text-amber-900 text-sm mb-2">💡 Recomendações do Estudo para Reduzir o Erro:</h4>
        <ul className="list-disc pl-5 space-y-2 text-amber-800 text-xs">
          <li><strong>Localização Anatômica Precisa:</strong> A marcação correta dos pontos de referência anatômica com lápis dermográfico reduz a maior parte do erro técnico.</li>
          <li><strong>Técnica de Pinçamento:</strong> Em dobras maiores ou indivíduos com tecido adiposo muito espesso, recomenda-se que um auxiliar ajude a segurar a dobra com as duas mãos para o antropometrista aplicar o plicômetro com precisão.</li>
          <li><strong>Aprimoramento Contínuo:</strong> Praticar com frequência é o único caminho para reduzir o erro técnico e atingir os padrões internacionais da ISAK.</li>
        </ul>
      </div>
    `,

    conclusao: `
      <div className="bg-gray-900 text-white rounded-2xl p-6 mt-8 shadow-lg space-y-2">
        <h4 className="text-emerald-400 font-bold text-sm uppercase tracking-wider">🎯 Aplicação no EvaluaOS</h4>
        <p className="text-xs text-gray-300 leading-relaxed">
          Controlar o seu ETM garante que, quando o laudo do EvaluaOS mostrar uma redução no somatório de dobras do seu paciente, essa diferença seja <strong>uma adaptação real ao plano alimentar e ao treino</strong>, e não uma mera oscilação da sua fita métrica ou do seu plicômetro!
        </p>
      </div>
    `
  }
}
