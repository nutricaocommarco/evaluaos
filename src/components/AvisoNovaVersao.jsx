import React, { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

const REGEX_BUNDLE = /\/assets\/index-[A-Za-z0-9_-]+\.js/

function bundleEmUso() {
  const script = document.querySelector('script[type="module"][src*="/assets/index-"]')
  return script?.getAttribute('src')?.match(REGEX_BUNDLE)?.[0] || null
}

// Navegador de tablet/celular costuma restaurar a aba do jeito que estava,
// sem recarregar a página — o app pode ficar semanas rodando um JavaScript
// antigo mesmo depois de vários deploys (foi assim que avaliações foram
// salvas sem as 3 medidas). Este aviso compara o bundle em uso com o que o
// servidor publica hoje e oferece atualizar.
export default function AvisoNovaVersao() {
  const [desatualizado, setDesatualizado] = useState(false)
  const [atualizando, setAtualizando] = useState(false)

  useEffect(() => {
    const atual = bundleEmUso()
    if (!atual) return // dev: o bundle não tem hash, não há o que comparar

    const checar = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        // Query string própria: o service worker só intercepta o index.html
        // exato (que serviria a versão em cache, a mesma já em uso).
        const resp = await fetch(`/index.html?_=${Date.now()}`, { cache: 'no-store' })
        const publicado = (await resp.text()).match(REGEX_BUNDLE)?.[0]
        if (publicado && publicado !== atual) setDesatualizado(true)
      } catch {
        // sem rede: tenta de novo na próxima checagem
      }
    }

    const aoVoltar = (e) => {
      if (e.type === 'pageshow' && !e.persisted) return
      checar()
    }

    checar()
    const intervalo = setInterval(checar, 5 * 60 * 1000)
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('pageshow', aoVoltar)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('pageshow', aoVoltar)
    }
  }, [])

  const atualizarAgora = async () => {
    setAtualizando(true)
    try {
      // Recarregar de cara serviria de novo o app-shell antigo que o service
      // worker ainda tem em cache; antes dá tempo dele baixar e assumir o novo.
      const registros = (await navigator.serviceWorker?.getRegistrations?.()) || []
      for (const registro of registros) {
        await registro.update()
        if (registro.installing || registro.waiting) {
          await new Promise((resolve) => {
            navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })
            setTimeout(resolve, 5000)
          })
        }
      }
    } catch {
      // segue pro reload mesmo assim
    }
    window.location.reload()
    setTimeout(() => setAtualizando(false), 3000)
  }

  if (!desatualizado) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] w-[calc(100vw-2rem)] max-w-md bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 p-4 space-y-3">
      <div>
        <p className="text-sm font-bold">Há uma versão nova do EvaluaOS</p>
        <p className="text-xs text-slate-300 mt-0.5">
          Atualize para continuar com tudo funcionando — principalmente antes de salvar medidas de uma avaliação.
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={atualizarAgora}
          disabled={atualizando}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition-colors"
        >
          <RefreshCw size={14} className={atualizando ? 'animate-spin' : ''} /> {atualizando ? 'Atualizando...' : 'Atualizar'}
        </button>
        <button
          onClick={() => setDesatualizado(false)}
          className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white rounded-lg"
        >
          Depois
        </button>
      </div>
    </div>
  )
}
