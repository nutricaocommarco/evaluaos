// Edge Middleware — grava o cookie de "última Área do Paciente visitada"
// pelo cabeçalho HTTP (Set-Cookie), não por JavaScript no navegador.
//
// O ícone instalado na tela de início do iPhone ("Adicionar à Tela de
// Início" clássico) ignora o start_url do manifest e sempre abre em '/';
// App.jsx detecta isso (modo standalone) e redireciona sozinho pro último
// /area/:token visitado. Esse token precisa sobreviver por meses (o app é
// de acompanhamento nutricional contínuo, com o paciente podendo passar
// semanas sem abrir) — mas um cookie gravado via `document.cookie` (JS)
// é limitado pela Apple a no máximo 7 dias (proteção anti-rastreamento do
// Safari/ITP), não importa o Max-Age pedido. Cookies gravados pelo
// cabeçalho Set-Cookie de uma resposta HTTP de verdade NÃO têm esse teto.
//
// Roda só em /area/:token* — não intercepta o resto do site. Deixa a
// resposta normal (rewrite pro index.html da SPA, já configurado em
// vercel.json) passar direto, só anexa o cookie por cima.
export const config = {
  matcher: ['/area/:token*'],
}

const CHAVE = 'evaluaos_ultima_area_paciente'
const TRES_ANOS_EM_SEGUNDOS = 60 * 60 * 24 * 365 * 3

export default async function middleware(request) {
  const url = new URL(request.url)
  const match = url.pathname.match(/^\/area\/([^/]+)/)
  if (!match) return

  const token = match[1]
  const response = await fetch(request)
  const novaResposta = new Response(response.body, response)
  novaResposta.headers.append(
    'Set-Cookie',
    `${CHAVE}=${encodeURIComponent(token)}; Max-Age=${TRES_ANOS_EM_SEGUNDOS}; Path=/; SameSite=Lax`
  )
  return novaResposta
}
