import { getUidFromRequest } from '../_lib/auth.js'

// Proxy simples pra busca da Pexels — mantém a chave de API só no
// servidor (nunca exposta no bundle do navegador) e de quebra dá controle
// sobre o rate limit (200 req/hora no free tier da Pexels).
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
  if (!busca) {
    res.status(200).json({ fotos: [] })
    return
  }

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(busca)}&per_page=24&locale=pt-BR`
  const resposta = await fetch(url, { headers: { Authorization: process.env.PEXELS_API_KEY } })

  if (!resposta.ok) {
    res.status(502).json({ error: 'Falha ao buscar imagens na Pexels' })
    return
  }

  const dados = await resposta.json()
  const fotos = (dados.photos || []).map((f) => ({
    id: f.id,
    urlMiniatura: f.src.medium,
    urlCompleta: f.src.large2x,
    fotografo: f.photographer,
    fotografoUrl: f.photographer_url,
  }))

  res.status(200).json({ fotos })
}
