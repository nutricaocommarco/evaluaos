import React, { useState, useEffect, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase } from '../../supabaseClient'
import { Upload, Search, Check, Loader2 } from 'lucide-react'

// Modal de seleção de imagem — duas abas, mesma saída: uma URL de imagem.
// "Minhas Imagens" sobe pro R2 do próprio nutricionista; "Banco de Imagens"
// busca na Pexels e usa a URL de lá direto (sem baixar/re-hospedar nada).
// Quem chama esse componente não precisa saber de onde a URL final veio.
export default function SeletorImagem({ aoFechar, aoSelecionar }) {
  const [aba, setAba] = useState('minhas')
  const [imagemSelecionada, setImagemSelecionada] = useState(null)
  const [fotografoSelecionado, setFotografoSelecionado] = useState(null)
  const fileInputRef = useRef(null)

  // Aba "Minhas Imagens"
  const [minhasImagens, setMinhasImagens] = useState([])
  const [buscaMinhas, setBuscaMinhas] = useState('')
  const [carregandoMinhas, setCarregandoMinhas] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [erroUpload, setErroUpload] = useState('')

  // Aba "Banco de Imagens"
  const [buscaBanco, setBuscaBanco] = useState('')
  const [fotosBanco, setFotosBanco] = useState([])
  const [carregandoBanco, setCarregandoBanco] = useState(false)

  const carregarMinhasImagens = async (busca = '') => {
    setCarregandoMinhas(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`/api/uploads/imagens?busca=${encodeURIComponent(busca)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    const data = await res.json()
    setMinhasImagens(data.imagens || [])
    setCarregandoMinhas(false)
  }

  useEffect(() => {
    carregarMinhasImagens()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const t = setTimeout(() => carregarMinhasImagens(buscaMinhas), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaMinhas])

  useEffect(() => {
    if (aba !== 'banco') return
    if (!buscaBanco.trim()) { setFotosBanco([]); return }
    setCarregandoBanco(true)
    const t = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/uploads/imagens?recurso=pexels&busca=${encodeURIComponent(buscaBanco)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      setFotosBanco(data.fotos || [])
      setCarregandoBanco(false)
    }, 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaBanco, aba])

  const handleUpload = async (e) => {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return

    setErroUpload('')
    setEnviando(true)
    try {
      const comprimido = await imageCompression(arquivo, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg',
      })

      const { data: { session } } = await supabase.auth.getSession()
      const presignRes = await fetch('/api/uploads/imagens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ nomeArquivo: arquivo.name.replace(/\.[^.]+$/, '.jpg'), contentType: 'image/jpeg', tamanhoBytes: comprimido.size }),
      })
      const presignData = await presignRes.json()
      if (!presignRes.ok) throw new Error(presignData.error || 'Falha ao preparar upload')

      const uploadRes = await fetch(presignData.urlUpload, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: comprimido,
      })
      if (!uploadRes.ok) throw new Error('Falha ao enviar a imagem')

      setImagemSelecionada(presignData.urlPublica)
      setFotografoSelecionado(null)
      carregarMinhasImagens(buscaMinhas)
    } catch (err) {
      setErroUpload(err.message)
    }
    setEnviando(false)
  }

  const handleConfirmar = () => {
    if (!imagemSelecionada) return
    aoSelecionar(imagemSelecionada)
    aoFechar()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Escolher Imagem</h3>
          <button onClick={aoFechar} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">✕</button>
        </div>

        <div className="flex bg-gray-50 dark:bg-slate-800 px-6 pt-3 gap-1 border-b border-gray-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setAba('minhas')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors ${aba === 'minhas' ? 'bg-white dark:bg-slate-900 text-primary-600 border border-b-0 border-gray-100 dark:border-slate-800' : 'text-gray-500 dark:text-slate-400'}`}
          >
            Minhas Imagens
          </button>
          <button
            type="button"
            onClick={() => setAba('banco')}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors ${aba === 'banco' ? 'bg-white dark:bg-slate-900 text-primary-600 border border-b-0 border-gray-100 dark:border-slate-800' : 'text-gray-500 dark:text-slate-400'}`}
          >
            Banco de Imagens
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {aba === 'minhas' ? (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={buscaMinhas}
                    onChange={(e) => setBuscaMinhas(e.target.value)}
                    placeholder="Buscar pelo nome do arquivo..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={enviando}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 shrink-0"
                >
                  {enviando ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {enviando ? 'Enviando...' : 'Fazer upload'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} className="hidden" />
              </div>

              {erroUpload && <p className="text-xs text-red-600 font-semibold">{erroUpload}</p>}

              {carregandoMinhas ? (
                <p className="text-xs text-gray-400 text-center py-8">Carregando...</p>
              ) : minhasImagens.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">Nenhuma imagem enviada ainda.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {minhasImagens.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => { setImagemSelecionada(img.url); setFotografoSelecionado(null) }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${imagemSelecionada === img.url ? 'border-primary-600 ring-2 ring-primary-200' : 'border-transparent hover:border-gray-300'}`}
                    >
                      <img src={img.url} alt={img.nome_arquivo} className="w-full h-full object-cover" />
                      {imagemSelecionada === img.url && (
                        <div className="absolute inset-0 bg-primary-600/20 flex items-center justify-center">
                          <Check size={20} className="text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={buscaBanco}
                  onChange={(e) => setBuscaBanco(e.target.value)}
                  placeholder="Buscar imagens (ex: salada, corrida, frutas...)"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>

              {carregandoBanco ? (
                <p className="text-xs text-gray-400 text-center py-8">Buscando...</p>
              ) : !buscaBanco.trim() ? (
                <p className="text-xs text-gray-400 text-center py-8">Digite algo pra buscar imagens.</p>
              ) : fotosBanco.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">Nenhuma imagem encontrada.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {fotosBanco.map((foto) => (
                    <button
                      key={foto.id}
                      type="button"
                      onClick={() => { setImagemSelecionada(foto.urlCompleta); setFotografoSelecionado(foto) }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${imagemSelecionada === foto.urlCompleta ? 'border-primary-600 ring-2 ring-primary-200' : 'border-transparent hover:border-gray-300'}`}
                    >
                      <img src={foto.urlMiniatura} alt="" className="w-full h-full object-cover" />
                      {imagemSelecionada === foto.urlCompleta && (
                        <div className="absolute inset-0 bg-primary-600/20 flex items-center justify-center">
                          <Check size={20} className="text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {fotografoSelecionado && (
                <p className="text-[11px] text-gray-400 dark:text-slate-500">
                  Foto de {fotografoSelecionado.fotografo} via Pexels
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-800">
          <button onClick={aoFechar} className="px-5 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!imagemSelecionada}
            className="px-5 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 shadow disabled:opacity-50"
          >
            Adicionar imagem
          </button>
        </div>
      </div>
    </div>
  )
}
