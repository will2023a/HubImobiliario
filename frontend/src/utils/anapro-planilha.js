// Lê uma tabela de venda no formato Anapro (grade por unidade) de um .xlsx ou .csv
// e devolve { series, linhas } prontos para POST /tabela-preco/importar.
import * as XLSX from 'xlsx'

// "1.234.567,89" | "R$ 38.709,60" | 999 -> Number | null
export function parseNumeroBR(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  if (v == null) return null
  let s = String(v).trim().replace(/\s/g, '').replace(/r\$/i, '')
  if (!s || s === '-' || s === '--') return null
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// "Entrada x 1 1º em 09/2026" -> { nome:'Entrada', quantidade:1, inicioMes:9, inicioAno:2026 }
export function parseCabecalhoSerie(texto) {
  const t = String(texto || '').replace(/\s+/g, ' ').trim()
  const qtd = (t.match(/x\s*(\d+)/i) || [])[1]
  const dt = t.match(/(\d{1,2})\/(\d{4})/)
  const nome = (t.split(/\s+x\s*\d+/i)[0] || t).trim()
  return {
    nome: nome || 'Série',
    quantidade: qtd ? Math.max(1, parseInt(qtd, 10)) : 1,
    inicioMes: dt ? Math.min(12, Math.max(1, parseInt(dt[1], 10))) : null,
    inicioAno: dt ? parseInt(dt[2], 10) : null,
  }
}

const TIPO_POR_NOME = [
  [/entrada|ato|sinal/i, 'ato'],
  [/financ/i, 'financiamento'],
  [/mensa/i, 'mensal'],
  [/semestr/i, 'semestral'],
  [/interm|anua/i, 'anual'],
  [/[uú]nica|bal[aã]o/i, 'unica'],
  [/\d+\s*dd|dias|pontual/i, 'pontual'],
]
export const tipoPorNome = (nome) => (TIPO_POR_NOME.find(([re]) => re.test(nome)) || [null, 'pontual'])[1]

// Colunas que não são séries de pagamento do cliente.
const COL_IGNORADA = /^(unidade|vaga|[aá]rea|comiss|valor\s+contratual|valor\s+total)/i

// arrayBuffer -> matriz de linhas (array de arrays), da 1ª aba.
function lerMatriz(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', raw: false })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('Planilha vazia.')
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' })
}

export function parsePlanilhaAnapro(arrayBuffer) {
  const rows = lerMatriz(arrayBuffer)
  const hIdx = rows.findIndex(
    (r) => r.some((c) => /unidade/i.test(String(c))) && r.some((c) => /entrada|ato/i.test(String(c)))
  )
  if (hIdx < 0) throw new Error('Não encontrei o cabeçalho (linha com "Unidade" e as colunas de série).')

  const header = rows[hIdx].map((c) => String(c).trim())
  const idx = (re) => header.findIndex((c) => re.test(c))
  const iUnidade = idx(/unidade/i)
  const iArea = idx(/[aá]rea\s*privativa|[aá]rea\s*total|^[aá]rea/i)
  const iComissao = idx(/comiss/i)
  const iTotal = idx(/valor\s+total/i)

  // Colunas de série: as que têm "x N" no cabeçalho e não estão na lista de ignoradas.
  const serieCols = header
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => !COL_IGNORADA.test(c) && /x\s*\d+/i.test(c))
  if (!serieCols.length) throw new Error('Nenhuma coluna de série reconhecida (ex.: "Mensais x 20 1º em 12/2026").')

  const series = serieCols.map(({ c }, k) => {
    const h = parseCabecalhoSerie(c)
    const tipo = tipoPorNome(h.nome)
    return {
      ...h,
      tipo,
      periodicidade: ['semestral', 'anual'].includes(tipo) ? 12 : 1,
      ordem: k,
    }
  })

  const linhas = []
  const ignoradas = []
  for (let r = hIdx + 1; r < rows.length; r += 1) {
    const row = rows[r]
    const cod = String(row[iUnidade] ?? '').trim()
    if (!cod) continue
    const area = iArea >= 0 ? parseNumeroBR(row[iArea]) : null
    const valorTotal = iTotal >= 0 ? parseNumeroBR(row[iTotal]) : null
    const comissao = iComissao >= 0 ? parseNumeroBR(row[iComissao]) : null
    // Linha de grupo (só o rótulo do andar, sem área nem valor) -> ignora.
    if (area == null && valorTotal == null) { ignoradas.push(cod); continue }

    const valores = {}
    serieCols.forEach(({ c, i }) => {
      const nome = parseCabecalhoSerie(c).nome
      let v = parseNumeroBR(row[i])
      // No Anapro a comissão de corretagem sai da entrada: a parcela que o cliente
      // paga é (Entrada + Comissão).
      if (v != null && comissao != null && /entrada|ato|sinal/i.test(nome)) v += comissao
      valores[nome] = v
    })
    linhas.push({ unidade: cod, area, valorTotal, comissao, valores })
  }

  return { series, linhas, ignoradas, colunasSerie: series.map((s) => s.nome) }
}
