import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CONTEUDOS_APRENDIZADO, CATEGORIAS_APRENDIZADO } from '../data/conteudosAprendizado'

export default function Aprendizado() {
  const [busca, setBusca] = useState('')
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos')
  const [videoModal, setVideoModal] = useState(null)
  
  const navigate = useNavigate()

  // Filtro
  const conteudosFiltrados = CONTEUDOS_APRENDIZADO.filter(item => {
    const bateCategoria = categoriaAtiva === 'Todos' || item.categoria === categoriaAtiva
    const bateBusca = item.titulo.toLowerCase().includes(busca.toLowerCase()) || 
                      item.descricao.toLowerCase().includes(busca.toLowerCase())
    return bateCategoria && bateBusca
  })

  // Converte link do YouTube para embed de forma segura sem dar conflito no JSX
  const obterUrlEmbed = (url) => {
    if (!url) return ''
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const videoId = url.split('v=')[1]?.split('&')[0]
        return `https://www.youtube.com/embed/${videoId}`
      }
      if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0]
        return `https://www.youtube.com/embed/${videoId}`
      }
      return url
    } catch {
      return url
    }
  }

  const handleAbrirConteudo = (item) => {
    if (item.tipo === 'video' && item.url?.includes('youtube')) {
      setVideoModal(item)
    } else if (item.conteudoCompleto) {
      navigate(`/aprendizado/${item.id}`)
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
        {CATEGORIAS_APRENDIZADO.map(cat => (
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
