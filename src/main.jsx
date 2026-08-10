import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Captura o evento de instalação da PWA o mais cedo possível — ele só
// dispara UMA VEZ por carregamento de página, e pode disparar antes da
// Área do Paciente terminar de montar (ela espera uma consulta ao Supabase
// primeiro). Se só o componente do botão escutasse isso no próprio
// useEffect, corria o risco de perder o evento pra sempre nessa visita.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  window.__pwaInstallPrompt = e
  window.dispatchEvent(new Event('pwa-install-disponivel'))
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)