import { randomUUID } from 'crypto'
import { getUidFromRequest } from '../_lib/auth.js'
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { gerarUrlPresignedUpload } from '../_lib/r2.js'

// Os 3 endpoints do seletor de imagens (presign upload, listar/buscar
// "Minhas Imagens", buscar na Pexels) juntos num arquivo só — o Vercel
// Hobby limita a 12 Serverless Functions por deploy, e cada arquivo em
// api/** (fora de _lib) conta como uma função separada. Dispatch por
// método + ?recurso=.

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']
const TAMANHO_MAXIMO_BYTES = 2 * 1024 * 1024 // 2MB — a compressão client-side já mira nisso

async function handlePresign(req, res, uid) {
  const { nomeArquivo, contentType, tamanhoBytes } = req.body || {}
  if (!nomeArquivo || !contentType) {
    res.status(400).json({ error: 'nomeArquivo e contentType são obrigatórios' })
    return
  }
  if (!TIPOS_PERMITIDOS.includes(contentType)) {
    res.status(400).json({ error: 'Formato de imagem não suportado (use JPEG, PNG ou WEBP)' })
    return
  }
  if (tamanhoBytes && tamanhoBytes > TAMANHO_MAXIMO_BYTES) {
    res.status(400).json({ error: 'Imagem acima do limite de 2MB' })
    return
  }

  const extensao = nomeArquivo.split('.').pop().toLowerCase()
  const chave = `avaliadores/${uid}/imagens/${randomUUID()}.${extensao}`

  const { urlUpload, urlPublica } = await gerarUrlPresignedUpload(chave, contentType)

  const admin = getSupabaseAdmin()
  const { error } = await admin.from('imagens_nutricionista').insert({
    id_avaliador: uid,
    url: urlPublica,
    chave_r2: chave,
    nome_arquivo: nomeArquivo,
  })
  if (error) {
    res.status(500).json({ error: 'Falha ao registrar imagem: ' + error.message })
    return
  }

  res.status(200).json({ urlUpload, urlPublica })
}

async function handleMinhasImagens(req, res, uid) {
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

async function handlePexelsSearch(req, res) {
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

export default async function handler(req, res) {
  const uid = await getUidFromRequest(req)
  if (!uid) {
    res.status(401).json({ error: 'Não autenticado' })
    return
  }

  if (req.method === 'POST') {
    await handlePresign(req, res, uid)
    return
  }

  if (req.method === 'GET') {
    if (req.query.recurso === 'pexels') {
      await handlePexelsSearch(req, res)
      return
    }
    await handleMinhasImagens(req, res, uid)
    return
  }

  res.status(405).json({ error: 'Método não permitido' })
}
