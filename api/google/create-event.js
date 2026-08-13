import { getUidFromRequest } from '../_lib/auth.js'
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { renovarTokenSeNecessario } from '../_lib/googleAuth.js'

// Cria o evento no Google Calendar (com Meet automático) pro agendamento
// já inserido em `agendamentos`, e grava google_event_id/google_meet_link
// de volta na linha. Chamado pelo ModalCriarAgendamento.jsx logo após o
// insert, só quando o nutricionista tem o Google conectado.

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
