import { getUidFromRequest } from '../_lib/auth.js'
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { renovarTokenSeNecessario } from '../_lib/googleAuth.js'

// Criar evento, cancelar evento e desconectar a conta — juntos num arquivo
// só. O Vercel Hobby limita a 12 Serverless Functions por deploy, e cada
// arquivo em api/** (fora de _lib) conta como uma função separada. Dispatch
// por req.body.acao (todos os 3 já eram POST).

async function handleCriarEvento(req, res, uid, admin) {
  const { agendamento_id } = req.body || {}
  if (!agendamento_id) {
    res.status(400).json({ error: 'agendamento_id é obrigatório' })
    return
  }

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
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(evento),
    }
  )
  const eventoData = await eventoRes.json()

  if (!eventoRes.ok) {
    console.error('gerenciar/criar-evento: falha ao criar evento', eventoData)
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

async function handleExcluirEvento(req, res, uid, admin) {
  const { agendamento_id } = req.body || {}
  if (!agendamento_id) {
    res.status(400).json({ error: 'agendamento_id é obrigatório' })
    return
  }

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
    console.error('gerenciar/excluir-evento: falha ao cancelar evento', errData)
    res.status(400).json({ error: errData?.error?.message || 'Falha ao cancelar o evento no Google Calendar' })
    return
  }

  res.status(200).json({ success: true })
}

async function handleDesconectar(req, res, uid, admin) {
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
      console.error('gerenciar/desconectar: falha ao revogar token no Google', err)
    }
  }

  await admin.from('avaliadores_google_conexao').delete().eq('id_avaliador', uid)
  await admin.from('avaliadores').update({ google_calendar_conectado: false, google_calendar_email: null }).eq('auth_id', uid)

  res.status(200).json({ success: true })
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

  const admin = getSupabaseAdmin()
  const { acao } = req.body || {}

  if (acao === 'criar-evento') return handleCriarEvento(req, res, uid, admin)
  if (acao === 'excluir-evento') return handleExcluirEvento(req, res, uid, admin)
  if (acao === 'desconectar') return handleDesconectar(req, res, uid, admin)

  res.status(400).json({ error: 'acao inválida' })
}
