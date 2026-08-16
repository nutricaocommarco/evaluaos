import React, { useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import SeletorImagem from './SeletorImagem'

// Campo pronto pra qualquer tela que precise de "uma imagem opcional
// associada a um registro" — mostra a miniatura + trocar/remover quando já
// tem imagem, ou um botão de adicionar quando não tem. `valor` é só a URL
// (ou null); quem usa decide quando salvar (normalmente no onChange).
export default function CampoImagem({ valor, onChange, label = 'Imagem' }) {
  const [seletorAberto, setSeletorAberto] = useState(false)

  return (
    <div className="space-y-1.5">
      {label && <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>}

      {valor ? (
        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 group">
          <img src={valor} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setSeletorAberto(true)}
              title="Trocar imagem"
              className="p-1.5 bg-white/90 rounded-full text-gray-700 hover:bg-white"
            >
              <ImagePlus size={13} />
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              title="Remover imagem"
              className="p-1.5 bg-white/90 rounded-full text-red-600 hover:bg-white"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSeletorAberto(true)}
          className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-slate-500 hover:border-primary-400 hover:text-primary-600 transition-colors"
        >
          <ImagePlus size={18} />
          <span className="text-[9px] font-bold">Adicionar</span>
        </button>
      )}

      {seletorAberto && (
        <SeletorImagem
          aoFechar={() => setSeletorAberto(false)}
          aoSelecionar={(url) => onChange(url)}
        />
      )}
    </div>
  )
}
