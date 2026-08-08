import { artigoAlanMartin1984 } from './artigos/alanMartin1984'
import { ARTIGO_COME_BACK_SKINFOLDS } from './artigos/ComeBackSkinfolds'
import { ARTIGO_PERINI_2005_ETM } from './artigos/Perini2005ETM'
import { ARTIGO_HOLWAY_2005_ARGOREF } from './artigos/Holway2005Argoref'
import { ARTIGO_DURNIN_WOMERSLEY_1974 } from './artigos/DurninWomersley1974'
import { artigosBlogMarco } from './artigos/artigosBlogMarco'

export const CATEGORIAS_APRENDIZADO = [
  'Todos',
  'Uso do EvaluaOS',
  'Antropometria',
  'Interpretação de dados',
  'Artigos e Ciência',
  'Gestão e Vendas'
]

export const CONTEUDOS_APRENDIZADO = [
  // 📹 1. Vídeos Práticos
  {
    id: 'video-overview-sistema',
    titulo: 'EvaluaOS: O Melhor Sistema de Avaliação Antropométrica para Nutricionistas',
    descricao: 'Faça um tour completo pelo sistema definitivo de avaliação antropométrica. Diga adeus às planilhas e veja como o EvaluaOS funciona na prática.',
    categoria: 'Uso do EvaluaOS',
    tipo: 'video',
    url: 'https://www.youtube.com/watch?v=s0VPmv7gkF0',
    tempoLeitura: '6 min assistindo',
    capa: 'https://img.youtube.com/vi/s0VPmv7gkF0/hqdefault.jpg'
  },
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
  {
    id: 'video-criar-conta-evaluaos',
    titulo: 'Como Criar Sua Conta no Sistema Antropométrico EvaluaOS (Passo a Passo)',
    descricao: 'Passo a passo completo para criar sua conta no EvaluaOS e começar a usar o sistema de avaliação antropométrica.',
    categoria: 'Uso do EvaluaOS',
    tipo: 'video',
    url: 'https://www.youtube.com/watch?v=T8FNGfl4120',
    tempoLeitura: 'Vídeo tutorial',
    capa: 'https://img.youtube.com/vi/T8FNGfl4120/hqdefault.jpg'
  },
  {
    id: 'video-cadastro-paciente-avaliacao',
    titulo: 'Cadastro de Paciente e Avaliação Antropométrica Passo a Passo no EvaluaOS',
    descricao: 'Veja como cadastrar um paciente e registrar uma avaliação antropométrica completa dentro do EvaluaOS.',
    categoria: 'Uso do EvaluaOS',
    tipo: 'video',
    url: 'https://www.youtube.com/watch?v=SXSzends7c4',
    tempoLeitura: 'Vídeo tutorial',
    capa: 'https://img.youtube.com/vi/SXSzends7c4/hqdefault.jpg'
  },
  {
    id: 'video-escolha-percentual-gordura',
    titulo: 'Como Escolher o % de Gordura Certo com a Inteligência do EvaluaOS na sua Avaliação',
    descricao: 'Entenda como a engine de recomendação do EvaluaOS ajuda a escolher o percentual de gordura e a equação mais adequada para cada avaliação.',
    categoria: 'Uso do EvaluaOS',
    tipo: 'video',
    url: 'https://www.youtube.com/watch?v=pRedW54PDK4',
    tempoLeitura: 'Vídeo tutorial',
    capa: 'https://img.youtube.com/vi/pRedW54PDK4/hqdefault.jpg'
  },
  {
    id: 'video-laudo-antropometrico-evaluaos',
    titulo: 'Laudo Antropométrico no Sistema EvaluaOS',
    descricao: 'Veja como o EvaluaOS gera o laudo antropométrico completo, pronto para ser entregue ao paciente.',
    categoria: 'Uso do EvaluaOS',
    tipo: 'video',
    url: 'https://www.youtube.com/watch?v=XRnxQ8z7Ucs',
    tempoLeitura: 'Vídeo tutorial',
    capa: 'https://img.youtube.com/vi/XRnxQ8z7Ucs/hqdefault.jpg'
  },

  // 🌐 2. Artigos do Seu Blog Oficial (Links Externos)
  ...artigosBlogMarco,

  // 📄 3. Artigos Científicos Comentados (Módulos Internos)
  artigoAlanMartin1984,
  ARTIGO_COME_BACK_SKINFOLDS,
  ARTIGO_PERINI_2005_ETM,
  ARTIGO_HOLWAY_2005_ARGOREF,
  ARTIGO_DURNIN_WOMERSLEY_1974,
  
]