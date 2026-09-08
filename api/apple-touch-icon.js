// Ícone da PWA no iPhone — o Safari NÃO lê o array `icons` do manifest.json
// pra "Adicionar à Tela de Início" (limitação conhecida do WebKit), só o
// <link rel="apple-touch-icon">. Esse link é estático no index.html (ícone
// genérico do EvaluaOS); index.html troca o href pra apontar aqui, por
// token, no mesmo espírito de api/manifest.js (que resolve o ícone certo
// pro Android). 302 em vez de servir a imagem direto: a logomarca já é uma
// URL pública do Supabase Storage, não precisa proxiar bytes por aqui.
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const ICONE_PADRAO = '/Imagens/Escudo_png.png'

export default async function handler(req, res) {
  const token = typeof req.query.token === 'string' ? req.query.token : ''

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
      console.error('apple-touch-icon: falha ao buscar marca do avaliador', err)
    }
  }

  res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
  res.redirect(302, icone)
}
