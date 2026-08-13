import { getUidFromRequest } from '../_lib/auth.js'
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { renovarTokenSeNecessario } from '../_lib/googleAuth.js'

// Cancela o evento no Google Calendar quando o agendamento é excluído no
// EvaluaOS. Chamado por ModalDetalheAgendamento.jsx ANTES de apagar a
// linha em `agendamentos` (precisa do google_event_id, que some junto
// com a linha). Se o evento já não existir no Google (410/404) ou o
// agendamento nunca teve Google conectado, trata como sucesso — o fim
// desejado (evento não existe mais) já foi alcançado de qualquer jeito.
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

  const { agendamento_id } = req.body || {}
  if (!agendamento_id) {
    res.status(400).json({ error: 'agendamento_id é obrigatório' })
    return
  }

  const admin = getSupabaseAdmin()

  const { data: agendamento } = await admin
    .from('agendamentos')
    .select('id, google_event_id')
    .eq('id', agendamento_id)
    .eq('id_avaliador', uid)
    .maybeSingle()

  if (!agendamento?.google_event_id) {
    res.status(200).json({ success: true, skipped: true })
    return
  }

  const { data: conexao } = await admin
    .from('avaliadores_google_conexao')
    .select('access_token, refresh_token, token_expiry')
    .eq('id_avaliador', uid)
    .maybeSingle()

  if (!conexao) {
    res.status(200).json({ success: true, skipped: true })
    return
  }

  let accessToken
  try {
    accessToken = await renovarTokenSeNecessario(admin, uid, conexao)
  } catch (err) {
    res.status(400).json({ error: err.message })
    return
  }

  const deleteRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${agendamento.google_event_id}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!deleteRes.ok && deleteRes.status !== 404 && deleteRes.status !== 410) {
    const errData = await deleteRes.json().catch(() => null)
    console.error('delete-event: falha ao cancelar evento', errData)
    res.status(400).json({ error: errData?.error?.message || 'Falha ao cancelar o evento no Google Calendar' })
    return
  }

  res.status(200).json({ success: true })
}
