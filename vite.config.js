import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// PWA só deixa o app instalável (ícone + tela cheia) — sem runtimeCaching
// pra API do Supabase, de propósito: dados de paciente (plano alimentar,
// laudo, questionários) não podem ficar presos em cache desatualizado.
// Só o app-shell (JS/CSS/HTML do build) é pré-cacheado.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['Imagens/Escudo_png.png'],
      // Bundle único ainda não passa por code-splitting (fora de escopo
      // aqui) e já passa dos 2MB padrão do workbox — libera até 6MB pra
      // não travar o precache do app-shell.
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      manifest: {
        name: 'EvaluaOS',
        short_name: 'EvaluaOS',
        description: 'Avaliação Antropométrica, Plano Alimentar e Área do Paciente.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#059669',
        icons: [
          {
            src: '/Imagens/Escudo_png.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/Imagens/Escudo_png.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/Imagens/Escudo_png.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
