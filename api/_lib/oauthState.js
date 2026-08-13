// Assina/valida o parâmetro `state` do fluxo OAuth do Google — é como o
// callback (api/google/callback.js) sabe qual nutricionista (uid) fez o
// pedido, sem depender de sessão/cookie no meio do redirect pro Google e
// de volta. Assinado com HMAC (GOOGLE_OAUTH_STATE_SECRET) pra um state
// adulterado (uid trocado) ser rejeitado.
import { createHmac, timingSafeEqual } from 'crypto'

const TTL_MS = 10 * 60 * 1000 // 10 minutos

function assinar(payload) {
  return createHmac('sha256', process.env.GOOGLE_OAUTH_STATE_SECRET)
    .update(payload)
    .digest('base64url')
}

export function criarState(uid) {
  const payload = Buffer.from(JSON.stringify({ uid, ts: Date.now() })).toString('base64url')
  const assinatura = assinar(payload)
  return `${payload}.${assinatura}`
}

export function validarState(state) {
  if (typeof state !== 'string' || !state.includes('.')) return null

  const [payload, assinatura] = state.split('.')
  const assinaturaEsperada = assinar(payload)

  const a = Buffer.from(assinatura)
  const b = Buffer.from(assinaturaEsperada)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  let dados
  try {
    dados = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'))
  } catch {
    return null
  }

  if (!dados?.uid || !dados?.ts) return null
  if (Date.now() - dados.ts > TTL_MS) return null

  return dados.uid
}
