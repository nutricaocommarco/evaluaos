import { getUidFromRequest } from '../_lib/auth.js'
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'

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

  const busca = (req.query.busca || '').trim()
  const admin = getSupabaseAdmin()

  let query = admin
    .from('imagens_nutricionista')
    .select('id, url, nome_arquivo, created_at')
    .eq('id_avaliador', uid)
    .order('created_at', { ascending: false })
    .limit(60)

  if (busca) query = query.ilike('nome_arquivo', `%${busca}%`)

  const { data, error } = await query
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.status(200).json({ imagens: data || [] })
}
