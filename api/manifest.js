// Manifest da PWA gerado por token — resolve dois problemas do manifest
// estático (vite.config.js): (1) start_url fixo em "/" fazia o ícone
// instalado sempre abrir a home pública em vez da Área do Paciente
// específica; (2) ícone/nome sempre o escudo genérico do EvaluaOS, nunca a
// marca do consultório. src/pages/AreaPaciente.jsx troca o
// <link rel="manifest"> pra apontar aqui assim que sabe o token.
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const ICONE_PADRAO = '/Imagens/Escudo_png.png'

export default async function handler(req, res) {
  const token = typeof req.query.token === 'string' ? req.query.token : ''

  let nomeApp = 'EvaluaOS'
  let icone = ICONE_PADRAO

  if (token) {
    try {
      const { data: paciente } = await supabase
        .from('pacientes')
        .select('id_avaliador')
        .eq('token_publico', token)
        .maybeSingle()

      if (paciente?.id_avaliador) {
        const { data: avaliador } = await supabase
          .from('avaliadores')
          .select('empresa, nome_completo, logomarca_url')
          .eq('auth_id', paciente.id_avaliador)
          .maybeSingle()

        if (avaliador) {
          nomeApp = avaliador.empresa || avaliador.nome_completo || 'EvaluaOS'
          if (avaliador.logomarca_url) icone = avaliador.logomarca_url
        }
      }
    } catch (err) {
      console.error('manifest: falha ao buscar marca do avaliador', err)
    }
  }

  const startUrl = token ? `/area/${token}` : '/'

  const manifest = {
    id: startUrl,
    name: nomeApp,
    short_name: nomeApp.length > 15 ? `${nomeApp.slice(0, 14)}…` : nomeApp,
    description: 'Acompanhe sua evolução, laudo, plano alimentar, orientações e questionários.',
    start_url: startUrl,
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#059669',
    icons: [
      { src: icone, sizes: '192x192', type: 'image/png' },
      { src: icone, sizes: '512x512', type: 'image/png' },
      { src: icone, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }

  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
  res.status(200).json(manifest)
}
