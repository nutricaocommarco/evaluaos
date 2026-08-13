import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { sendText } from '../_lib/evolution.js'
import { formatarNumeroWhatsapp } from '../_lib/telefone.js'

// Job diário (vercel.json > crons, 11h UTC ≈ 8h BRT) — Trigger B: avisa
// quem tem consulta nas próximas ~24h e já pede confirmação de presença
// na mesma mensagem. Janela de 20h a 32h à frente cobre "amanhã" com
// folga pro horário exato do cron não bater cravado. Chama a Evolution
// API direto (não passa por api/whatsapp/send.js) porque já roda
// server-side com a service role key — não precisa do round-trip extra.
// O servidor roda em UTC — sem passar timeZone explícito, toLocaleString
// não converte pro fuso do agendamento sozinho.
function formatarHora(dataIso, fusoHorario) {
  return new Date(dataIso).toLocaleString('pt-BR', {
    timeZone: fusoHorario || 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit',
  })
}

function primeiroNome(nomeCompleto) {
  return (nomeCompleto || '').trim().split(' ')[0] || ''
}

const DOMINIO = 'https://evaluaos.nutricaocommarco.com.br'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || ''
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Não autorizado' })
    return
  }

  const admin = getSupabaseAdmin()

  const agora = new Date()
  const inicioJanela = new Date(agora.getTime() + 20 * 60 * 60 * 1000).toISOString()
  const fimJanela = new Date(agora.getTime() + 32 * 60 * 60 * 1000).toISOString()

  const { data: agendamentos, error } = await admin
    .from('agendamentos')
    .select('id, data_inicio, local, fuso_horario, pacientes(nome_completo, telefone, token_publico), avaliadores:id_avaliador(nome_completo, empresa, whatsapp_instancia, whatsapp_conectado)')
    .eq('status', 'confirmado')
    .is('whatsapp_lembrete_enviado_em', null)
    .gte('data_inicio', inicioJanela)
    .lt('data_inicio', fimJanela)

  if (error) {
    console.error('cron lembretes: falha ao buscar agendamentos', error)
    res.status(500).json({ error: error.message })
    return
  }

  let enviados = 0
  let pulados = 0
  let erros = 0

  for (const ag of agendamentos || []) {
    const avaliador = ag.avaliadores
    const numero = formatarNumeroWhatsapp(ag.pacientes?.telefone)

    if (!avaliador?.whatsapp_conectado || !avaliador?.whatsapp_instancia || !numero) {
      pulados++
      continue
    }

    const nomeConsultorio = avaliador.empresa || avaliador.nome_completo || 'seu nutricionista'
    const linkConfirmacao = `${DOMINIO}/area/${ag.pacientes?.token_publico}/agenda`
    const texto = [
      `Olá, ${primeiroNome(ag.pacientes?.nome_completo)}! ⏰`,
      '',
      `Lembrete da sua consulta com *${nomeConsultorio}*:`,
      '',
      `🗓️ Amanhã, ${formatarHora(ag.data_inicio, ag.fuso_horario)}`,
      ag.local ? `📍 ${ag.local}` : null,
      '',
      'Por favor, confirme sua presença:',
      linkConfirmacao,
    ].filter((l) => l !== null).join('\n')

    try {
      await sendText(avaliador.whatsapp_instancia, numero, texto)
      await admin
        .from('agendamentos')
        .update({ whatsapp_lembrete_enviado_em: new Date().toISOString() })
        .eq('id', ag.id)
      enviados++
    } catch (err) {
      console.error(`cron lembretes: falha ao enviar pro agendamento ${ag.id}`, err)
      erros++
    }
  }

  res.status(200).json({ enviados, pulados, erros, total: (agendamentos || []).length })
}
