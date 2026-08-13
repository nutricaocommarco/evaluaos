import { getUidFromRequest } from '../_lib/auth.js'
import { criarState } from '../_lib/oauthState.js'
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { verificarPro } from '../_lib/plano.js'

// Monta a URL de consentimento do Google pro nutricionista logado
// conectar a própria conta. `prompt=consent` força o Google a sempre
// devolver um refresh_token (ele só vem por padrão na primeira
// autorização de cada app+usuário — sem isso, reconectar depois de já
// ter conectado uma vez não traria um novo).
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' })
    return
  }

  const uid = await getUidFromRequest(req)
  if (!uid) {
    res.status(401).json({ error: 'Não autenticado' })
    return
  }

  const admin = getSupabaseAdmin()
  if (!(await verificarPro(admin, uid))) {
    res.status(403).json({ error: 'Conectar o Google Calendar é um recurso do Plano Pro.' })
    return
  }

  const redirectUri = `${req.headers.origin || `https://${req.headers.host}`}/oauth/google/callback`
  const state = criarState(uid)

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  res.status(200).json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` })
}
