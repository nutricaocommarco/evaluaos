// Converte a planilha oficial da TACO (4ª edição) num .sql de INSERT pra
// rodar no SQL Editor do Supabase — mesmo fluxo já usado pras migrations
// deste projeto. Não usa service_role key: a policy de insert de
// tabela_alimentos exige id_avaliador = auth.uid(), então nenhum usuário
// autenticado consegue gravar linha oficial (id_avaliador null) por
// dentro do app — só o SQL Editor, que roda como owner.
//
// Uso:
//   node scripts/importar-tabela-alimentos.js "<caminho-para-Taco-4a-Edicao.xlsx>"
//
// Gera scripts/tabela_alimentos_taco.sql

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const inputPath = process.argv[2]
if (!inputPath) {
  console.error('Uso: node scripts/importar-tabela-alimentos.js "<caminho-para-Taco-4a-Edicao.xlsx>"')
  process.exit(1)
}

// Colunas da aba "CMVCol taco3" (macros/vitaminas/minerais), confirmadas
// por inspeção direta do arquivo — a planilha tem 3 linhas de cabeçalho
// (rótulo de grupo, nome, unidade) antes dos dados começarem.
const COL = {
  id: 0,
  nome: 1,
  energia_kcal: 3,
  proteina_g: 5,
  lipidios_g: 6,
  colesterol_mg: 7,
  carboidrato_g: 8,
  fibra_g: 9,
  calcio_mg: 11,
  ferro_mg: 16,
  sodio_mg: 17,
  zinco_mg: 20,
  vitamina_a_mcg: 23, // RAE — unidade atual, mais precisa que Retinol/RE
  tiamina_mg: 24,
  riboflavina_mg: 25,
  vitamina_b6_mg: 26, // Piridoxina
  niacina_mg: 27,
  vitamina_c_mg: 28,
}

// Colunas da aba "AGtaco3" (ácidos graxos) — junta pelo mesmo id.
const COL_GRAXOS = {
  id: 0,
  saturados_g: 2,
  trans_18_1: 23,
  trans_18_2: 24,
}

const HEADER_ROWS = 3

function parseNum(v) {
  if (v === undefined || v === null) return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  const s = String(v).trim()
  if (s === '' || s === '-' || s === '—') return null
  const upper = s.toUpperCase()
  if (upper === 'NA' || upper === 'TR' || upper === 'TR.') return null
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

function parseId(v) {
  const n = parseNum(v)
  return n === null ? null : Math.round(n)
}

// Linha divisória de categoria: sem id numérico e com todas as outras
// células vazias. Algumas seções (ex. pescados) têm essa linha sem texto
// nenhum na célula A — nesse caso a categoria vira null, não a string
// "null" (row[0] pode ser JS null/undefined aqui, cuidado ao stringificar).
function isCategoriaRow(row) {
  const idNum = parseNum(row[0])
  if (idNum !== null) return false
  return row.slice(1).every((c) => c === undefined || c === null || String(c).trim() === '')
}

function textoCategoria(row) {
  if (row[0] === undefined || row[0] === null) return null
  const texto = String(row[0]).trim()
  return texto === '' ? null : texto
}

function sqlString(v) {
  if (v === null || v === undefined || v === '') return 'null'
  return `'${String(v).trim().replace(/'/g, "''")}'`
}

function sqlNumber(v) {
  return v === null || v === undefined ? 'null' : v
}

console.log(`Lendo ${inputPath}...`)
const workbook = XLSX.readFile(inputPath)

const sheetMacros = workbook.Sheets['CMVCol taco3']
const sheetGraxos = workbook.Sheets['AGtaco3']
if (!sheetMacros) throw new Error('Aba "CMVCol taco3" não encontrada no arquivo.')
if (!sheetGraxos) throw new Error('Aba "AGtaco3" não encontrada no arquivo.')

const macrosRows = XLSX.utils.sheet_to_json(sheetMacros, { header: 1, raw: true, defval: null })
const graxosRows = XLSX.utils.sheet_to_json(sheetGraxos, { header: 1, raw: true, defval: null })

// Monta o lookup de gordura saturada/trans por id do alimento.
const graxosPorId = new Map()
for (const row of graxosRows.slice(HEADER_ROWS)) {
  const id = parseId(row[COL_GRAXOS.id])
  if (id === null) continue
  const saturados = parseNum(row[COL_GRAXOS.saturados_g])
  const t1 = parseNum(row[COL_GRAXOS.trans_18_1])
  const t2 = parseNum(row[COL_GRAXOS.trans_18_2])
  const trans = t1 === null && t2 === null ? null : (t1 ?? 0) + (t2 ?? 0)
  graxosPorId.set(id, { saturados, trans })
}

let categoriaAtual = null
const alimentos = []

for (const row of macrosRows.slice(HEADER_ROWS)) {
  if (isCategoriaRow(row)) {
    categoriaAtual = textoCategoria(row)
    continue
  }

  const id = parseId(row[COL.id])
  const nome = row[COL.nome]
  if (id === null || !nome || !String(nome).trim()) continue

  const graxos = graxosPorId.get(id) || {}

  alimentos.push({
    nome: String(nome).trim(),
    categoria: categoriaAtual,
    energia_kcal: parseNum(row[COL.energia_kcal]),
    proteina_g: parseNum(row[COL.proteina_g]),
    lipidios_g: parseNum(row[COL.lipidios_g]),
    colesterol_mg: parseNum(row[COL.colesterol_mg]),
    carboidrato_g: parseNum(row[COL.carboidrato_g]),
    fibra_g: parseNum(row[COL.fibra_g]),
    calcio_mg: parseNum(row[COL.calcio_mg]),
    ferro_mg: parseNum(row[COL.ferro_mg]),
    sodio_mg: parseNum(row[COL.sodio_mg]),
    zinco_mg: parseNum(row[COL.zinco_mg]),
    vitamina_a_mcg: parseNum(row[COL.vitamina_a_mcg]),
    vitamina_c_mg: parseNum(row[COL.vitamina_c_mg]),
    tiamina_mg: parseNum(row[COL.tiamina_mg]),
    riboflavina_mg: parseNum(row[COL.riboflavina_mg]),
    niacina_mg: parseNum(row[COL.niacina_mg]),
    vitamina_b6_mg: parseNum(row[COL.vitamina_b6_mg]),
    gorduras_saturadas_g: graxos.saturados ?? null,
    gorduras_trans_g: graxos.trans ?? null,
  })
}

if (alimentos.length === 0) {
  throw new Error('Nenhum alimento encontrado — confira se a estrutura da planilha mudou.')
}

const colunas = [
  'nome', 'categoria', 'fonte', 'id_avaliador',
  'energia_kcal', 'proteina_g', 'lipidios_g', 'carboidrato_g', 'fibra_g',
  'colesterol_mg', 'calcio_mg', 'ferro_mg', 'sodio_mg', 'zinco_mg',
  'vitamina_a_mcg', 'vitamina_c_mg', 'tiamina_mg', 'riboflavina_mg',
  'niacina_mg', 'vitamina_b6_mg', 'gorduras_saturadas_g', 'gorduras_trans_g',
]

const valores = alimentos.map((a) => {
  const linha = [
    sqlString(a.nome),
    sqlString(a.categoria),
    "'TACO'",
    'null', // id_avaliador — oficial, visível a todos os avaliadores
    sqlNumber(a.energia_kcal),
    sqlNumber(a.proteina_g),
    sqlNumber(a.lipidios_g),
    sqlNumber(a.carboidrato_g),
    sqlNumber(a.fibra_g),
    sqlNumber(a.colesterol_mg),
    sqlNumber(a.calcio_mg),
    sqlNumber(a.ferro_mg),
    sqlNumber(a.sodio_mg),
    sqlNumber(a.zinco_mg),
    sqlNumber(a.vitamina_a_mcg),
    sqlNumber(a.vitamina_c_mg),
    sqlNumber(a.tiamina_mg),
    sqlNumber(a.riboflavina_mg),
    sqlNumber(a.niacina_mg),
    sqlNumber(a.vitamina_b6_mg),
    sqlNumber(a.gorduras_saturadas_g),
    sqlNumber(a.gorduras_trans_g),
  ]
  return `  (${linha.join(', ')})`
})

const sql = `-- Import da Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição
-- NEPA/UNICAMP — gerado automaticamente por scripts/importar-tabela-alimentos.js
-- a partir de "${path.basename(inputPath)}". ${alimentos.length} alimentos.
--
-- id_avaliador fica null (alimento oficial, visível a todos os avaliadores
-- via a policy "alimentos_leitura_oficial_ou_proprio" já criada na Fase 1).
-- vitamina_d_mcg e vitamina_b12_mcg ficam null pra todos — a TACO não mede
-- esses dois nutrientes.

insert into public.tabela_alimentos (${colunas.join(', ')}) values
${valores.join(',\n')};
`

const outputPath = path.join(__dirname, 'tabela_alimentos_taco.sql')
fs.writeFileSync(outputPath, sql, 'utf-8')

console.log(`OK — ${alimentos.length} alimentos convertidos.`)
console.log(`Arquivo gerado: ${outputPath}`)
console.log('Amostra:')
for (const a of alimentos.slice(0, 3)) {
  console.log(`  - ${a.nome} (${a.categoria}) — ${a.energia_kcal} kcal, ${a.proteina_g}g proteína`)
}
