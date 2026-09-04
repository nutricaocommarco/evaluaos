// A TACO nomeia alimentos como "Categoria, Ingrediente, Variante" (ex:
// "Pão, trigo, francês") — buscar a frase inteira como substring (ex:
// "pão francês") não bate, porque "trigo," fica no meio. Aqui a busca vira
// "todas as palavras, em qualquer ordem": cada palavra vira um ILIKE
// encadeado (AND implícito do supabase-js), então "pão francês" bate com
// qualquer nome que contenha as duas palavras, na ordem que estiverem.
export function aplicarBuscaPorPalavras(query, coluna, termoBusca) {
  const palavras = termoBusca.trim().split(/\s+/).filter(Boolean)
  let q = query
  for (const palavra of palavras) {
    q = q.ilike(coluna, `%${palavra}%`)
  }
  return q
}

// A busca acima traz TUDO que contém as palavras em qualquer posição —
// sem reordenar, ".order('nome')" deixa alfabético puro, e um termo curto
// e comum (ex: "ovo") faz o resultado ficar tomado por pratos que só
// CITAM o termo ("Arroz com ovo", "Kinder ovo", "Doce à base de ovos"),
// empurrando o alimento básico ("Ovo, de galinha, cozido") pra fora do
// limite exibido — na prática, "ovo" parecia não existir na busca.
// Reordena client-side por relevância: nome que COMEÇA com o termo vem
// primeiro, depois nome onde o termo aparece como palavra inteira, só
// depois o resto (substring no meio de outra palavra). Precisa ser usado
// com um limit() maior no fetch (a ordenação só ajuda no que já veio).
export function ordenarPorRelevancia(lista, termoBusca) {
  const termo = termoBusca.trim().toLowerCase()
  if (!termo) return lista

  const rank = (nome) => {
    const n = (nome || '').toLowerCase()
    if (n.startsWith(termo)) return 0
    if (new RegExp(`(^|[^a-zà-ú])${termo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-zà-ú]|$)`, 'i').test(n)) return 1
    return 2
  }

  return [...lista].sort((a, b) => {
    const ra = rank(a.nome)
    const rb = rank(b.nome)
    if (ra !== rb) return ra - rb
    const la = (a.nome || '').length
    const lb = (b.nome || '').length
    if (la !== lb) return la - lb
    return (a.nome || '').localeCompare(b.nome || '')
  })
}
