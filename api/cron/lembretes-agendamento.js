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

// Check-in semanal: cria um novo envio de questionário automaticamente
// pra cada paciente com `id_questionario_semanal` configurado (Liga/Desliga
// por paciente em PacienteQuestionarios.jsx). Roda dentro do mesmo cron
// diário (só na segunda-feira) em vez de um cron próprio — o Vercel Hobby
// limita o total de Serverless Functions, e um arquivo novo só pra isso
// custaria uma função inteira por uma tarefa que roda 1x/semana. Sem
// nenhum envio de WhatsApp automático aqui: só cria a linha no banco, o
// paciente vê no Portal dele sozinho; o lembrete por WhatsApp continua
// manual (botão "Enviar Lembrete", mesmo link wa.me de sempre).
async function rodarCheckinSemanal(admin) {
  const { data: pacientes, error } = await admin
    .from('pacientes')
    .select('id, id_avaliador, id_questionario_semanal')
    .not('id_questionario_semanal', 'is', null)

  if (error) {
    console.error('cron checkin-semanal: falha ao buscar pacientes', error)
    return { criados: 0, pulados: 0, erros: 1 }
  }

  let criados = 0
  let pulados = 0
  let erros = 0
  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  for (const pac of pacientes || []) {
    try {
      const { data: envioRecente } = await admin
        .from('questionario_envios')
        .select('id')
        .eq('id_paciente', pac.id)
        .eq('id_questionario', pac.id_questionario_semanal)
        .gte('created_at', seteDiasAtras)
        .limit(1)
        .maybeSingle()

      if (envioRecente) { pulados++; continue }

      const { error: insertError } = await admin.from('questionario_envios').insert({
        id_questionario: pac.id_questionario_semanal,
        id_avaliador: pac.id_avaliador,
        id_paciente: pac.id,
      })
      if (insertError) throw insertError
      criados++
    } catch (err) {
      console.error(`cron checkin-semanal: falha pro paciente ${pac.id}`, err)
      erros++
    }
  }

  return { criados, pulados, erros }
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || ''
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Não autorizado' })
    return
  }

  const admin = getSupabaseAdmin()

  const checkinSemanal = new Date().getUTCDay() === 1 ? await rodarCheckinSemanal(admin) : null

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

  res.status(200).json({ enviados, pulados, erros, total: (agendamentos || []).length, checkinSemanal })
}
