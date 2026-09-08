// O iOS ignora o start_url do manifest no "Adicionar à Tela de Início"
// clássico (confirmado: o ícone sempre abre em '/', não importa o que o
// manifest diga) — então o jeito é App.jsx detectar isso e redirecionar
// sozinho pro último /area/:token visitado, salvo por AreaPaciente.jsx.
//
// Isso PRECISA ser cookie, não localStorage: confirmado em aparelho real
// (debug em App.jsx) que o app aberto pela tela de início roda numa área
// de armazenamento separada da aba normal do Safari — o localStorage
// gravado numa visita normal fica invisível pro app instalado depois.
// Cookie (sem HttpOnly, Max-Age longo) atravessa essa fronteira porque é
// enviado pelo próprio navegador na requisição, não lido de um storage
// isolado por contexto.
export const CHAVE_ULTIMA_AREA_PACIENTE = 'evaluaos_ultima_area_paciente'

export function emModoStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

const UM_ANO_EM_SEGUNDOS = 60 * 60 * 24 * 365

export function salvarUltimaAreaPaciente(tokenUrl) {
  try {
    localStorage.setItem(CHAVE_ULTIMA_AREA_PACIENTE, tokenUrl)
  } catch (err) {
    // Safari em modo privado pode bloquear localStorage — cookie abaixo
    // ainda funciona.
  }
  document.cookie = `${CHAVE_ULTIMA_AREA_PACIENTE}=${encodeURIComponent(tokenUrl)}; max-age=${UM_ANO_EM_SEGUNDOS}; path=/; SameSite=Lax`
}

export function lerUltimaAreaPaciente() {
  try {
    const doLocalStorage = localStorage.getItem(CHAVE_ULTIMA_AREA_PACIENTE)
    if (doLocalStorage) return doLocalStorage
  } catch (err) {
    // segue pro cookie
  }
  const match = document.cookie.match(new RegExp('(?:^|; )' + CHAVE_ULTIMA_AREA_PACIENTE + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}
