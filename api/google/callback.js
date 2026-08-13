import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { validarState } from '../_lib/oauthState.js'

// Troca o `code` do Google por tokens e grava a conexão do nutricionista.
// Chamado pela tela GoogleOAuthCallback.jsx logo depois do redirect de
// volta do Google — a troca de code por token acontece só aqui (nunca no
// client), porque exige o Client Secret.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' })
    return
  }

  const { code, state } = req.body || {}
  if (!code || !state) {
    res.status(400).json({ error: 'code e state são obrigatórios' })
    return
  }

  const uid = validarState(state)
  if (!uid) {
    res.status(400).json({ error: 'state inválido ou expirado — tente conectar novamente' })
    return
  }

  const redirectUri = `${req.headers.origin || `https://${req.headers.host}`}/oauth/google/callback`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const tokenData = await tokenRes.json()

  if (!tokenRes.ok) {
    console.error('google callback: falha ao trocar code por token', tokenData)
    res.status(400).json({ error: tokenData.error_description || 'Falha ao conectar com o Google' })
    return
  }

  const { access_token, refresh_token, expires_in, scope } = tokenData

  let googleEmail = null
  try {
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (infoRes.ok) {
      const info = await infoRes.json()
      googleEmail = info.email || null
    }
  } catch (err) {
    console.error('google callback: falha ao buscar userinfo', err)
  }

  const admin = getSupabaseAdmin()

  // refresh_token só vem do Google na primeira autorização — se essa
  // conexão já existir e o Google não reenviar um novo, preserva o que
  // já estava salvo em vez de sobrescrever com null.
  const { data: existente } = await admin
    .from('avaliadores_google_conexao')
    .select('refresh_token')
    .eq('id_avaliador', uid)
    .maybeSingle()

  const refreshTokenFinal = refresh_token || existente?.refresh_token || null

  const { error: upsertError } = await admin
    .from('avaliadores_google_conexao')
    .upsert({
      id_avaliador: uid,
      google_email: googleEmail,
      access_token,
      refresh_token: refreshTokenFinal,
      token_expiry: new Date(Date.now() + expires_in * 1000).toISOString(),
      escopo: scope || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id_avaliador' })

  if (upsertError) {
    console.error('google callback: falha ao gravar conexão', upsertError)
    res.status(500).json({ error: 'Falha ao salvar a conexão com o Google' })
    return
  }

  await admin
    .from('avaliadores')
    .update({ google_calendar_conectado: true, google_calendar_email: googleEmail })
    .eq('auth_id', uid)

  res.status(200).json({ success: true, google_email: googleEmail })
}
