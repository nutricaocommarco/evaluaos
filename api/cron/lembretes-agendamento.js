import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { sendText } from '../_lib/evolution.js'
import { formatarNumeroWhatsapp } from '../_lib/telefone.js'

// Job diário (vercel.json > crons, 11h UTC ≈ 8h BRT) — Trigger B: avisa
// quem tem consulta amanhã e já pede confirmação de presença na mesma
// mensagem (ver inicioDoDiaBRT abaixo pra janela). Chama a Evolution API
// direto (não passa por api/whatsapp/send.js) porque já roda server-side
// com a service role key — não precisa do round-trip extra.
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

// Janela do lembrete = o dia de amanhã INTEIRO em horário de Brasília
// (meia-noite a meia-noite), não um deslocamento relativo ao instante em
// que o cron roda. Antes disso a janela era "agora +20h a +32h" — como o
// cron sempre roda no mesmo horário (8h BRT), isso virava sempre "amanhã
// das 4h às 16h": qualquer consulta marcada depois das 16h nunca caía
// dentro da janela, em nenhum dia, nunca. Brasil não tem mais horário de
// verão desde 2019, então UTC-3 fixo é seguro o ano todo.
function inicioDoDiaBRT(diasAFrente) {
  const agoraBRT = new Date(Date.now() - 3 * 60 * 60 * 1000)
  return new Date(Date.UTC(agoraBRT.getUTCFullYear(), agoraBRT.getUTCMonth(), agoraBRT.getUTCDate() + diasAFrente, 3, 0, 0))
}

const DOMINIO = 'https://evaluaos.nutricaocommarco.com.br'

// Check-in semanal: cria um novo envio de questionário automaticamente
// pra cada relação ativa em `checkins_semanais_pacientes` (um paciente pode
// ter mais de um check-in ativo ao mesmo tempo — ver 0047). Roda dentro do
// mesmo cron diário (só na segunda-feira) em vez de um cron próprio — o
// Vercel Hobby limita o total de Serverless Functions, e um arquivo novo só
// pra isso custaria uma função inteira por uma tarefa que roda 1x/semana.
// Sem nenhum envio de WhatsApp automático aqui: só cria a linha no banco, o
// paciente vê no Portal dele sozinho; o lembrete por WhatsApp continua
// manual (botão "Enviar Lembrete", mesmo link wa.me de sempre).
async function rodarCheckinSemanal(admin) {
  const { data: checkins, error } = await admin
    .from('checkins_semanais_pacientes')
    .select('id_paciente, id_questionario, id_avaliador')

  if (error) {
    console.error('cron checkin-semanal: falha ao buscar checkins ativos', error)
    return { criados: 0, pulados: 0, erros: 1 }
  }

  let criados = 0
  let pulados = 0
  let erros = 0
  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  for (const checkin of checkins || []) {
    try {
      const { data: envioRecente } = await admin
        .from('questionario_envios')
        .select('id')
        .eq('id_paciente', checkin.id_paciente)
        .eq('id_questionario', checkin.id_questionario)
        .gte('created_at', seteDiasAtras)
        .limit(1)
        .maybeSingle()

      if (envioRecente) { pulados++; continue }

      const { error: insertError } = await admin.from('questionario_envios').insert({
        id_questionario: checkin.id_questionario,
        id_avaliador: checkin.id_avaliador,
        id_paciente: checkin.id_paciente,
      })
      if (insertError) throw insertError
      criados++
    } catch (err) {
      console.error(`cron checkin-semanal: falha pro checkin paciente=${checkin.id_paciente} questionario=${checkin.id_questionario}`, err)
      erros++
    }
  }

  return { criados, pulados, erros }
}

// Recorrência financeira mensal: uma movimentação com recorrente=true é o
// "molde" (ela própria já é uma movimentação real do mês em que foi
// criada) — todo dia 1, gera uma cópia pro mês corrente pra cada molde que
// ainda não tem cópia nesse mês (id_origem aponta a cópia de volta pro
// molde, e é isso que a checagem usa pra não duplicar). Mesmo raciocínio
// de reaproveitar o cron diário existente em vez de criar um novo — só
// roda uma vez por mês (getUTCDate() === 1), sem função nova no Vercel.
async function rodarRecorrenciasFinanceiras(admin) {
  const hoje = new Date()
  const anoMes = `${hoje.getUTCFullYear()}-${String(hoje.getUTCMonth() + 1).padStart(2, '0')}`
  const ultimoDiaMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 0)).getUTCDate()

  const { data: moldes, error } = await admin
    .from('movimentacoes_financeiras')
    .select('*')
    .eq('recorrente', true)

  if (error) {
    console.error('cron financeiro-recorrente: falha ao buscar moldes', error)
    return { criados: 0, pulados: 0, erros: 1 }
  }

  let criados = 0
  let pulados = 0
  let erros = 0

  for (const molde of moldes || []) {
    try {
      if (molde.data?.slice(0, 7) === anoMes) { pulados++; continue }

      const { data: copiaExistente } = await admin
        .from('movimentacoes_financeiras')
        .select('id')
        .eq('id_origem', molde.id)
        .gte('data', `${anoMes}-01`)
        .lte('data', `${anoMes}-31`)
        .limit(1)
        .maybeSingle()

      if (copiaExistente) { pulados++; continue }

      const dia = Math.min(Number(molde.data.slice(8, 10)), ultimoDiaMes)
      const { error: insertError } = await admin.from('movimentacoes_financeiras').insert({
        id_avaliador: molde.id_avaliador,
        id_paciente: molde.id_paciente,
        tipo: molde.tipo,
        descricao: molde.descricao,
        categoria: molde.categoria,
        valor: molde.valor,
        data: `${anoMes}-${String(dia).padStart(2, '0')}`,
        pago: false,
        recorrente: false,
        id_origem: molde.id,
      })
      if (insertError) throw insertError
      criados++
    } catch (err) {
      console.error(`cron financeiro-recorrente: falha pro molde ${molde.id}`, err)
      erros++
    }
  }

  return { criados, pulados, erros }
}

// Indique & Ganhe: resumo diário por e-mail (via Formspree, mesmo serviço
// já usado nos formulários do blog — sem precisar de chave de API nova)
// com indicações novas nas últimas 24h + indicações que acabaram de
// liberar pagamento (virou_pro_em + 7 dias caiu nesse intervalo) + um
// lembrete de qualquer coisa liberada em dias anteriores que ainda não
// foi paga. Reaproveita o cron diário existente — mesmo raciocínio do
// checkin semanal/financeiro recorrente, sem função nova no Vercel.
const FORMSPREE_INDICACOES = 'https://formspree.io/f/xjybazkg'

function fmtMoeda(n) {
  return (Number(n) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

async function rodarNotificacaoIndicacoes(admin) {
  const agora = new Date()
  const ontem = new Date(agora.getTime() - 24 * 60 * 60 * 1000)

  const { data: novos, error: errNovos } = await admin
    .from('avaliadores')
    .select('nome_completo, email, created_at, indicador:indicado_por(nome_completo, email)')
    .not('indicado_por', 'is', null)
    .gte('created_at', ontem.toISOString())

  const { data: aPagar, error: errPagar } = await admin
    .from('indicacoes_a_pagar')
    .select('*')

  if (errNovos || errPagar) {
    console.error('cron indicacoes: falha ao buscar dados', errNovos || errPagar)
    return { enviado: false, erro: true }
  }

  const liberadasHoje = (aPagar || []).filter((i) => new Date(i.liberado_em) >= ontem)
  const pendentesAntigas = (aPagar || []).filter((i) => new Date(i.liberado_em) < ontem)

  if (!novos?.length && !liberadasHoje.length) return { enviado: false }

  const linhas = []
  if (novos?.length) {
    linhas.push(`🆕 ${novos.length} indicação(ões) nova(s) nas últimas 24h:`)
    novos.forEach((n) => linhas.push(`  - ${n.indicador?.nome_completo || n.indicador?.email || '?'} indicou ${n.nome_completo || n.email}`))
    linhas.push('')
  }
  if (liberadasHoje.length) {
    linhas.push(`💰 ${liberadasHoje.length} indicação(ões) liberada(s) pra pagamento agora:`)
    liberadasHoje.forEach((i) => linhas.push(`  - ${i.indicador_nome}: pagar ${fmtMoeda(i.valor_a_pagar)} via Pix (${i.indicador_pix || 'sem chave cadastrada'}) — indicado: ${i.indicado_nome}`))
    linhas.push('')
  }
  if (pendentesAntigas.length) {
    linhas.push(`⏳ Lembrete: ${pendentesAntigas.length} indicação(ões) liberada(s) em dias anteriores ainda esperando pagamento.`)
  }

  try {
    await fetch(FORMSPREE_INDICACOES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _subject: 'EvaluaOS — Indique & Ganhe: resumo diário', resumo: linhas.join('\n') }),
    })
    return { enviado: true, novos: novos?.length || 0, liberadasHoje: liberadasHoje.length, pendentesAntigas: pendentesAntigas.length }
  } catch (err) {
    console.error('cron indicacoes: falha ao notificar Formspree', err)
    return { enviado: false, erro: true }
  }
}

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || ''
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Não autorizado' })
    return
  }

  const admin = getSupabaseAdmin()

  const checkinSemanal = new Date().getUTCDay() === 1 ? await rodarCheckinSemanal(admin) : null
  const financeiroRecorrente = new Date().getUTCDate() === 1 ? await rodarRecorrenciasFinanceiras(admin) : null
  const indicacoes = await rodarNotificacaoIndicacoes(admin)

  const inicioJanela = inicioDoDiaBRT(1).toISOString()
  const fimJanela = inicioDoDiaBRT(2).toISOString()

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

  res.status(200).json({ enviados, pulados, erros, total: (agendamentos || []).length, checkinSemanal, financeiroRecorrente, indicacoes })
}
