// Resolve qual nutricionista (auth.uid()) está chamando uma função
// serverless, a partir do access token do Supabase que o client manda
// no header Authorization. Usa o client anon (não o admin) só pra
// validar o token — é a forma padrão do supabase-js de checar "quem é
// esse JWT", sem precisar decodificar nada na mão.
import { createClient } from '@supabase/supabase-js'

export async function getUidFromRequest(req) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null

  const supabaseAnon = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )
  const { data, error } = await supabaseAnon.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user.id
}
