// O manifest da PWA tem um start_url fixo ('/'), então o ícone instalado
// sempre abre a home pública, não importa de qual link do paciente ele foi
// instalado. Pra contornar isso: toda vez que a Área do Paciente carrega
// sem sessão ativa, guarda o token no aparelho; quando o app instalado abre
// na home sem estar logado, App.jsx lê esse token e redireciona sozinho.
export const CHAVE_ULTIMA_AREA_PACIENTE = 'evaluaos_ultima_area_paciente'

export function emModoStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}
