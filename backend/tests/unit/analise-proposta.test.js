const {
  round2,
  addMonths,
  mesesEntre,
  valorPresente,
  valorPresenteFaseado,
  montarFluxo,
  seriesDaUnidade,
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

describe('seriesDaUnidade', () => {
  const series = [
    { nome: 'A', unidadeId: null, ordem: 0 },
    { nome: 'B', unidadeId: null, ordem: 1 },
    { nome: 'A', unidadeId: 7, ordem: 0 },
    { nome: 'B', unidadeId: 7, ordem: 1 },
    { nome: 'A', unidadeId: 9, ordem: 0 },
  ];
  it('usa as séries da própria unidade quando existem (tabela por unidade)', () => {
    expect(seriesDaUnidade(series, 7).map((s) => s.unidadeId)).toEqual([7, 7]);
  });
  it('cai nas séries genéricas quando a unidade não tem as suas', () => {
    expect(seriesDaUnidade(series, 123).every((s) => s.unidadeId == null)).toBe(true);
  });
  it('sem unidade, usa as genéricas', () => {
    expect(seriesDaUnidade(series, null)).toHaveLength(2);
  });
});

describe('resolverTabela', () => {
  it('com tabela por unidade, resolve só as séries daquela unidade', () => {
    const tabelaPorUnidade = {
      id: 5,
      series: [
        { nome: 'Ato', tipo: 'ato', inicioMes: 1, inicioAno: 2026, valor: 20000, quantidade: 1, periodicidade: 1, unidadeId: 10, ordem: 0 },
        { nome: 'Fin', tipo: 'financiamento', inicioMes: 1, inicioAno: 2029, valor: 80000, quantidade: 1, periodicidade: 1, unidadeId: 10, ordem: 1 },
        { nome: 'Ato', tipo: 'ato', inicioMes: 1, inicioAno: 2026, valor: 999999, quantidade: 1, periodicidade: 1, unidadeId: 11, ordem: 0 },
      ],
    };
    const r = resolverTabela(tabelaPorUnidade, { id: 10, valorTotal: 100000, area: 50 }, empreendimento, dataBase);
    expect(r.total).toBe(100000);
    expect(r.series).toHaveLength(2);
  });

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

  it('desconto aplicado muda a meta e a diferença passa a ser medida contra ela', () => {
    const tab = resolverTabela(tabelaDemo, unidade, empreendimento, dataBase);
    // proposta = tabela, mas com 2.000 de desconto na unidade
    const res = analisar({ tabelaResolvida: tab, propostaSeries: tab.series, parametros, unidade, empreendimento, descontoAplicado: 2000 });
    expect(res.totais.meta).toBe(98000);
    expect(res.totais.descontoAplicado).toBe(2000);
    expect(res.totais.diferenca).toBe(2000); // proposta (100k) ainda 2k acima da meta
    // agora baixando a proposta em 2.000 para fechar na meta
    const propostaMenor = [tab.series[0], tab.series[1], { ...tab.series[2], valor: tab.series[2].valor - 2000, total: tab.series[2].total - 2000 }];
    const res2 = analisar({ tabelaResolvida: tab, propostaSeries: propostaMenor, parametros, unidade, empreendimento, descontoAplicado: 2000 });
    expect(res2.totais.diferenca).toBe(0);
    expect(res2.indicadores.descontoNominal).toBe(-2000);
  });

  it('critérios de Diferença AV e Equivalência de fluxo trazem detalhe expansível', () => {
    const tab = resolverTabela(tabelaDemo, unidade, empreendimento, dataBase);
    const res = analisar({ tabelaResolvida: tab, propostaSeries: tab.series, parametros, unidade, empreendimento });
    const difAv = res.criterios.find((c) => c.nome === 'diferencaAv');
    expect(Array.isArray(difAv.detalhe)).toBe(true);
    expect(difAv.detalhe.map((d) => d.label)).toEqual(['Proposta AV', 'Tabela AV', 'Resultado']);
    expect(res.criterios.find((c) => c.nome === 'equivalenciaFluxo').detalhe).toBeDefined();
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

  it('só o "ato" entra no AV; pontuais (30/60dd) não', () => {
    const tab = resolverTabela(tabelaDemo, unidade, empreendimento, dataBase);
    const comPontual = [
      { ...tab.series[0] },
      { nome: '30dd', tipo: 'pontual', inicioMes: 2, inicioAno: 2026, valor: 5000, quantidade: 1, periodicidade: 1, total: 5000 },
      { ...tab.series[1], valor: tab.series[1].valor - 250, total: tab.series[1].total - 5000 },
      tab.series[2],
    ];
    const res = analisar({ tabelaResolvida: tab, propostaSeries: comPontual, parametros: {}, unidade, empreendimento });
    const av = res.criterios.find((c) => c.nome === 'diferencaAv');
    expect(av.detalhe.find((d) => d.label === 'Proposta AV').valor).toBe(10000); // só o ato
  });

  it('equivalência de fluxo desativada quando não há taxa de atratividade', () => {
    const tab = resolverTabela(tabelaDemo, unidade, empreendimento, dataBase);
    const res = analisar({ tabelaResolvida: tab, propostaSeries: tab.series, parametros: { taxaAtratividade: 0 }, unidade, empreendimento });
    const eq = res.criterios.find((c) => c.nome === 'equivalenciaFluxo');
    expect(eq.ok).toBe(true);
    expect(eq.proposta).toBe('--');
    expect(res.indicadores.equivalenciaDesativada).toBe(true);
    expect(res.indicadores.valorPresenteProposta).toBeNull();
  });

  it('PV líquido usa a taxa de desconto de fluxo e fica abaixo do nominal', () => {
    const tab = resolverTabela(tabelaDemo, unidade, empreendimento, dataBase);
    const res = analisar({ tabelaResolvida: tab, propostaSeries: tab.series, parametros: { taxaDescontoFluxo: 0.5 }, unidade, empreendimento });
    expect(res.indicadores.pvLiquido.taxa).toBe(0.5);
    expect(res.indicadores.pvLiquido.proposta).toBeLessThan(res.totais.proposta);
    expect(res.indicadores.pvLiquido.diferenca).toBeCloseTo(0, 2); // proposta == tabela
  });

  it('cada critério carrega dicas numéricas (meta) para a barra da tela', () => {
    const tab = resolverTabela(tabelaDemo, unidade, empreendimento, dataBase);
    const res = analisar({ tabelaResolvida: tab, propostaSeries: tab.series, parametros, unidade, empreendimento });
    const av = res.criterios.find((c) => c.nome === 'captacaoAvista');
    expect(av.meta.tipo).toBe('min');
    expect(av.meta.limiteNum).toBe(8);
    expect(res.criterios.find((c) => c.nome === 'intercalacao').meta.tipo).toBe('bool');
  });
});

// Caso real do Anapro (Aureos, unidade L-A) usado para calibrar as fórmulas.
describe('paridade com o Anapro (caso Aureos L-A)', () => {
  const tabelaAureos = {
    id: 99,
    series: [
      { nome: 'Entrada', tipo: 'ato', inicioMes: 9, inicioAno: 2026, valor: 387096, quantidade: 1, periodicidade: 1, ordem: 0 },
      { nome: '30dd', tipo: 'pontual', inicioMes: 10, inicioAno: 2026, valor: 38709.6, quantidade: 1, periodicidade: 1, ordem: 1 },
      { nome: '60dd', tipo: 'pontual', inicioMes: 11, inicioAno: 2026, valor: 38709.6, quantidade: 1, periodicidade: 1, ordem: 2 },
      { nome: 'Mensais', tipo: 'mensal', inicioMes: 12, inicioAno: 2026, valor: 999, quantidade: 20, periodicidade: 1, ordem: 3 },
      { nome: 'Financiamento', tipo: 'financiamento', inicioMes: 9, inicioAno: 2027, valor: 2709672, quantidade: 1, periodicidade: 1, ordem: 4 },
      { nome: 'Intermediaria', tipo: 'anual', inicioMes: 9, inicioAno: 2027, valor: 338396.4, quantidade: 2, periodicidade: 12, ordem: 5 },
    ],
  };
  const unidadeAureos = { valorTotal: 3870960, area: 322.58 };
  const empAureos = { dataPrevisaoConstrucao: new Date('2027-09-30') };
  const baseAureos = new Date('2026-08-01');

  const analise = () => {
    const tab = resolverTabela(tabelaAureos, unidadeAureos, empAureos, baseAureos);
    return analisar({ tabelaResolvida: tab, propostaSeries: tab.series, parametros: {}, unidade: unidadeAureos, empreendimento: empAureos });
  };

  it('% de captação à vista = 10,00%', () => {
    expect(analise().criterios.find((c) => c.nome === 'captacaoAvista').proposta).toBe('10%');
  });

  it('% de captação até habite-se − 1 = 12,23%', () => {
    expect(analise().criterios.find((c) => c.nome === 'captacaoAteHabiteseMenos1').proposta).toBe('12.23%');
  });

  it('% de captação até habite-se = 91,00%', () => {
    expect(analise().criterios.find((c) => c.nome === 'captacaoAteHabitese').proposta).toBe('91%');
  });

  it('% de captação mensal = 0,03% (valor de uma parcela)', () => {
    expect(analise().criterios.find((c) => c.nome === 'captacaoMensal').proposta).toBe('0.03%');
  });

  it('Prazo de financiamento = 24 (span da 1ª à última parcela)', () => {
    expect(analise().criterios.find((c) => c.nome === 'prazoFinanciamento').proposta).toBe(24);
  });

  it('Valor m² e Valor m² do AV = 12.000,00', () => {
    const comp = analise().comparativo;
    expect(comp.valorM2.tabela).toBe(12000);
    expect(comp.valorM2Av.tabela).toBe(12000);
  });
});

describe('valorPresenteFaseado', () => {
  const dataBase = new Date('2026-01-01');
  const dataHabitese = new Date('2027-01-01');

  it('sem taxas é a soma nominal', () => {
    const fluxo = [{ data: new Date('2026-06-01'), valor: 100 }, { data: new Date('2027-06-01'), valor: 100 }];
    expect(valorPresenteFaseado(fluxo, { antes: 0, apos: 0, dataHabitese, dataBase })).toBe(200);
  });

  it('desconta parcelas pós-habite-se com a taxa "após"', () => {
    const fluxo = [{ data: new Date('2027-06-01'), valor: 100 }];
    const semTaxa = valorPresenteFaseado(fluxo, { antes: 0, apos: 0, dataHabitese, dataBase });
    const comTaxa = valorPresenteFaseado(fluxo, { antes: 0, apos: 1, dataHabitese, dataBase });
    expect(comTaxa).toBeLessThan(semTaxa);
  });
});
