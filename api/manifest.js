// Manifest da PWA gerado por token — resolve o problema do manifest
// estático (vite.config.js): start_url fixo em "/" fazia o ícone instalado
// sempre abrir a home pública em vez da Área do Paciente específica.
// O ícone também usa a logomarca do consultório quando o avaliador tem
// uma cadastrada (nome do app continua "EvaluaOS" sempre).
// src/pages/AreaPaciente.jsx troca o <link rel="manifest"> pra apontar
// aqui assim que sabe o token.
//
// Também serve (?icone=1) o apple-touch-icon por token: o Safari não lê
// o array `icons` do manifest.json pra "Adicionar à Tela de Início", só
// <link rel="apple-touch-icon"> — precisa da mesma resolução de marca por
// avaliador, só que devolvendo a imagem (302), não o JSON do manifest.
// Vive nesta função em vez de um arquivo próprio (api/apple-touch-icon.js)
// de propósito: o plano Hobby da Vercel limita 12 Serverless Functions por
// deploy, e esse projeto já está no limite (ver api/cron/lembretes-
// agendamento.js) — um arquivo novo aqui empurraria pra 13 e derrubava o
// deploy inteiro (foi exatamente isso que aconteceu quando existiu).
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const ICONE_PADRAO = '/Imagens/Escudo_png.png'
const NOME_APP = 'EvaluaOS'

export default async function handler(req, res) {
  const token = typeof req.query.token === 'string' ? req.query.token : ''
  const pedirIcone = req.query.icone === '1'

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
          .select('logomarca_url')
          .eq('auth_id', paciente.id_avaliador)
          .maybeSingle()

        if (avaliador?.logomarca_url) icone = avaliador.logomarca_url
      }
    } catch (err) {
      console.error('manifest: falha ao buscar marca do avaliador', err)
    }
  }

  if (pedirIcone) {
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
    res.redirect(302, icone)
    return
  }

  const startUrl = token ? `/area/${token}` : '/'

  const manifest = {
    id: startUrl,
    name: NOME_APP,
    short_name: NOME_APP,
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
