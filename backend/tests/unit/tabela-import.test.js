const {
  parseNumeroBR,
  normalizarCodigo,
  parseCabecalhoSerie,
  tipoPorNome,
  normalizarSerieDef,
  casarUnidades,
  montarSeriesPorUnidade,
} = require('../../src/utils/tabela-import');

describe('parseNumeroBR', () => {
  it('lê o formato pt-BR', () => {
    expect(parseNumeroBR('2.709.672,00')).toBe(2709672);
    expect(parseNumeroBR('38.709,60')).toBe(38709.6);
    expect(parseNumeroBR('R$ 999,00')).toBe(999);
    expect(parseNumeroBR('322,58')).toBe(322.58);
  });
  it('lê número cru e trata vazio', () => {
    expect(parseNumeroBR(1234.5)).toBe(1234.5);
    expect(parseNumeroBR('')).toBeNull();
    expect(parseNumeroBR('--')).toBeNull();
    expect(parseNumeroBR(null)).toBeNull();
  });
});

describe('parseCabecalhoSerie', () => {
  it('extrai nome, quantidade e início', () => {
    expect(parseCabecalhoSerie('Entrada x 1 1º em 09/2026')).toEqual({ nome: 'Entrada', quantidade: 1, inicioMes: 9, inicioAno: 2026 });
    expect(parseCabecalhoSerie('Mensais x 20 1° em 12/2026')).toEqual({ nome: 'Mensais', quantidade: 20, inicioMes: 12, inicioAno: 2026 });
    expect(parseCabecalhoSerie('Intermediaria x 2 1° em 09/2027')).toEqual({ nome: 'Intermediaria', quantidade: 2, inicioMes: 9, inicioAno: 2027 });
  });
});

describe('tipoPorNome', () => {
  it('mapeia os nomes do Anapro para tipos internos', () => {
    expect(tipoPorNome('Entrada')).toBe('ato');
    expect(tipoPorNome('30dd')).toBe('pontual');
    expect(tipoPorNome('Mensais')).toBe('mensal');
    expect(tipoPorNome('Intermediaria')).toBe('anual');
    expect(tipoPorNome('Financiamento')).toBe('financiamento');
  });
});

describe('normalizarSerieDef', () => {
  it('preenche periodicidade 12 para intermediárias', () => {
    const d = normalizarSerieDef({ nome: 'Intermediaria', tipo: 'anual', inicioMes: 9, inicioAno: 2027, quantidade: 2 }, 5);
    expect(d.periodicidade).toBe(12);
    expect(d.ordem).toBe(5);
  });
  it('mensal fica periodicidade 1', () => {
    expect(normalizarSerieDef({ nome: 'Mensais', tipo: 'mensal', quantidade: 20 }, 0).periodicidade).toBe(1);
  });
});

describe('casarUnidades', () => {
  const unidades = [
    { id: 1, numero: 'L-A', identificacao: 'Loja A', juros: 0 },
    { id: 2, numero: 'U-0201', identificacao: null, juros: 0 },
  ];
  it('casa por número ignorando espaços/caixa', () => {
    const { casadas, naoEncontradas } = casarUnidades(
      [{ unidade: ' l-a ' }, { unidade: 'U-0201' }, { unidade: 'U-9999' }],
      unidades
    );
    expect(casadas.map((c) => c.unidade.id)).toEqual([1, 2]);
    expect(naoEncontradas).toEqual(['U-9999']);
  });
  it('casa também pela identificação', () => {
    const { casadas } = casarUnidades([{ unidade: 'LOJA A' }], unidades);
    expect(casadas[0].unidade.id).toBe(1);
  });
});

describe('montarSeriesPorUnidade', () => {
  it('gera uma linha por unidade x série, com o valor da planilha', () => {
    const casadas = [
      { unidade: { id: 1 }, linha: { unidade: 'L-A', valores: { Entrada: 387096, Mensais: 999 } } },
      { unidade: { id: 2 }, linha: { unidade: 'U-0201', valores: { Entrada: '224.000,00', Mensais: 999 } } },
    ];
    const defs = [
      normalizarSerieDef({ nome: 'Entrada', tipo: 'ato', inicioMes: 9, inicioAno: 2026, quantidade: 1 }, 0),
      normalizarSerieDef({ nome: 'Mensais', tipo: 'mensal', inicioMes: 12, inicioAno: 2026, quantidade: 20 }, 1),
    ];
    const rows = montarSeriesPorUnidade(casadas, defs);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ unidadeId: 1, nome: 'Entrada', valor: 387096, tipo: 'ato', quantidade: 1 });
    expect(rows[2]).toMatchObject({ unidadeId: 2, nome: 'Entrada', valor: 224000 });
    expect(rows[3]).toMatchObject({ unidadeId: 2, nome: 'Mensais', valor: 999, quantidade: 20 });
  });

  it('valor ausente vira 0', () => {
    const rows = montarSeriesPorUnidade(
      [{ unidade: { id: 9 }, linha: { valores: {} } }],
      [normalizarSerieDef({ nome: 'Entrada', tipo: 'ato' }, 0)]
    );
    expect(rows[0].valor).toBe(0);
  });
});

describe('normalizarCodigo', () => {
  it('tira espaços e sobe a caixa', () => {
    expect(normalizarCodigo(' l - a ')).toBe('L-A');
    expect(normalizarCodigo('u0201')).toBe('U0201');
  });
});
