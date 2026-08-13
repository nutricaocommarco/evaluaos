// Client de service role — só usado dentro de funções serverless
// (api/**), nunca no client. Ignora RLS por completo, então é o único
// jeito de ler/escrever avaliadores_google_conexao (0040, RLS sem
// nenhuma policy) e o único lugar que deveria estar gravando tokens do
// Google ou chamando a gateway do WhatsApp em nome de outra pessoa.
import { createClient } from '@supabase/supabase-js'

export function getSupabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
