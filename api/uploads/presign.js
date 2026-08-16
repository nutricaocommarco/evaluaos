import { randomUUID } from 'crypto'
import { getUidFromRequest } from '../_lib/auth.js'
import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js'
import { gerarUrlPresignedUpload } from '../_lib/r2.js'

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']
const TAMANHO_MAXIMO_BYTES = 2 * 1024 * 1024 // 2MB — a compressão client-side já mira nisso antes de pedir a URL

// Devolve uma URL pré-assinada do R2 pro navegador subir o arquivo direto
// (sem passar pela nossa function) e já grava a referência em
// imagens_nutricionista, pra aparecer na aba "Minhas Imagens" sem precisar
// de uma segunda chamada depois que o upload terminar.
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
