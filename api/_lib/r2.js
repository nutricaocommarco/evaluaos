// Cliente S3-compatível apontando pro Cloudflare R2. Só usado dentro de
// funções serverless (api/**) — as credenciais nunca chegam no navegador.
// O upload em si é feito DIRETO do navegador pro R2 via URL pré-assinada
// (ver api/uploads/presign.js): isso evita passar o arquivo pela nossa
// function, que no plano Hobby da Vercel tem limite de ~4.5MB por request.
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  })
}

export async function gerarUrlPresignedUpload(chave, contentType) {
  const client = getR2Client()
  const comando = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: chave,
    ContentType: contentType,
  })
  const urlUpload = await getSignedUrl(client, comando, { expiresIn: 300 })
  const urlPublica = `${process.env.R2_PUBLIC_URL}/${chave}`
  return { urlUpload, urlPublica }
}
