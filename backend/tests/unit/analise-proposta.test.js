const {
  round2,
  addMonths,
  mesesEntre,
  valorPresente,
  montarFluxo,
  resolverTabela,
  analisar,
} = require('../../src/utils/analise-proposta');

// Tabela de venda demo (soma = 100.000) para uma unidade de 100.000 e 50 m².
const tabelaDemo = {
  id: 1,
  series: [
    { nome: 'Ato', tipo: 'ato', inicioMes: 1, inicioAno: 2026, valor: 10000, quantidade: 1, periodicidade: 1, aposHabitese: false, ordem: 0 },
    { nome: 'Mensais', tipo: 'mensal', inicioMes: 2, inicioAno: 2026, valor: 1000, quantidade: 20, periodicidade: 1, aposHabitese: false, ordem: 1 },
    { nome: 'Financiamento', tipo: 'financiamento', inicioMes: 1, inicioAno: 2029, valor: 70000, quantidade: 1, periodicidade: 1, aposHabitese: true, ordem: 2 },
  ],
};
const unidade = { valorTotal: 100000, area: 50 };
const empreendimento = { dataPrevisaoConstrucao: new Date('2028-12-01') };
const dataBase = new Date('2026-01-01');

describe('helpers', () => {
  it('round2 arredonda para 2 casas', () => {
    expect(round2(1.005)).toBe(1.0); // arredondamento binário conhecido
    expect(round2(2.345)).toBe(2.35);
  });

  it('addMonths avança meses', () => {
    expect(addMonths(new Date('2026-01-15'), 13).toISOString().slice(0, 7)).toBe('2027-02');
  });

  it('mesesEntre conta meses fracionários', () => {
    expect(mesesEntre(new Date('2026-01-01'), new Date('2026-04-01'))).toBeCloseTo(3, 5);
  });

  it('valorPresente sem taxa é a soma nominal', () => {
    const fluxo = [{ data: new Date('2026-06-01'), valor: 100 }, { data: new Date('2027-06-01'), valor: 100 }];
    expect(valorPresente(fluxo, 0, dataBase)).toBe(200);
  });

  it('valorPresente com taxa desconta o futuro', () => {
    const fluxo = [{ data: new Date('2027-01-01'), valor: 100 }];
    expect(valorPresente(fluxo, 1, dataBase)).toBeLessThan(100);
  });
});

describe('resolverTabela', () => {
  it('escala as séries para o valor da unidade e fecha o total', () => {
    const u = { valorTotal: 200000, area: 50 };
    const r = resolverTabela(tabelaDemo, u, empreendimento, dataBase);
    expect(r.total).toBe(200000);
    expect(r.valorM2).toBe(4000);
    expect(r.dataHabitese.toISOString().slice(0, 10)).toBe('2028-12-01');
  });

  it('expande o fluxo com todas as parcelas mensais', () => {
    const r = resolverTabela(tabelaDemo, unidade, empreendimento, dataBase);
    const fluxo = montarFluxo(r.series);
    expect(fluxo.filter((p) => p.tipo === 'mensal')).toHaveLength(20);
    expect(fluxo.reduce((s, p) => s + p.valor, 0)).toBeCloseTo(100000, 0);
  });
});

describe('analisar', () => {
  const parametros = {
    prazoFinanciamentoMax: 120,
    captacaoAvistaMin: 8,
    captacaoAteHabiteseMin: 25,
    captacaoMensalMin: 15,
    diferencaAvMax: 10,
    descontoNominalMax: 5,
    taxaAtratividade: 0.8,
    toleranciaGeral: 1,
    exigirIntercalacao: false,
  };

  it('proposta igual à tabela é aprovável e sem desconto', () => {
    const tab = resolverTabela(tabelaDemo, unidade, empreendimento, dataBase);
    const res = analisar({ tabelaResolvida: tab, propostaSeries: tab.series, parametros, unidade, empreendimento });
    expect(res.totais.diferenca).toBe(0);
    expect(res.indicadores.descontoNominal).toBe(0);
    expect(res.aprovavel).toBe(true);
    expect(res.criterios.find((c) => c.nome === 'equivalenciaFluxo').ok).toBe(true);
  });

  it('empurrar caixa para o futuro gera perda de fluxo e reprova', () => {
    const tab = resolverTabela(tabelaDemo, unidade, empreendimento, dataBase);
    // Proposta: zera o ato, joga tudo para o financiamento (mesmo total nominal).
    const propostaSeries = [
      { ...tab.series[0], valor: 0, total: 0 },
      tab.series[1],
      { ...tab.series[2], valor: 80000, total: 80000 },
    ];
    const res = analisar({ tabelaResolvida: tab, propostaSeries, parametros, unidade, empreendimento });
    expect(res.totais.diferenca).toBe(0);
    expect(res.indicadores.diferencaFluxo).toBeLessThan(0);
    expect(res.criterios.find((c) => c.nome === 'equivalenciaFluxo').ok).toBe(false);
    expect(res.criterios.find((c) => c.nome === 'captacaoAvista').ok).toBe(false);
    expect(res.aprovavel).toBe(false);
  });

  it('desconto nominal acima do limite reprova', () => {
    const tab = resolverTabela(tabelaDemo, unidade, empreendimento, dataBase);
    const propostaSeries = tab.series.map((s) => ({ ...s, valor: s.valor * 0.8, total: s.total * 0.8 }));
    const res = analisar({ tabelaResolvida: tab, propostaSeries, parametros, unidade, empreendimento });
    expect(res.indicadores.descontoNominalPct).toBeCloseTo(-20, 0);
    expect(res.descontoOk).toBe(false);
    expect(res.aprovavel).toBe(false);
  });

  it('sem parâmetros configurados os critérios não bloqueiam', () => {
    const tab = resolverTabela(tabelaDemo, unidade, empreendimento, dataBase);
    const res = analisar({ tabelaResolvida: tab, propostaSeries: tab.series, parametros: {}, unidade, empreendimento });
    expect(res.criterios.every((c) => c.ok)).toBe(true);
    expect(res.aprovavel).toBe(true);
  });

  it('desconto dentro do limite de auto-aprovação mantém aprovável', () => {
    const tab = resolverTabela(tabelaDemo, unidade, empreendimento, dataBase);
    // ~1% de desconto no total, distribuído no financiamento.
    const propostaSeries = [
      tab.series[0], tab.series[1],
      { ...tab.series[2], valor: tab.series[2].valor - 1000, total: tab.series[2].total - 1000 },
    ];
    const res = analisar({ tabelaResolvida: tab, propostaSeries, parametros: { ...parametros, descontoNominalMax: 2 }, unidade, empreendimento });
    expect(res.indicadores.descontoNominalPct).toBeGreaterThan(-2);
    expect(res.descontoOk).toBe(true);
  });

  it('forma de pagamento fora da lista reprova', () => {
    const tab = resolverTabela(tabelaDemo, unidade, empreendimento, dataBase);
    const res = analisar({ tabelaResolvida: tab, propostaSeries: tab.series, parametros: { formasPagamento: ['ato', 'mensal'] }, unidade, empreendimento });
    expect(res.formasOk).toBe(false);
    expect(res.tiposForaDaLista).toContain('financiamento');
    expect(res.aprovavel).toBe(false);
  });

  it('gera o fluxo mês a mês com acumulado e percentuais', () => {
    const tab = resolverTabela(tabelaDemo, unidade, empreendimento, dataBase);
    const res = analisar({ tabelaResolvida: tab, propostaSeries: tab.series, parametros: {}, unidade, empreendimento });
    expect(res.fluxo.colunas).toEqual(expect.arrayContaining(['Ato', 'Mensais', 'Financiamento']));
    expect(res.fluxo.linhas.length).toBeGreaterThan(1);
    const ultima = res.fluxo.linhas[res.fluxo.linhas.length - 1];
    expect(ultima.acumulado).toBeCloseTo(100000, 0);
    expect(ultima.pctSobreProposta).toBeCloseTo(100, 0);
  });
});
