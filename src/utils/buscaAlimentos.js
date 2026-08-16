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
