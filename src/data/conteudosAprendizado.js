import { ARTIGO_COME_BACK_SKINFOLDS } from './artigos/ComeBackSkinfolds'
import { ARTIGO_PERINI_2005_ETM } from './artigos/Perini2005ETM'


export const CATEGORIAS_APRENDIZADO = [
  'Todos',
  'Uso do EvaluaOS',
  'Antropometria',
  'Interpretação de dados',
  'Artigos e Ciência',
  'Gestão e Vendas'
]

export const CONTEUDOS_APRENDIZADO = [
  {
  id: 'video-perfil-restrito-isak',
  titulo: 'Perfil Restringido ISAK: Protocolo Internacional de Valoração Antropométrica',
  descricao: 'Vídeo oficial demonstrativo mostrando a localização de pontos anatômicos, dobras cutâneas, perímetros e diâmetros do perfil restrito.',
  categoria: 'Antropometria',
  tipo: 'video',
  url: 'https://www.youtube.com/watch?v=_Fmm4T4Ooto',
  tempoLeitura: '20 min assistindo',
  capa: 'https://img.youtube.com/vi/_Fmm4T4Ooto/hqdefault.jpg'
},

{
  id: 'video-perfil-completo-isak',
  titulo: 'Perfil Completo ISAK: Protocolo Internacional Antropométrico Avançado',
  descricao: 'Guia completo demonstrativo com todas as marcações de pontos, dobras, perímetros adicionais (antebraço, coxa máxima) e diâmetros ósseos.',
  categoria: 'Antropometria',
  tipo: 'video',
  url: 'https://www.youtube.com/watch?v=Ff2WDc7LhXU',
  tempoLeitura: '34 min assistindo',
  capa: 'https://img.youtube.com/vi/Ff2WDc7LhXU/hqdefault.jpg'
},

  // 📄 2. Artigo completo e comentado do Come Back Skinfolds (Importado do Módulo)
  ARTIGO_COME_BACK_SKINFOLDS,
ARTIGO_PERINI_2005_ETM,

  // 📄 1. Artigos Científicos com link direto (ou futuros módulos)
  {
    id: 'samouda-2013',
    titulo: 'Gordura Visceral sem CT-Scan ou DXA: Entenda a Ciência do apVAT',
    descricao: 'Descubra como a subtração entre a circunferência da cintura e da coxa proximal revolucionou a avaliação da gordura visceral (Samouda et al., 2013).',
    categoria: 'Artigos e Ciência',
    tipo: 'artigo',
    url: 'https://doi.org/10.1002/oby.20033',
    tempoLeitura: '7 min de leitura',
    capa: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'brown-2018',
    titulo: 'Validação do apVAT: Risco Metabólico e Mortalidade (Estudo NHANES III)',
    descricao: 'Análise de mais de 10.600 adultos comprovando que o apVAT prevê risco cardiovascular, diabetes e mortalidade melhor que o IMC e a cintura (Brown et al.).',
    categoria: 'Artigos e Ciência',
    tipo: 'artigo',
    url: 'https://doi.org/10.1007/s00394-016-1308-8',
    tempoLeitura: '8 min de leitura',
    capa: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'heath-carter-1967',
    titulo: 'A Origem do Somatotipo Heath-Carter: A Evolução Antropométrica',
    descricao: 'Conheça o estudo clássico de 1967 que criou a metodologia dinâmica de Somatotipo (Endomorfia, Mesomorfia e Ectomorfia) sem limites fixos.',
    categoria: 'Antropometria',
    tipo: 'artigo',
    url: 'https://doi.org/10.1002/ajpa.1330270108',
    tempoLeitura: '9 min de leitura',
    capa: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80'
  },

  // 📖 3. Tutoriais e Conteúdos Internos do EvaluaOS
  {
    id: 'tutorial-evaluaos',
    titulo: 'Dominando o EvaluaOS: Do Cadastro ao Laudo em 5 minutos',
    descricao: 'Passo a passo prático para configurar seu perfil, cadastrar alunos e emitir laudos interativos sem complicação.',
    categoria: 'Uso do EvaluaOS',
    tipo: 'tutorial',
    url: 'https://nutricaocommarco.com.br/tutorial-evaluaos',
    tempoLeitura: '5 min de leitura',
    capa: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'video-somatocarta',
    titulo: 'Como interpretar e explicar a Somatocarta ao Paciente',
    descricao: 'Aprenda a traduzir Endomorfia, Mesomorfia e Ectomorfia em linguagem simples para gerar impacto e adesão do aluno.',
    categoria: 'Interpretação de dados',
    tipo: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tempoLeitura: '10 min assistindo',
    capa: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'vendas-consultoria',
    titulo: 'Usando a Projeção de Metas para Vender Consultoria Contínua',
    descricao: 'Estratégias de vendas atreladas ao laudo: como demonstrar o valor da reavaliação periódica no seu consultório.',
    categoria: 'Gestão e Vendas',
    tipo: 'artigo',
    url: 'https://nutricaocommarco.com.br/vendas-consultoria',
    tempoLeitura: '6 min de leitura',
    capa: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=600&q=80'
  }
]
