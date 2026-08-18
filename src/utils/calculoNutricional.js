// Extraído de src/pages/PlanoAlimentar.jsx pra ser reaproveitado também pelo
// Diário Alimentar (comparação do que o paciente registrou vs. o prescrito)
// — mesma fórmula, um só lugar.

// As 27 colunas de micronutrientes de tabela_alimentos (migration 0054), na
// mesma chave usada por dri_referencias.chave — usado tanto pra somar o
// plano quanto pra renderizar a lista de comparação.
export const MICRONUTRIENTES = [
  { chave: 'calcio_mg', nome: 'Cálcio', unidade: 'mg' },
  { chave: 'ferro_mg', nome: 'Ferro', unidade: 'mg' },
  { chave: 'magnesio_mg', nome: 'Magnésio', unidade: 'mg' },
  { chave: 'fosforo_mg', nome: 'Fósforo', unidade: 'mg' },
  { chave: 'potassio_mg', nome: 'Potássio', unidade: 'mg' },
  { chave: 'sodio_mg', nome: 'Sódio', unidade: 'mg' },
  { chave: 'zinco_mg', nome: 'Zinco', unidade: 'mg' },
  { chave: 'cromo_mcg', nome: 'Cromo', unidade: 'µg' },
  { chave: 'cobre_mcg', nome: 'Cobre', unidade: 'µg' },
  { chave: 'iodo_mcg', nome: 'Iodo', unidade: 'µg' },
  { chave: 'manganes_mg', nome: 'Manganês', unidade: 'mg' },
  { chave: 'molibdenio_mcg', nome: 'Molibdênio', unidade: 'µg' },
  { chave: 'selenio_mcg', nome: 'Selênio', unidade: 'µg' },
  { chave: 'vitamina_a_mcg', nome: 'Vitamina A', unidade: 'µg' },
  { chave: 'vitamina_e_mg', nome: 'Vitamina E', unidade: 'mg' },
  { chave: 'vitamina_d_mcg', nome: 'Vitamina D', unidade: 'µg' },
  { chave: 'vitamina_c_mg', nome: 'Vitamina C', unidade: 'mg' },
  { chave: 'tiamina_mg', nome: 'Tiamina (B1)', unidade: 'mg' },
  { chave: 'riboflavina_mg', nome: 'Riboflavina (B2)', unidade: 'mg' },
  { chave: 'niacina_mg', nome: 'Niacina (B3)', unidade: 'mg' },
  { chave: 'acido_pantotenico_mg', nome: 'Ácido Pantotênico (B5)', unidade: 'mg' },
  { chave: 'vitamina_b6_mg', nome: 'Vitamina B6', unidade: 'mg' },
  { chave: 'biotina_mcg', nome: 'Biotina (B7)', unidade: 'µg' },
  { chave: 'folato_mcg', nome: 'Folato', unidade: 'µg' },
  { chave: 'vitamina_b12_mcg', nome: 'Vitamina B12', unidade: 'µg' },
  { chave: 'colina_mg', nome: 'Colina', unidade: 'mg' },
  { chave: 'vitamina_k_mcg', nome: 'Vitamina K', unidade: 'µg' },
]

export function calcularMacrosItem(item) {
  const alimento = item.tabela_alimentos
  const micronutrientesVazios = Object.fromEntries(MICRONUTRIENTES.map((m) => [m.chave, 0]))
  const semDadoVazio = Object.fromEntries(MICRONUTRIENTES.map((m) => [m.chave, false]))
  if (!alimento || item.ignorar_nos_calculos) {
    return { kcal: 0, proteina: 0, carbo: 0, lipidio: 0, fibra: 0, micronutrientes: micronutrientesVazios, temDado: semDadoVazio }
  }
  const fator = (Number(item.quantidade_g) || 0) / 100
  const micronutrientes = Object.fromEntries(
    MICRONUTRIENTES.map((m) => [m.chave, (alimento[m.chave] || 0) * fator])
  )
  // Marca por nutriente se ESSE alimento tem valor cadastrado (mesmo que
  // 0 de verdade) — diferencia "não tem esse mineral" de "não sabemos".
  // A base (USDA e derivados) frequentemente não reporta Cromo, Iodo e
  // Biotina pra praticamente nenhum alimento, então sem essa distinção o
  // total apareceria como "0" (zero confirmado) quando na real é "sem
  // dado" pra boa parte do prato.
  const temDado = Object.fromEntries(
    MICRONUTRIENTES.map((m) => [m.chave, alimento[m.chave] !== null && alimento[m.chave] !== undefined])
  )
  return {
    kcal: (alimento.energia_kcal || 0) * fator,
    proteina: (alimento.proteina_g || 0) * fator,
    carbo: (alimento.carboidrato_g || 0) * fator,
    lipidio: (alimento.lipidios_g || 0) * fator,
    fibra: (alimento.fibra_g || 0) * fator,
    micronutrientes,
    temDado,
  }
}

export function somarMacros(lista) {
  return lista.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      proteina: acc.proteina + m.proteina,
      carbo: acc.carbo + m.carbo,
      lipidio: acc.lipidio + m.lipidio,
      fibra: acc.fibra + (m.fibra || 0),
      micronutrientes: Object.fromEntries(
        MICRONUTRIENTES.map((n) => [n.chave, acc.micronutrientes[n.chave] + (m.micronutrientes?.[n.chave] || 0)])
      ),
      // "Tem dado" pro total = pelo menos UM alimento do dia tinha esse
      // nutriente cadastrado (não precisa ser todos).
      temDado: Object.fromEntries(
        MICRONUTRIENTES.map((n) => [n.chave, acc.temDado[n.chave] || !!m.temDado?.[n.chave]])
      ),
    }),
    {
      kcal: 0,
      proteina: 0,
      carbo: 0,
      lipidio: 0,
      fibra: 0,
      micronutrientes: Object.fromEntries(MICRONUTRIENTES.map((n) => [n.chave, 0])),
      temDado: Object.fromEntries(MICRONUTRIENTES.map((n) => [n.chave, false])),
    }
  )
}
