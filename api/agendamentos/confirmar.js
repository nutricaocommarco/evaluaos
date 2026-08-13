import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'

// Marca um agendamento como confirmado pelo paciente, via link clicável
// mandado no lembrete do WhatsApp (Trigger B) — substitui "responda SIM",
// que exigiria processar mensagens recebidas (fora de escopo). Só marca
// no clique de um botão de verdade (ConfirmarAgendamento.jsx), nunca no
// simples carregamento da página — importante pra não confirmar sozinho
// quando o WhatsApp gera o preview do link (mesmo cuidado já tomado pra
// /area/:token em vercel.json/api/og-preview.js).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' })
    return
  }

  const { token } = req.body || {}
  if (!token) {
    res.status(400).json({ error: 'token é obrigatório' })
    return
  }

  const admin = getSupabaseAdmin()

  const { data: agendamento, error } = await admin
    .from('agendamentos')
    .update({ confirmado_pelo_paciente: true, confirmado_em: new Date().toISOString() })
    .eq('token_confirmacao', token)
    .select('id')
    .maybeSingle()

  if (error) {
    res.status(500).json({ error: 'Falha ao confirmar' })
    return
  }
  if (!agendamento) {
    res.status(404).json({ error: 'Agendamento não encontrado' })
    return
  }

  res.status(200).json({ success: true })
}
