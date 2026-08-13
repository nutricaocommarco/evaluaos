// Mesma regra de isPro do PlanoContext.jsx (client), pra checar plano
// server-side antes de gastar uma das 100 vagas de OAuth do Google (ou
// criar uma instância na gateway do WhatsApp) — o Free só vê o botão
// desabilitado no client, mas quem chamasse a API direto sem isso
// ainda conseguiria conectar de graça.
export async function verificarPro(admin, uid) {
  const { data } = await admin
    .from('avaliadores')
    .select('plano_status')
    .eq('auth_id', uid)
    .maybeSingle()

  const status = (data?.plano_status || '').toLowerCase()
  return status === 'pro' || status === 'ativo' || status === 'beta'
}
