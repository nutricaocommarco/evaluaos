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
  
  // Resumo para o card da Central de Aprendizado
  resumoCard: 'Entenda como calcular o ETM intra e interavaliador para garantir que as mudanças na composição corporal do paciente sejam reais e não erros da técnica.',

  // Conteúdo completo e didático
  conteudoCompleto: {
    introducao: `
As medidas antropométricas são amplamente utilizadas para monitorar a composição corporal, avaliar a resposta adaptativa ao treinamento e caracterizar o estado nutricional. No entanto, no ato de repetir uma medição, podem ocorrer variações biológicas e variações técnicas da própria medição.

Para garantir dados confiáveis e controlar a qualidade do avaliador, este estudo clássico do Laboratório de Fisiologia do Exercício (Labofise/UFRJ) difunde a estratégia do **Erro Técnico de Medição (ETM)** segundo os padrões internacionais da *International Society for Advancement in Kinanthropometry (ISAK)* e a metodologia de Kevin Norton & Tim Olds.
    `,

    oQueEETM: `
### 📏 O que é o Erro Técnico de Medição (ETM)?

O ETM é um índice de precisão que representa o desvio-padrão entre medidas repetidas. Ele mede o grau de variabilidade e o controle de qualidade do antropometrista:

1. **ETM Intra-avaliador:** Analisa a variação das medidas repetidas em uma mesma pessoa (ou grupo) feitas pelo **mesmo** avaliador em momentos/dias diferentes.
2. **ETM Interavaliador:** Analisa a variação das medidas feitas por **diferentes** avaliadores no mesmo grupo de pessoas. É indispensável em clínicas, academias ou clubes onde mais de um profissional avalia os alunos.

#### 🎯 Padrões de Tolerância (Cortes Aceitáveis da ISAK):
* **Iniciantes / Estagiários:** ETM até **7,5%** para dobras cutâneas e **1,5%** para outras medidas (perímetros/diâmetros).
* **Experientes / Certificados:** ETM até **5,0%** para dobras cutâneas e **1,0%** para outras medidas.
    `,

    passoAPassoCalculo: `
### 🧮 Como Calcular o ETM na Prática (Método das Diferenças)

O cálculo do ETM absoluto e relativo envolve 4 etapas simples:

1. **Obter as diferenças ($d$):** Calcule a diferença entre a 1ª e a 2ª medição de cada ponto em pelo menos 20 voluntários.
2. **Elevar ao quadrado ($d^2$):** Eleve cada diferença individual ao quadrado.
3. **ETM Absoluto:** Aplique a fórmula da raiz do somatório dos quadrados dividido por duas vezes o número de sujeitos ($n$):
   $$\\text{ETM Absoluto} = \\sqrt{\\frac{\\sum d^2}{2n}}$$
4. **ETM Relativo (%):** Divida o ETM absoluto pelo **Valor Médio da Variável (VMV)** e multiplique por 100:
   $$\\text{ETM Relativo (\\%)} = \\left( \\frac{\\text{ETM}}{\\text{VMV}} \\right) \\times 100$$
    `,

    ondeOcorreOMaiorErro: `
### ⚠️ Locais de Maior Erro e Dicas Práticas

O estudo apontou que dobras cutâneas em regiões de **maior acúmulo de gordura (como abdômen, supra-ilíaca e coxa)** apresentam maior variação do ETM.

#### 💡 Recomendações do Estudo para Reduzir o Erro:
* **Localização Anatômica Precisa:** A marcação correta dos pontos de referência anatômica com lápis dermográfico reduz a maior parte do erro técnico.
* **Técnica de Pinçamento:** Em dobras maiores ou indivíduos com tecido adiposo muito espesso, recomenda-se que um auxiliar ajude a segurar a dobra com as duas mãos para o antropometrista aplicar o plicômetro com precisão.
* **Aprimoramento Contínuo:** Praticar com frequência é o único caminho para reduzir o erro técnico e atingir os padrões internacionais da ISAK.
    `,

    conclusao: `
### 🎯 Aplicação no EvaluaOS

Controlar o seu ETM garante que, quando o laudo do EvaluaOS mostrar uma redução no somatório de dobras do seu paciente, essa diferença seja **uma adaptação real ao plano alimentar e ao treino**, e não uma mera oscilação da sua fita métrica ou do seu plicômetro!
    `
  }
}
