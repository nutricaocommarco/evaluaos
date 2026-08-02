import React, { useState } from 'react'

// Base de dados inicial dos conteúdos do nutricaocommarco
const CONTEUDOS_APRENDIZADO = [
  {
    id: 1,
    titulo: 'Como realizar a marcação de pontos anatômicos ISAK',
    descricao: 'Guia prático em vídeo passo a passo para localização exata dos pontos antropométricos segundo a padronização internacional.',
    categoria: 'Antropometria ISAK',
    tipo: 'video', // 'video' | 'artigo' | 'tutorial'
    url: 'https://www.youtube.com/watch?v=EXEMPLO1', // Altere para seu link real
    tempoLeitura: '12 min assistindo',
    destaque: true,
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg' // Exemplo
  },
  {
    id: 2,
    titulo: 'Dominando o EvaluaOS: Do Cadastro ao Laudo em 5 minutos',
    descricao: 'Tutorial completo para nutricionistas e personal trainers utilizarem 100% dos recursos do software na primeira consulta.',
    categoria: 'Uso do EvaluaOS',
    tipo: 'tutorial',
    url: 'https://nutricaocommarco.com.br/tutorial-evaluaos',
    tempoLeitura: '5 min de leitura',
    destaque: true
  },
  {
    id: 3,
    titulo: 'Diferença entre as Equações de Gordura: Quando usar cada uma?',
    descricao: 'Entenda os critérios científicos do seu TCC aplicados à prática clínica: Jackson & Pollock, Faulkner, Petroski e Weltman.',
    categoria: 'Artigos & Ciência',
    tipo: 'artigo',
    url: 'https://nutricaocommarco.com.br/equacoes-antropometricas',
    tempoLeitura: '8 min de leitura',
    destaque: false
  },
  {
    id: 4,
    titulo: 'Interpretando a Somatocarta de Heath-Carter para o Paciente',
    descricao: 'Como explicar Endomorfia, Mesomorfia e Ectomorfia de forma simples e visual para aumentar o engajamento do aluno.',
    categoria: 'Antropometria ISAK',
    tipo: 'video',
    url: 'https://www.youtube.com/watch?v=EXEMPLO2',
    tempoLeitura: '15 min assistindo',
    destaque: false
  },
  {
    id: 5,
    titulo: 'Como usar a Projeção de Metas para vender Consultoria Contínua',
    descricao: 'Estratégia comercial mostrando o potencial do módulo de projeção de massa magra e déficit para fidelizar clientes.',
    categoria: 'Gestão & Vendas',
    tipo: 'artigo',
    url: 'https://nutricaocommarco.com.br/vendas-consultoria',
    tempoLeitura: '6 min de leitura',
    destaque: false
  }
]

const CATEGORIAS = ['Todos', 'Uso do EvaluaOS', 'Antropometria ISAK', 'Artigos & Ciência', 'Gestão & Vendas']

export default function Aprendizado() {
  const [busca, setBusca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos')
  const [videoModal, setVideoModal] = useState(null)

  // Filtro dinâmico
  const conteudosFiltrados = CONTEUDOS_APRENDIZADO.filter(item => {
    const bateCategoria = categoriaAtiva === 'Todos' || item.categoria === categoriaAtiva
    const bateBusca = item.titulo.toLowerCase().includes(busca.toLowerCase()) || 
                      item.descricao.toLowerCase().includes(busca.toLowerCase())
    return bateCategoria && bateBusca
  })

  // Converte link do YouTube para embed seguro no modal
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
            Tutoriais do sistema, guias de antropometria ISAK e artigos de nutrição por Marco Aurélio.
          </p>
        </div>

        {/* Campo de Busca */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Buscar tutoriais ou artigos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
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
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 🌟 CARDS EM DESTAQUE / LISTA */}
      {conteudosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <span className="text-3xl block mb-2">📚</span>
          <h3 className="text-sm font-bold text-gray-700">Nenhum conteúdo encontrado</h3>
          <p className="text-xs text-gray-400 mt-1">Tente pesquisar com outros termos ou selecione outra categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conteudosFiltrados.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between group cursor-pointer"
              onClick={() => handleAbrirConteudo(item)}
            >
              <div className="space-y-3">
                {/* Cabeçalho do Card (Badges) */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg uppercase">
                    {item.categoria}
                  </span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    {item.tipo === 'video' ? '📹 Vídeo' : item.tipo === 'tutorial' ? '📖 Tutorial' : '📰 Artigo'}
                  </span>
                </div>

                {/* Título e Descrição */}
                <h3 className="text-base font-bold text-gray-800 group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {item.titulo}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                  {item.descricao}
                </p>
              </div>

              {/* Rodapé do Card */}
              <div className="pt-4 mt-4 border-t border-gray-50 flex items-center justify-between text-xs">
                <span className="text-gray-400 text-[11px]">{item.tempoLeitura}</span>
                <span className="text-emerald-600 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Acessar ➔
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🎥 MODAL DE EMBED DE VÍDEO DO YOUTUBE */}
      {videoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-4">
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{videoModal.categoria}</span>
              <button
                onClick={() => setVideoModal(null)}
                className="text-gray-400 hover:text-white text-xl font-bold px-2"
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
              <p className="text-xs text-gray-500 mt-1">{videoModal.descricao}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}