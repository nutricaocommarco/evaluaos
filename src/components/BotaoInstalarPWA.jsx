import React, { useState, useEffect } from 'react'
import { Download, Share, MoreVertical, X } from 'lucide-react'

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
// está instalado. Em vez de depender do prompt nativo de instalação do
// Chrome (beforeinstallprompt) — que em alguns celulares/marcas gera um
// "app de verdade" nos bastidores e pode falhar ou não aparecer em lugar
// nenhum sem aviso claro, mesmo depois do usuário confirmar — mostra
// sempre um passo a passo simples e previsível de "adicionar à tela
// inicial", que funciona igual em qualquer Android/iPhone.
export default function BotaoInstalarPWA() {
  const [mostrarInstrucoes, setMostrarInstrucoes] = useState(false)
  const [visivel, setVisivel] = useState(false)
  const ios = detectarIOS()

  useEffect(() => {
    setVisivel(detectarMobile() && !detectarStandalone())
  }, [])

  if (!visivel) return null

  return (
    <>
      <button
        onClick={() => setMostrarInstrucoes(true)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white text-sm font-bold rounded-xl shadow hover:bg-primary-700 transition-colors"
      >
        <Download size={16} /> Instalar App na Tela de Início
      </button>

      {mostrarInstrucoes && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-gray-800 dark:text-slate-100">
                Instalar no {ios ? 'iPhone' : 'Android'}
              </h3>
              <button onClick={() => setMostrarInstrucoes(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {ios ? (
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
            ) : (
              <ol className="space-y-3 text-sm text-gray-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="font-black text-primary-600 shrink-0">1.</span>
                  <span>Toque no menu <MoreVertical size={14} className="inline mx-0.5" /> (três pontinhos) no canto superior direito do Chrome.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-primary-600 shrink-0">2.</span>
                  <span>Toque em <strong>"Adicionar à tela inicial"</strong> (ou "Instalar app").</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-black text-primary-600 shrink-0">3.</span>
                  <span>Confirme — o ícone aparece na tela inicial (ou na gaveta de aplicativos, dependendo do celular).</span>
                </li>
              </ol>
            )}

            <button
              onClick={() => setMostrarInstrucoes(false)}
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
