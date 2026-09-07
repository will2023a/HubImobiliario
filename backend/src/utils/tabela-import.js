// Helpers puros para importar/exportar a tabela de venda no formato Anapro
// (grade por unidade: cada linha é uma unidade, colunas são as séries).

const TIPOS_SERIE = ['ato', 'pontual', 'mensal', 'semestral', 'anual', 'unica', 'financiamento'];

// "1.234.567,89" | "1234.56" | "R$ 38.709,60" | 999 -> Number | null
function parseNumeroBR(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (v == null) return null;
  let s = String(v).trim().replace(/\s/g, '').replace(/r\$/i, '');
  if (!s || s === '-' || s === '--') return null;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.'); // pt-BR: ponto = milhar, vírgula = decimal
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Normaliza o código da unidade para casar planilha x banco (L-A, "L - A ", "la").
function normalizarCodigo(s) {
  return String(s || '').trim().toUpperCase().replace(/\s+/g, '');
}

// "Entrada x 1 1º em 09/2026" / "Mensais x 20 1° em 12/2026" / "Intermediaria x 2 1° em 09/2027"
function parseCabecalhoSerie(texto) {
  const t = String(texto || '').replace(/\s+/g, ' ').trim();
  const qtd = (t.match(/x\s*(\d+)/i) || [])[1];
  const dt = t.match(/(\d{1,2})\/(\d{4})/);
  const nome = (t.split(/\s+x\s*\d+/i)[0] || t).trim();
  return {
    nome: nome || 'Série',
    quantidade: qtd ? Math.max(1, parseInt(qtd, 10)) : 1,
    inicioMes: dt ? Math.min(12, Math.max(1, parseInt(dt[1], 10))) : null,
    inicioAno: dt ? parseInt(dt[2], 10) : null,
  };
}

const TIPO_POR_NOME = [
  [/entrada|ato|sinal/i, 'ato'],
  [/financ/i, 'financiamento'],
  [/mensa/i, 'mensal'],
  [/semestr/i, 'semestral'],
  [/interm|anua/i, 'anual'],
  [/[uú]nica|bal[aã]o/i, 'unica'],
  [/\d+\s*dd|dias|pontual|ato\s*\+/i, 'pontual'],
];
function tipoPorNome(nome) {
  const hit = TIPO_POR_NOME.find(([re]) => re.test(nome));
  return hit ? hit[1] : 'pontual';
}

// Colunas que NÃO são séries de pagamento do cliente.
const COL_IGNORADA = /^(unidade|vaga|[aá]rea|comiss|valor\s+contratual|valor\s+total)/i;

// Normaliza a definição de uma série (sem valor — o valor é por unidade).
function normalizarSerieDef(s, idx) {
  const tipo = TIPOS_SERIE.includes(s.tipo) ? s.tipo : tipoPorNome(s.nome || '');
  return {
    nome: String(s.nome || `Série ${idx + 1}`).trim() || `Série ${idx + 1}`,
    tipo,
    inicioMes: Math.min(12, Math.max(1, parseInt(s.inicioMes, 10) || 1)),
    inicioAno: parseInt(s.inicioAno, 10) || new Date().getFullYear(),
    quantidade: Math.max(1, parseInt(s.quantidade, 10) || 1),
    periodicidade: Math.max(1, parseInt(s.periodicidade, 10) || (['semestral', 'anual'].includes(tipo) ? 12 : 1)),
    ordem: idx,
  };
}

// Casa as linhas da planilha às unidades do empreendimento (por número/identificação).
function casarUnidades(linhas, unidades) {
  const porCodigo = new Map();
  for (const u of unidades) {
    porCodigo.set(normalizarCodigo(u.numero), u);
    if (u.identificacao) porCodigo.set(normalizarCodigo(u.identificacao), u);
  }
  const casadas = [];
  const naoEncontradas = [];
  for (const l of linhas) {
    const u = porCodigo.get(normalizarCodigo(l.unidade));
    if (u) casadas.push({ linha: l, unidade: u });
    else naoEncontradas.push(l.unidade);
  }
  return { casadas, naoEncontradas };
}

// Gera as linhas de TabelaPrecoSerie (uma por unidade x série) a partir das casadas.
function montarSeriesPorUnidade(casadas, serieDefs) {
  const rows = [];
  for (const { linha, unidade } of casadas) {
    serieDefs.forEach((d, i) => {
      rows.push({
        ...d,
        unidadeId: unidade.id,
        valor: parseNumeroBR(linha.valores ? linha.valores[d.nome] : null) || 0,
        percentualTotal: null,
        ordem: i,
      });
    });
  }
  return rows;
}

module.exports = {
  TIPOS_SERIE,
  COL_IGNORADA,
  parseNumeroBR,
  normalizarCodigo,
  parseCabecalhoSerie,
  tipoPorNome,
  normalizarSerieDef,
  casarUnidades,
  montarSeriesPorUnidade,
};
