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

  // 🌐 2. Artigos do Seu Blog Oficial (Links Externos)
  ...artigosBlogMarco,

  // 📄 3. Artigos Científicos Comentados (Módulos Internos)
  artigoAlanMartin1984,
  ARTIGO_COME_BACK_SKINFOLDS,
  ARTIGO_PERINI_2005_ETM,
  ARTIGO_HOLWAY_2005_ARGOREF,
  ARTIGO_DURNIN_WOMERSLEY_1974,
  
]