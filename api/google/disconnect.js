import { getUidFromRequest } from '../_lib/auth.js'
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'

// Desconecta a conta Google do nutricionista: revoga o token direto com o
// Google (invalida de verdade do lado deles, não só localmente) e apaga o
// registro em avaliadores_google_conexao. Se a revogação no Google falhar
// (token já expirado/inválido, por exemplo), segue com a limpeza local
// mesmo assim — o objetivo (nutricionista sem acesso conectado) já é
// alcançado de qualquer jeito.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' })
    return
  }

  const uid = await getUidFromRequest(req)
  if (!uid) {
    res.status(401).json({ error: 'Não autenticado' })
    return
  }

  const admin = getSupabaseAdmin()

  const { data: conexao } = await admin
    .from('avaliadores_google_conexao')
    .select('access_token, refresh_token')
    .eq('id_avaliador', uid)
    .maybeSingle()

  if (conexao?.refresh_token) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(conexao.refresh_token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    } catch (err) {
      console.error('disconnect: falha ao revogar token no Google', err)
    }
  }

  await admin.from('avaliadores_google_conexao').delete().eq('id_avaliador', uid)
  await admin.from('avaliadores').update({ google_calendar_conectado: false, google_calendar_email: null }).eq('auth_id', uid)

  res.status(200).json({ success: true })
}
