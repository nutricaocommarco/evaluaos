// Função serverless da Vercel — só é chamada pra robôs de rede social
// (WhatsApp, Facebook, etc; ver vercel.json) que abrem um link da Área do
// Paciente (/area/:token). Um navegador de verdade nunca cai aqui — vai
// direto pro app normal via o rewrite catch-all.
//
// Por quê: o app é uma SPA (index.html estático + JS), então as tags
// og:image/og:title do build (prerender-seo-evaluaos.js) são fixas e
// genéricas — não tem como saber em build time qual token/avaliador vai
// abrir cada link. Essa função busca a marca do avaliador (logo/nome do
// consultório) em tempo de requisição e devolve um HTML só com as meta
// tags certas pro robô ler, sem precisar renderizar o app inteiro.
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const DOMINIO = 'https://evaluaos.nutricaocommarco.com.br'
const IMAGEM_PADRAO = `${DOMINIO}/og_home.jpg`

function escapeHtml(valor) {
  return String(valor || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]))
}

export default async function handler(req, res) {
  const token = typeof req.query.token === 'string' ? req.query.token : ''

  let titulo = 'EvaluaOS | Área do Paciente'
  let descricao = 'Acompanhe sua evolução, laudo, plano alimentar, orientações e questionários — tudo em um só lugar.'
  let imagem = IMAGEM_PADRAO

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
          const nomeConsultorio = avaliador.empresa || avaliador.nome_completo || 'Consultório'
          titulo = `${nomeConsultorio} | Área do Paciente`
          descricao = `Acompanhe sua evolução, laudo, plano alimentar, orientações e questionários — direto de ${nomeConsultorio}.`
          if (avaliador.logomarca_url) imagem = avaliador.logomarca_url
        }
      }
    } catch (err) {
      // Nunca deixa um erro aqui derrubar o preview — pior caso, cai na
      // marca genérica do EvaluaOS.
      console.error('og-preview: falha ao buscar marca do avaliador', err)
    }
  }

  const urlAbsoluta = `${DOMINIO}/area/${token}`

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(titulo)}</title>
<meta name="description" content="${escapeHtml(descricao)}" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="EvaluaOS" />
<meta property="og:title" content="${escapeHtml(titulo)}" />
<meta property="og:description" content="${escapeHtml(descricao)}" />
<meta property="og:image" content="${escapeHtml(imagem)}" />
<meta property="og:image:secure_url" content="${escapeHtml(imagem)}" />
<meta property="og:url" content="${escapeHtml(urlAbsoluta)}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(titulo)}" />
<meta name="twitter:description" content="${escapeHtml(descricao)}" />
<meta name="twitter:image" content="${escapeHtml(imagem)}" />

<meta http-equiv="refresh" content="0; url=${escapeHtml(urlAbsoluta)}" />
</head>
<body>
<p>Redirecionando para <a href="${escapeHtml(urlAbsoluta)}">${escapeHtml(urlAbsoluta)}</a>...</p>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(html)
}
