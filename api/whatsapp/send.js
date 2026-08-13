import { getUidFromRequest } from '../_lib/auth.js'
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { sendText } from '../_lib/evolution.js'
import { formatarNumeroWhatsapp } from '../_lib/telefone.js'

// Único caminho que o frontend usa pra mandar uma mensagem — nunca
// chama a Evolution API direto (vazaria a EVOLUTION_API_KEY). Hoje só
// dispara o aviso de confirmação (Trigger A) logo após criar um
// agendamento; o lembrete diário (Trigger B) é enviado direto pelo cron
// (api/cron/lembretes-agendamento.js), que já roda server-side e não
// precisa passar por aqui.
function formatarDataHora(dataIso) {
  return new Date(dataIso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
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

  const { data: avaliador } = await admin
    .from('avaliadores')
    .select('whatsapp_instancia, whatsapp_conectado, nome_completo, empresa')
    .eq('auth_id', uid)
    .maybeSingle()

  if (!avaliador?.whatsapp_conectado || !avaliador?.whatsapp_instancia) {
    res.status(400).json({ error: 'WhatsApp não conectado' })
    return
  }

  const { data: agendamento } = await admin
    .from('agendamentos')
    .select('id, data_inicio, local, pacientes(nome_completo, telefone)')
    .eq('id', agendamento_id)
    .eq('id_avaliador', uid)
    .maybeSingle()

  if (!agendamento) {
    res.status(404).json({ error: 'Agendamento não encontrado' })
    return
  }

  const numero = formatarNumeroWhatsapp(agendamento.pacientes?.telefone)
  if (!numero) {
    res.status(400).json({ error: 'Paciente sem telefone cadastrado' })
    return
  }

  const nomeConsultorio = avaliador.empresa || avaliador.nome_completo || 'seu nutricionista'
  const texto = `Olá, ${agendamento.pacientes?.nome_completo || ''}! Sua consulta com ${nomeConsultorio} foi marcada para ${formatarDataHora(agendamento.data_inicio)}${agendamento.local ? ` (${agendamento.local})` : ''}.`

  try {
    await sendText(avaliador.whatsapp_instancia, numero, texto)
  } catch (err) {
    console.error('whatsapp/send: falha ao enviar', err)
    res.status(500).json({ error: err.message || 'Falha ao enviar a mensagem' })
    return
  }

  await admin
    .from('agendamentos')
    .update({ whatsapp_confirmacao_enviada_em: new Date().toISOString() })
    .eq('id', agendamento.id)

  res.status(200).json({ success: true })
}
