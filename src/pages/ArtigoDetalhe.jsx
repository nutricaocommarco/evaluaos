import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CONTEUDOS_APRENDIZADO } from '../data/conteudosAprendizado'
import PublicHeader from '../components/PublicHeader'

export default function ArtigoDetalhe() {
  const { artigoId } = useParams()
  const navigate = useNavigate()

  // 1. Busca o artigo correspondente no nosso banco de dados
  const artigo = CONTEUDOS_APRENDIZADO.find(
    item => item.id === artigoId || item.id === `artigo-${artigoId}`
  )

  // 2. INJEÇÃO DINÂMICA DE SEO
  useEffect(() => {
    if (artigo) {
      // Título da aba do navegador
      document.title = `${artigo.titulo} | Central Científica EvaluaOS`

      // Meta Description (Para o Google)
      let metaDescription = document.querySelector("meta[name='description']")
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.name = 'description'
        document.head.appendChild(metaDescription)
      }
      metaDescription.content = artigo.resumoCard || artigo.descricao || artigo.subtitulo || 'Artigo sobre cineantropometria e avaliação física.'

      // Open Graph Image (Para WhatsApp, Facebook e LinkedIn lerem a capinha)
      let metaOgImage = document.querySelector("meta[property='og:image']")
      if (!metaOgImage) {
        metaOgImage = document.createElement('meta')
        metaOgImage.setAttribute('property', 'og:image')
        document.head.appendChild(metaOgImage)
      }
      if (artigo.capa) {
        // Garante URL absoluta para redes sociais
        const fullImageUrl = artigo.capa.startsWith('http') 
          ? artigo.capa 
          : `${window.location.origin}${artigo.capa}`;
        metaOgImage.content = fullImageUrl
      }
    } else {
      document.title = "Artigo Não Encontrado | EvaluaOS"
    }

    // Retorna a página ao topo ao carregar
    window.scrollTo(0, 0)

    // Ao sair da página, volta o título para o original
    return () => {
      document.title = "EvaluaOS | Software de Avaliação Antropométrica"
    }
  }, [artigo])

  if (!artigo) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <PublicHeader />
        <div className="p-8 flex-grow flex flex-col items-center justify-center space-y-4">
          <span className="text-4xl block">🔍</span>
          <h2 className="text-lg font-bold text-gray-800">Artigo não encontrado</h2>
          <p className="text-xs text-gray-500">O conteúdo que você procura não está disponível ou foi movido.</p>
          <button
            onClick={() => navigate('/aprendizado')}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-emerald-700 transition-colors"
          >
            Voltar para Aprendizado
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-fadeIn pb-20">
        
        {/* Botão Voltar */}
        <button
          onClick={() => navigate('/aprendizado')}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-emerald-600 transition-colors mt-4"
        >
          ➔ Voltar para Central de Aprendizado
        </button>

        {/* Cabeçalho do Artigo */}
        <div className="space-y-3 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg uppercase">
              {artigo.categoria}
            </span>
            <span className="text-xs text-gray-400 font-medium">• {artigo.tempoLeitura}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
            {artigo.titulo}
          </h1>

          {artigo.subtitulo && (
            <p className="text-sm font-medium text-gray-600 leading-relaxed">
              {artigo.subtitulo}
            </p>
          )}

          {artigo.autores && (
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs text-gray-500 space-y-0.5 mt-4">
              {artigo.revista && <p><strong>Revista:</strong> {artigo.revista}</p>}
              <p><strong>Autores:</strong> {artigo.autores}</p>
            </div>
          )}
        </div>

        {/* Imagem de Capa e Link DOI */}
        <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden bg-gray-100 shadow-md">
          <img src={artigo.capa} alt={artigo.titulo} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6 justify-between">
            <span className="text-white text-xs font-semibold drop-shadow-md">EvaluaOS • Ciência Aplicada</span>
            {artigo.doiUrl && (
              <a
                href={artigo.doiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
              >
                Artigo Original (DOI) 🔗
              </a>
            )}
          </div>
        </div>

        {/* Conteúdo do Resumo Explicativo */}
        {artigo.conteudoCompleto ? (
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6 text-gray-700 text-xs md:text-sm leading-relaxed">
            {Object.entries(artigo.conteudoCompleto).map(([chave, texto]) => (
              <div 
                key={chave} 
                className="prose prose-sm prose-emerald max-w-none"
                dangerouslySetInnerHTML={{ __html: texto.replace(/\n/g, '<br/>') }} 
              />
            ))}
          </div>
        ) : (
          <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-800 space-y-2">
            <p className="font-bold">Artigo Externo</p>
            <p>Este estudo não possui um resumo interno completo cadastrado. Clique no botão acima para acessar o artigo original na íntegra.</p>
          </div>
        )}

        {/* Rodapé da Página */}
        <div className="pt-6 mt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <span className="font-medium tracking-wide">EvaluaOS • Preservando a Precisão Científica</span>
          <button
            onClick={() => navigate('/aprendizado')}
            className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors w-full sm:w-auto"
          >
            Voltar ao Aprendizado
          </button>
        </div>

      </div>
    </div>
  )
}