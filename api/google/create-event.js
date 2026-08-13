import { getUidFromRequest } from '../_lib/auth.js'
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'

// Cria o evento no Google Calendar (com Meet automático) pro agendamento
// já inserido em `agendamentos`, e grava google_event_id/google_meet_link
// de volta na linha. Chamado pelo ModalCriarAgendamento.jsx logo após o
// insert, só quando o nutricionista tem o Google conectado.
async function renovarTokenSeNecessario(admin, uid, conexao) {
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

  const { data: agendamento, error: agendamentoError } = await admin
    .from('agendamentos')
    .select('id, id_avaliador, titulo, data_inicio, data_fim, fuso_horario, local, pacientes(nome_completo)')
    .eq('id', agendamento_id)
    .eq('id_avaliador', uid)
    .maybeSingle()

  if (agendamentoError || !agendamento) {
    res.status(404).json({ error: 'Agendamento não encontrado' })
    return
  }

  const { data: conexao } = await admin
    .from('avaliadores_google_conexao')
    .select('access_token, refresh_token, token_expiry')
    .eq('id_avaliador', uid)
    .maybeSingle()

  if (!conexao) {
    res.status(400).json({ error: 'Google Calendar não conectado' })
    return
  }

  let accessToken
  try {
    accessToken = await renovarTokenSeNecessario(admin, uid, conexao)
  } catch (err) {
    res.status(400).json({ error: err.message })
    return
  }

  const nomePaciente = agendamento.pacientes?.nome_completo || 'Paciente'
  const evento = {
    summary: agendamento.titulo || `Consulta — ${nomePaciente}`,
    location: agendamento.local || undefined,
    start: { dateTime: agendamento.data_inicio, timeZone: agendamento.fuso_horario },
    end: { dateTime: agendamento.data_fim, timeZone: agendamento.fuso_horario },
    conferenceData: {
      createRequest: { requestId: `agendamento-${agendamento.id}-${Date.now()}` },
    },
  }

  const eventoRes = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(evento),
    }
  )
  const eventoData = await eventoRes.json()

  if (!eventoRes.ok) {
    console.error('create-event: falha ao criar evento', eventoData)
    res.status(400).json({ error: eventoData.error?.message || 'Falha ao criar o evento no Google Calendar' })
    return
  }

  const meetLink = eventoData.conferenceData?.entryPoints?.find((p) => p.entryPointType === 'video')?.uri || null

  await admin
    .from('agendamentos')
    .update({ google_event_id: eventoData.id, google_meet_link: meetLink, updated_at: new Date().toISOString() })
    .eq('id', agendamento.id)

  res.status(200).json({ google_event_id: eventoData.id, google_meet_link: meetLink })
}
