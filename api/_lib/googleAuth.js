// Renova o access_token do Google usando o refresh_token salvo, se
// estiver perto de expirar. Compartilhado entre api/google/create-event.js
// e api/google/delete-event.js (mesma lógica, evita duplicar).
export async function renovarTokenSeNecessario(admin, uid, conexao) {
  const expiraEm = conexao.token_expiry ? new Date(conexao.token_expiry).getTime() : 0
  if (expiraEm - Date.now() > 60_000) return conexao.access_token // ainda válido por >60s

  if (!conexao.refresh_token) {
    throw new Error('Conexão com o Google expirou e não há refresh_token — reconecte em Nutricionista > Integrações.')
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: conexao.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenRes.ok) {
    throw new Error(tokenData.error_description || 'Falha ao renovar o token do Google')
  }

  const novoExpiry = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
  await admin
    .from('avaliadores_google_conexao')
    .update({ access_token: tokenData.access_token, token_expiry: novoExpiry, updated_at: new Date().toISOString() })
    .eq('id_avaliador', uid)

  return tokenData.access_token
}
