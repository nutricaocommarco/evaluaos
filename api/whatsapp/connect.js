import { getUidFromRequest } from '../_lib/auth.js'
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { createInstance, getQrCode } from '../_lib/evolution.js'

// Garante que o nutricionista tem uma instância na Evolution API e
// devolve o QR Code pra ele escanear. Chamado ao abrir o
// ModalConectarWhatsApp.jsx em Avaliador.jsx > Integrações.
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

  const { data: avaliador } = await admin
    .from('avaliadores')
    .select('id, whatsapp_instancia')
    .eq('auth_id', uid)
    .maybeSingle()

  if (!avaliador) {
    res.status(404).json({ error: 'Perfil de nutricionista não encontrado — salve o Painel do Nutricionista primeiro.' })
    return
  }

  const instancia = avaliador.whatsapp_instancia || `nutri_${uid}`

  try {
    if (!avaliador.whatsapp_instancia) {
      await admin.from('avaliadores').update({ whatsapp_instancia: instancia }).eq('id', avaliador.id)
      await createInstance(instancia)
    }

    const qr = await getQrCode(instancia)
    res.status(200).json({ instancia, qrcode: qr.base64 || qr.qrcode || qr.code || null })
  } catch (err) {
    // Instância pode já existir de uma tentativa anterior — nesse caso
    // só busca o QR Code de novo em vez de falhar.
    try {
      const qr = await getQrCode(instancia)
      res.status(200).json({ instancia, qrcode: qr.base64 || qr.qrcode || qr.code || null })
    } catch (err2) {
      console.error('whatsapp/connect: falha', err2)
      res.status(500).json({ error: err2.message || 'Falha ao conectar com a gateway do WhatsApp' })
    }
  }
}
