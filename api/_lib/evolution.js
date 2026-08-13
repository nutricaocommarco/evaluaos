// Chamadas pra gateway Evolution API (WhatsApp self-hosted, protocolo
// QR Code/Baileys) — módulo compartilhado, não é um endpoint. Usado por
// api/whatsapp/*.js e pelo cron de lembretes, pra evitar o cron ter que
// fazer uma chamada HTTP extra pra outra função da própria Vercel.
// EVOLUTION_API_URL/EVOLUTION_API_KEY só existem como env var — nunca
// chegam ao client.

function baseUrl() {
  return process.env.EVOLUTION_API_URL.replace(/\/$/, '')
}

async function chamar(caminho, opcoes = {}) {
  const res = await fetch(`${baseUrl()}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.EVOLUTION_API_KEY,
      ...(opcoes.headers || {}),
    },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = data?.message || data?.error || `Evolution API respondeu ${res.status}`
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg)
  }
  return data
}

export function createInstance(instanceName) {
  return chamar('/instance/create', {
    method: 'POST',
    body: JSON.stringify({ instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
  })
}

export function getConnectionState(instanceName) {
  return chamar(`/instance/connectionState/${instanceName}`, { method: 'GET' })
}

export function getQrCode(instanceName) {
  return chamar(`/instance/connect/${instanceName}`, { method: 'GET' })
}

export function sendText(instanceName, numero, texto) {
  return chamar(`/message/sendText/${instanceName}`, {
    method: 'POST',
    body: JSON.stringify({ number: numero, text: texto }),
  })
}
