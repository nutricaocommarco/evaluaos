import React, { useState } from 'react'

// Base de dados refinada com tutoriais e estudos científicos do EvaluaOS
const CONTEUDOS_APRENDIZADO = [
  {
    id: 1,
    titulo: 'Gordura Visceral sem CT-Scan ou DXA: Entenda a Ciência do apVAT',
    descricao: 'Descubra como a subtração entre a circunferência da cintura e da coxa proximal revolucionou a avaliação da gordura visceral (Samouda et al., 2013).',
    categoria: 'Artigos e Ciência',
    tipo: 'artigo', // 'video' | 'artigo' | 'tutorial'
    url: 'https://doi.org/10.1002/oby.20033',
    tempoLeitura: '7 min de leitura',
    capa: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    titulo: 'Validação do apVAT: Risco Metabólico e Mortalidade (Estudo NHANES III)',
    descricao: 'Análise de mais de 10.600 adultos comprovando que o apVAT prevê risco cardiovascular, diabetes e mortalidade melhor que o IMC e a cintura (Brown et al.).',
    categoria: 'Artigos e Ciência',
    tipo: 'artigo',
    url: 'https://doi.org/10.1007/s00394-016-1308-8',
    tempoLeitura: '8 min de leitura',
    capa: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    titulo: 'O Resgate Científico das Dobras Cutâneas: "Come Back Skinfolds"',
    descricao: 'Estudo da Nutrients explicando por que o Somatório de Dobras (ISAK) é mais confiável e imune a erros de hidratação do que o DXA na prática esportiva.',
    categoria: 'Artigos e Ciência',
    tipo: 'artigo',
    url: 'https://doi.org/10.3390/nu13041075',
    tempoLeitura: '10 min de leitura',
    capa: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 4,
    titulo: 'A Origem do Somatotipo Heath-Carter: A Evolução Antropométrica',
    descricao: 'Conheça o estudo clássico de 1967 que criou a metodologia dinâmica de Somatotipo (Endomorfia, Mesomorfia e Ectomorfia) sem limites fixos.',
    categoria: 'Antropometria',
    tipo: 'artigo',
    url: 'https://doi.org/10.1002/ajpa.1330270108',
    tempoLeitura: '9 min de leitura',
    capa: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 5,
    titulo: 'Dominando o EvaluaOS: Do Cadastro ao Laudo em 5 minutos',
    descricao: 'Passo a passo prático para configurar seu perfil, cadastrar alunos e emitir laudos interativos sem complicação.',
    categoria: 'Uso do EvaluaOS',
    tipo: 'tutorial',
    url: 'https://nutricaocommarco.com.br/tutorial-evaluaos',
    tempoLeitura: '5 min de leitura',
    capa: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 6,
    titulo: 'Como interpretar e explicar a Somatocarta ao Paciente',
    descricao: 'Aprenda a traduzir Endomorfia, Mesomorfia e Ectomorfia em linguagem simples para gerar impacto e adesão do aluno.',
    categoria: 'Interpretação de dados',
    tipo: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tempoLeitura: '10 min assistindo',
    capa: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 7,
    titulo: 'Usando a Projeção de Metas para Vender Consultoria Contínua',
    descricao: 'Estratégias de vendas atreladas ao laudo: como demonstrar o valor da reavaliação periódica no seu consultório.',
    categoria: 'Gestão e Vendas',
    tipo: 'artigo',
    url: 'https://nutricaocommarco.com.br/vendas-consultoria',
    tempoLeitura: '6 min de leitura',
    capa: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=600&q=80'
  }
]

// Categorias atualizadas
const CATEGORIAS = [
  'Todos',
  'Uso do EvaluaOS',
  'Antropometria',
  'Interpretação de dados',
  'Artigos e Ciência',
  'Gestão e Vendas'
]

export default function Aprendizado() {
  const [busca, setBusca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos')
  const [videoModal, setVideoModal] = useState(null)

  // Filtro
  const conteudosFiltrados = CONTEUDOS_APRENDIZADO.filter(item => {
    const bateCategoria = categoriaAtiva === 'Todos' || item.categoria === categoriaAtiva
    const bateBusca = item.titulo.toLowerCase().includes(busca.toLowerCase()) || 
                      item.descricao.toLowerCase().includes(busca.toLowerCase())
    return bateCategoria && bateBusca
  })

  // Trata link do YouTube para embed
  const obterUrlEmbed = (url) => {
    if (!url) return ''
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url
  }

  const handleAbrirConteudo = (item) => {
    if (item.tipo === 'video' && item.url.includes('youtube')) {
      setVideoModal(item)
    } else {
      window.open(item.url, '_blank')
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* 🟢 CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Base de Conhecimento</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Central de Aprendizado</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tutoriais do sistema, guias práticos de antropometria e artigos científicos por Marco Aurélio.
          </p>
        </div>

        {/* Campo de Busca */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por título ou assunto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
          />
          <span className="absolute left-3 top-3 text-gray-400 text-xs">🔍</span>
        </div>
      </div>

      {/* 🏷️ FILTROS POR CATEGORIA */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIAS.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaAtiva(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              categoriaAtiva === cat
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 🖼️ GRID DE CARDS COM CAPA */}
      {conteudosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <span className="text-3xl block mb-2">📚</span>
          <h3 className="text-sm font-bold text-gray-700">Nenhum conteúdo encontrado</h3>
          <p className="text-xs text-gray-400 mt-1">Tente pesquisar por outros termos ou selecione outra categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conteudosFiltrados.map((item) => (
            <div
              key={item.id}
              onClick={() => handleAbrirConteudo(item)}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                {/* 📸 CAPA DO CARD */}
                <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                  <img
                    src={item.capa}
                    alt={item.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Badge de Categoria sobre a imagem */}
                  <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    {item.categoria}
                  </span>

                  {/* Ícone de Tipo (Vídeo / Artigo) */}
                  <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-md text-gray-800 text-[10px] font-bold rounded-full shadow-sm flex items-center gap-1">
                    {item.tipo === 'video' ? '📹 Vídeo' : item.tipo === 'tutorial' ? '📖 Tutorial' : '📰 Artigo'}
                  </span>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-5 space-y-2">
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-snug">
                    {item.titulo}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {item.descricao}
                  </p>
                </div>
              </div>

              {/* Rodapé do Card */}
              <div className="p-5 pt-0 mt-2 flex items-center justify-between text-xs border-t border-gray-50 pt-3">
                <span className="text-gray-400 text-[11px]">{item.tempoLeitura}</span>
                <span className="text-emerald-600 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Acessar ➔
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🎥 MODAL DE VÍDEO YOUTUBE */}
      {videoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fadeIn backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-4">
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{videoModal.categoria}</span>
              <button
                onClick={() => setVideoModal(null)}
                className="text-gray-400 hover:text-white text-xl font-bold px-2 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="aspect-video w-full">
              <iframe
                src={obterUrlEmbed(videoModal.url)}
                title={videoModal.titulo}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-5 pt-0">
              <h3 className="text-lg font-bold text-gray-900">{videoModal.titulo}</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{videoModal.descricao}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
