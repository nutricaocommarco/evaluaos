import React, { useState, useEffect } from 'react'
import { Download, Share, X } from 'lucide-react'

function detectarMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function detectarIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function detectarStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

// Botão "Instalar App" — só aparece em celular e só quando o app ainda não
// está instalado (a barra de endereço do navegador só some depois de
// instalado e aberto pelo ícone da tela inicial; não tem como escondê-la
// numa aba normal do navegador, então a solução é levar o paciente a
// instalar em vez de tentar esconder a barra por CSS/JS).
export default function BotaoInstalarPWA() {
  const [promptEvento, setPromptEvento] = useState(null)
  const [mostrarInstrucoesIOS, setMostrarInstrucoesIOS] = useState(false)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    if (!detectarMobile() || detectarStandalone()) return
    setVisivel(true)

    const handler = (e) => {
      e.preventDefault()
      setPromptEvento(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!visivel) return null
  if (!promptEvento && !detectarIOS()) return null

  const handleClick = async () => {
    if (promptEvento) {
      promptEvento.prompt()
      const { outcome } = await promptEvento.userChoice
      if (outcome === 'accepted') setPromptEvento(null)
      return
    }
    setMostrarInstrucoesIOS(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-bold rounded-xl shadow hover:bg-primary-700 transition-colors"
      >
        <Download size={16} /> Instalar App na Tela de Início
      </button>

      {mostrarInstrucoesIOS && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-800 dark:text-slate-100">Instalar no iPhone</h3>
              <button onClick={() => setMostrarInstrucoesIOS(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="font-black text-primary-600 shrink-0">1.</span>
                <span>Toque no ícone de compartilhar <Share size={14} className="inline mx-0.5" /> na barra do Safari.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black text-primary-600 shrink-0">2.</span>
                <span>Escolha <strong>"Adicionar à Tela de Início"</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-black text-primary-600 shrink-0">3.</span>
                <span>Toque em <strong>Adicionar</strong> — pronto, o app fica com ícone próprio, sem barra de endereço.</span>
              </li>
            </ol>
            <button
              onClick={() => setMostrarInstrucoesIOS(false)}
              className="w-full py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  )
}
