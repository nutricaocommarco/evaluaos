// Mesma lógica de formatação já usada pro link wa.me em
// src/pages/Pacientes.jsx — remove tudo que não é dígito e garante o
// DDI 55 na frente, pra bater com o formato que a Evolution API espera.
export function formatarNumeroWhatsapp(telefone) {
  const limpo = (telefone || '').replace(/\D/g, '')
  if (!limpo) return null
  return limpo.startsWith('55') ? limpo : `55${limpo}`
}
