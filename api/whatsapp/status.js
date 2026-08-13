import { getUidFromRequest } from '../_lib/auth.js'
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { getConnectionState } from '../_lib/evolution.js'

// Consulta o estado da conexão na Evolution API e atualiza
// whatsapp_conectado/whatsapp_numero em avaliadores. O
// ModalConectarWhatsApp.jsx faz polling nisso a cada ~3s enquanto o QR
// Code está na tela, e fecha o modal sozinho quando `conectado` vira true.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' })
    return
  }

  const uid = await getUidFromRequest(req)
  if (!uid) {
    res.status(401).json({ error: 'Não autenticado' })
    return
  }

  const admin = getSupabaseAdmin()

  const { data: avaliador } = await admin
    .from('avaliadores')
    .select('id, whatsapp_instancia')
    .eq('auth_id', uid)
    .maybeSingle()

  if (!avaliador?.whatsapp_instancia) {
    res.status(200).json({ conectado: false })
    return
  }

  try {
    const estado = await getConnectionState(avaliador.whatsapp_instancia)
    const conectado = estado.instance?.state === 'open' || estado.state === 'open'
    const numero = estado.instance?.owner || estado.owner || null

    await admin
      .from('avaliadores')
      .update({ whatsapp_conectado: conectado, whatsapp_numero: numero })
      .eq('id', avaliador.id)

    res.status(200).json({ conectado, numero })
  } catch (err) {
    console.error('whatsapp/status: falha', err)
    res.status(200).json({ conectado: false })
  }
}
