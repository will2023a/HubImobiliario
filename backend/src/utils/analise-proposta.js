// Motor de análise de proposta (estilo Anapro, porém configurável por empreendimento).
// Módulo puro: recebe dados já carregados e devolve os critérios calculados.
// Não acessa banco nem faz I/O.

// AV (à vista): no Anapro só a entrada/ato entra no "valor à vista". As pontuais
// (30/60/90dd) contam como captação, mas não compõem o AV.
const AV_TIPOS = ['ato'];
const INTERCALADAS_TIPOS = ['semestral', 'anual'];

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function pct(parte, total) {
  if (!total) return 0;
  return round2((parte / total) * 100);
}

function dateFromMesAno(mes, ano) {
  return new Date(Number(ano), Number(mes) - 1, 1);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, months) {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

// Diferença em meses (fracionária) entre duas datas.
function mesesEntre(inicio, fim) {
  const anos = fim.getFullYear() - inicio.getFullYear();
  const meses = fim.getMonth() - inicio.getMonth();
  const dias = (fim.getDate() - inicio.getDate()) / 30;
  return anos * 12 + meses + dias;
}

// Expande uma série em parcelas individuais com data e valor.
function expandirSerie(serie) {
  const inicio = dateFromMesAno(serie.inicioMes, serie.inicioAno);
  const periodicidade = Number(serie.periodicidade) || 1;
  const quantidade = Math.max(1, Number(serie.quantidade) || 1);
  const valor = round2(serie.valor);
  const parcelas = [];
  for (let i = 0; i < quantidade; i += 1) {
    parcelas.push({
      data: addMonths(inicio, i * periodicidade),
      valor,
      tipo: serie.tipo,
      nome: serie.nome,
      aposHabitese: Boolean(serie.aposHabitese),
    });
  }
  return parcelas;
}

function montarFluxo(series) {
  return series
    .flatMap(expandirSerie)
    .sort((a, b) => a.data - b.data);
}

// Valor presente do fluxo, taxa mensal em % (ex.: 0.8 = 0,8% a.m.).
function valorPresente(fluxo, taxaMensalPercent, dataBase) {
  const i = (Number(taxaMensalPercent) || 0) / 100;
  if (!i) return round2(fluxo.reduce((s, p) => s + p.valor, 0));
  return round2(
    fluxo.reduce((soma, parcela) => {
      const n = Math.max(0, mesesEntre(dataBase, parcela.data));
      return soma + parcela.valor / (1 + i) ** n;
    }, 0)
  );
}

// VP com taxa distinta antes/depois do habite-se: cada parcela é descontada pela taxa
// da sua fase. Aproxima o fluxo do Anapro quando há duas taxas de atratividade.
function valorPresenteFaseado(fluxo, { antes, apos, dataHabitese, dataBase }) {
  const ia = (Number(antes) || 0) / 100;
  const ip = (Number(apos) || 0) / 100;
  if (!ia && !ip) return round2(fluxo.reduce((s, p) => s + p.valor, 0));
  return round2(
    fluxo.reduce((soma, parcela) => {
      const i = dataHabitese && parcela.data >= dataHabitese ? ip : ia;
      const n = Math.max(0, mesesEntre(dataBase, parcela.data));
      return soma + parcela.valor / (1 + i) ** n;
    }, 0)
  );
}

// Escolhe as séries que valem para a unidade: se a tabela tem séries por unidade
// (unidadeId preenchido, caso do importador Anapro), usa as dessa unidade; senão
// usa as séries genéricas (unidadeId null); em último caso, todas.
function seriesDaUnidade(series, unidadeId) {
  const arr = series || [];
  if (unidadeId != null) {
    const daUnidade = arr.filter((s) => s.unidadeId === unidadeId);
    if (daUnidade.length) return daUnidade;
  }
  const genericas = arr.filter((s) => s.unidadeId == null);
  return genericas.length ? genericas : arr;
}

// Converte séries "cruas" (da tabela ou da proposta) para o formato interno,
// escalonando os valores da tabela para o valor real da unidade.
function resolverTabela(tabela, unidade, empreendimento, dataBase = new Date()) {
  const seriesRaw = seriesDaUnidade(tabela?.series, unidade?.id)
    .slice()
    .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
  const somaSeries = seriesRaw.reduce((s, x) => s + round2(x.valor) * (Number(x.quantidade) || 1), 0);
  const alvo = Number(unidade?.valorTotal) || somaSeries;
  const fator = somaSeries ? alvo / somaSeries : 1;

  let series = seriesRaw.map((s) => {
    const valor = round2(round2(s.valor) * fator);
    return { ...s, valor, total: round2(valor * (Number(s.quantidade) || 1)) };
  });

  // Ajuste de arredondamento na maior série (normalmente o financiamento).
  const totalEscalado = series.reduce((s, x) => s + x.total, 0);
  const resto = round2(alvo - totalEscalado);
  if (resto && series.length) {
    const idx = series.reduce((maxIdx, x, i, arr) => (x.total > arr[maxIdx].total ? i : maxIdx), 0);
    const q = Number(series[idx].quantidade) || 1;
    series[idx] = {
      ...series[idx],
      valor: round2(series[idx].valor + resto / q),
      total: round2(series[idx].total + resto),
    };
  }

  const dataHabitese = empreendimento?.dataPrevisaoConstrucao
    ? new Date(empreendimento.dataPrevisaoConstrucao)
    : null;
  const total = round2(series.reduce((s, x) => s + x.total, 0));
  const area = Number(unidade?.area) || 0;

  return {
    series,
    total,
    dataBase,
    dataHabitese,
    valorM2: area ? round2(total / area) : null,
  };
}

// Métricas de um conjunto de séries.
function metricas(series, { dataHabitese, area, dataBase }) {
  const norm = series.map((s) => ({
    ...s,
    valor: round2(s.valor),
    quantidade: Math.max(1, Number(s.quantidade) || 1),
    total: round2(round2(s.valor) * Math.max(1, Number(s.quantidade) || 1)),
  }));
  const fluxo = montarFluxo(norm);
  const total = round2(norm.reduce((s, x) => s + x.total, 0));

  const somaTipo = (tipos) => round2(norm.filter((s) => tipos.includes(s.tipo)).reduce((s, x) => s + x.total, 0));
  const av = somaTipo(AV_TIPOS);
  const mensais = somaTipo(['mensal']);
  // Valor de UMA parcela mensal (a maior, quando há mais de uma série mensal) — é o que
  // o Anapro mostra na linha "% de captação mensal".
  const mensalParcela = round2(norm.filter((s) => s.tipo === 'mensal').reduce((mx, s) => Math.max(mx, s.valor), 0));

  const ateData = (limite) => (limite
    ? round2(fluxo.filter((p) => p.data <= limite).reduce((s, p) => s + p.valor, 0))
    : 0);
  const ateHabitese = dataHabitese ? ateData(dataHabitese) : total;
  const aposHabitese = round2(total - ateHabitese);

  // Captação até o mês anterior ao habite-se (Anapro: "habite-se − 1").
  const ateHabiteseMenos1 = dataHabitese
    ? round2(fluxo.filter((p) => p.data < startOfMonth(dataHabitese)).reduce((s, p) => s + p.valor, 0))
    : null;

  // Metade do prazo de obra: da 1ª parcela do fluxo até o habite-se.
  const inicioObra = fluxo.length ? fluxo[0].data : dataBase;
  const metadeObraData = dataHabitese
    ? new Date(inicioObra.getTime() + (dataHabitese.getTime() - inicioObra.getTime()) / 2)
    : null;

  // Prazo de financiamento (Anapro): meses da 1ª à última parcela do fluxo.
  const prazoFinanciamento = fluxo.length >= 2
    ? Math.max(0, Math.round(mesesEntre(fluxo[0].data, fluxo[fluxo.length - 1].data)))
    : 0;

  const temIntercalacao = norm.some((s) => INTERCALADAS_TIPOS.includes(s.tipo) && s.quantidade > 0)
    && norm.some((s) => s.tipo === 'mensal');

  return {
    total,
    av,
    avPct: pct(av, total),
    mensais,
    mensaisPct: pct(mensais, total),
    mensalParcela,
    mensalParcelaPct: pct(mensalParcela, total),
    ateHabitese,
    ateHabitesePct: pct(ateHabitese, total),
    ateHabiteseMenos1,
    ateHabiteseMenos1Pct: ateHabiteseMenos1 == null ? null : pct(ateHabiteseMenos1, total),
    aposHabitese,
    aposHabitesePct: pct(aposHabitese, total),
    metadeObra: metadeObraData ? ateData(metadeObraData) : 0,
    metadeObraData,
    prazoFinanciamento,
    temIntercalacao,
    valorM2: area ? round2(total / area) : null,
    valorM2Av: area ? round2(total / area) : null,
    fluxo,
  };
}

function criterio(nome, label, tabela, proposta, limite, tolerancia, ok, detalhe) {
  return { nome, label, tabela, proposta, limite, tolerancia, ok, ...(detalhe ? { detalhe } : {}) };
}

// Fluxo mês a mês da proposta (estilo "Fluxo da proposta de compra e venda" do Anapro).
// Agrupa as parcelas por nome de série e devolve o acumulado e o % sobre tabela/proposta.
function montarFluxoDetalhado(series, { totalTabela = 0, inicioDaPerda = null } = {}) {
  const norm = (series || []).map((s) => ({
    ...s,
    nome: s.nome || 'Série',
    valor: round2(s.valor),
    quantidade: Math.max(1, Number(s.quantidade) || 1),
  }));
  const colunas = [...new Set(norm.map((s) => s.nome))];
  const parcelas = norm.flatMap((s) =>
    expandirSerie(s).map((p) => ({ ...p, nomeSerie: s.nome }))
  );
  const total = round2(parcelas.reduce((acc, p) => acc + p.valor, 0));

  const perdaChave = inicioDaPerda
    ? `${new Date(inicioDaPerda).getFullYear()}-${String(new Date(inicioDaPerda).getMonth() + 1).padStart(2, '0')}`
    : null;

  const porChave = new Map();
  for (const p of parcelas) {
    const chave = `${p.data.getFullYear()}-${String(p.data.getMonth() + 1).padStart(2, '0')}`;
    if (!porChave.has(chave)) porChave.set(chave, { data: p.data, valores: {} });
    const linha = porChave.get(chave);
    linha.valores[p.nomeSerie] = round2((linha.valores[p.nomeSerie] || 0) + p.valor);
  }

  let acumulado = 0;
  const linhas = [...porChave.entries()]
    .sort((a, b) => a[1].data - b[1].data)
    .map(([chave, linha]) => {
      const valorPago = round2(Object.values(linha.valores).reduce((s, v) => s + v, 0));
      acumulado = round2(acumulado + valorPago);
      return {
        mesAno: chave,
        valores: linha.valores,
        valorPago,
        acumulado,
        pctSobreTabela: totalTabela ? round2((acumulado / totalTabela) * 100) : 0,
        pctSobreProposta: total ? round2((acumulado / total) * 100) : 0,
        perda: perdaChave ? chave >= perdaChave : false,
      };
    });

  return { colunas, linhas, total, totalTabela: round2(totalTabela) };
}

// Análise principal.
// params: { tabelaResolvida, propostaSeries, parametros, unidade, empreendimento }
function analisar({ tabelaResolvida, propostaSeries, parametros = {}, unidade = {}, empreendimento = {}, descontoAplicado = 0 }) {
  const desconto = Math.max(0, round2(descontoAplicado));
  const dataBase = tabelaResolvida?.dataBase ? new Date(tabelaResolvida.dataBase) : new Date();
  const dataHabitese = tabelaResolvida?.dataHabitese ? new Date(tabelaResolvida.dataHabitese) : null;
  const area = Number(unidade?.area) || 0;
  const ctx = { dataHabitese, area, dataBase };

  const mTab = metricas(tabelaResolvida?.series || [], ctx);
  const mProp = metricas(propostaSeries || [], ctx);

  const tol = Number(parametros?.toleranciaGeral) || 0;

  // Taxas de atratividade: antes/após habite-se, com fallback na taxa única legada.
  const taxaAntes = num(parametros?.taxaAtratividadeAntesHabitese);
  const taxaApos = num(parametros?.taxaAtratividadeAposHabitese);
  const taxaLegada = num(parametros?.taxaAtratividade);
  const taxaEquiv = taxaAntes || taxaApos || taxaLegada || 0;
  // A construtora "desativa" a equivalência de fluxo zerando as taxas de atratividade.
  const equivalenciaDesativada = !(taxaAntes || taxaApos || taxaLegada);

  const vpArgs = { antes: taxaAntes || taxaLegada, apos: taxaApos || taxaLegada, dataHabitese, dataBase };
  const usarFaseado = Boolean(taxaAntes || taxaApos);
  const vpFluxo = (fluxo) => (usarFaseado
    ? valorPresenteFaseado(fluxo, vpArgs)
    : valorPresente(fluxo, taxaEquiv, dataBase));

  const vpTabela = vpFluxo(mTab.fluxo);
  const vpProposta = vpFluxo(mProp.fluxo);

  // Início da perda: primeira parcela onde o VP acumulado da proposta fica abaixo do da tabela.
  let inicioDaPerda = null;
  {
    const datas = [...new Set([...mTab.fluxo, ...mProp.fluxo].map((p) => p.data.getTime()))].sort((a, b) => a - b);
    const acum = (fluxo, ate) => vpFluxo(fluxo.filter((p) => p.data.getTime() <= ate));
    for (const t of datas) {
      if (acum(mProp.fluxo, t) + 0.01 < acum(mTab.fluxo, t)) { inicioDaPerda = new Date(t); break; }
    }
  }

  // PV líquido: usa a taxa de desconto de fluxo da construtora (custo de capital / TMA).
  const taxaPv = num(parametros?.taxaDescontoFluxo) || taxaEquiv || 0;
  const pvLiquidoProposta = valorPresente(mProp.fluxo, taxaPv, dataBase);
  const pvLiquidoTabela = valorPresente(mTab.fluxo, taxaPv, dataBase);

  const limitePrazo = parametros?.prazoFinanciamentoMax ?? null;
  const limiteAv = parametros?.captacaoAvistaMin ?? null;
  const limiteHab = parametros?.captacaoAteHabiteseMin ?? null;
  const limiteHabM1 = parametros?.captacaoAteHabiteseMenos1Min ?? null;
  const limiteMensalParc = parametros?.captacaoMensalMaxParcela ?? null;
  const limiteDifAv = parametros?.diferencaAvMax ?? null;
  const limiteDesc = parametros?.descontoNominalMax ?? null;
  const exigeInterc = Boolean(parametros?.exigirIntercalacao);

  // Formas de pagamento aceitas: a proposta só pode usar séries desses tipos.
  const formasAceitas = Array.isArray(parametros?.formasPagamento) ? parametros.formasPagamento.filter(Boolean) : [];
  const tiposUsados = [...new Set((propostaSeries || []).map((s) => s.tipo))];
  const tiposForaDaLista = formasAceitas.length ? tiposUsados.filter((t) => !formasAceitas.includes(t)) : [];
  const formasOk = tiposForaDaLista.length === 0;

  const difAvPct = mTab.av ? round2(((mProp.av - mTab.av) / mTab.av) * 100) : 0;
  const difFluxo = round2(vpProposta - vpTabela);
  const tolFluxo = round2((vpTabela * tol) / 100);

  const traco = '--';
  const pctStr = (v) => (v == null ? traco : `${v}%`);

  const criterios = [
    criterio('prazoFinanciamento', 'Prazo de financiamento',
      mTab.prazoFinanciamento || traco, mProp.prazoFinanciamento || traco,
      limitePrazo ?? traco, `${tol}%`,
      limitePrazo == null ? true : mProp.prazoFinanciamento <= limitePrazo * (1 + tol / 100)),
    criterio('captacaoAvista', '% de captação à vista',
      `${mTab.avPct}%`, `${mProp.avPct}%`, limiteAv == null ? traco : `${limiteAv}%`, `${tol}%`,
      limiteAv == null ? true : mProp.avPct >= limiteAv - tol),
    criterio('captacaoAteHabitese', '% de captação até habite-se',
      `${mTab.ateHabitesePct}%`, `${mProp.ateHabitesePct}%`, limiteHab == null ? traco : `${limiteHab}%`, `${tol}%`,
      limiteHab == null ? true : mProp.ateHabitesePct >= limiteHab - tol),
    criterio('captacaoAteHabiteseMenos1', '% de captação até habite-se − 1',
      pctStr(mTab.ateHabiteseMenos1Pct), pctStr(mProp.ateHabiteseMenos1Pct),
      limiteHabM1 == null ? traco : `${limiteHabM1}%`, `${tol}%`,
      limiteHabM1 == null || mProp.ateHabiteseMenos1Pct == null
        ? true
        : mProp.ateHabiteseMenos1Pct >= limiteHabM1 - tol),
    criterio('diferencaAv', 'Diferença AV',
      round2(mTab.av), round2(mProp.av), limiteDifAv == null ? traco : `-${limiteDifAv}%`, `${tol}%`,
      limiteDifAv == null ? true : difAvPct >= -(limiteDifAv) - tol,
      [
        { label: 'Proposta AV', valor: round2(mProp.av) },
        { label: 'Tabela AV', valor: round2(mTab.av) },
        { label: 'Resultado', valor: `${difAvPct}%` },
      ]),
    criterio('captacaoMensal', '% de captação mensal',
      `${mTab.mensalParcelaPct}%`, `${mProp.mensalParcelaPct}%`,
      limiteMensalParc == null ? traco : `${limiteMensalParc}%`, `${tol}%`,
      limiteMensalParc == null ? true : mProp.mensalParcelaPct <= limiteMensalParc + tol,
      [
        { label: 'Parcela mensal (tabela)', valor: round2(mTab.mensalParcela) },
        { label: 'Parcela mensal (proposta)', valor: round2(mProp.mensalParcela) },
        { label: 'Captação mensal total', valor: `${mProp.mensaisPct}%` },
      ]),
    criterio('intercalacao', 'Intercalação de parcelas',
      mTab.temIntercalacao ? 'Sim' : 'Não', mProp.temIntercalacao ? 'Sim' : 'Não',
      exigeInterc ? 'Sim' : traco, traco,
      exigeInterc ? mProp.temIntercalacao : true),
    criterio('equivalenciaFluxo', 'Equivalência de fluxo',
      equivalenciaDesativada ? traco : vpTabela,
      equivalenciaDesativada ? traco : vpProposta,
      equivalenciaDesativada ? traco : 0,
      equivalenciaDesativada ? traco : tolFluxo,
      equivalenciaDesativada ? true : difFluxo >= -tolFluxo,
      equivalenciaDesativada
        ? [{ label: 'Situação', valor: 'A construtora desativou a validação da equivalência de fluxo' }]
        : [
          { label: 'Diferença de fluxo', valor: difFluxo },
          { label: 'Início da perda', valor: inicioDaPerda ? new Date(inicioDaPerda).toISOString().slice(0, 10) : traco },
        ]),
    criterio('formasPagamento', 'Formas de pagamento aceitas',
      formasAceitas.length ? formasAceitas.join(', ') : 'Todas',
      tiposUsados.join(', ') || traco,
      formasAceitas.length ? formasAceitas.join(', ') : traco, traco,
      formasOk),
  ];

  const meta = round2(mTab.total - desconto);

  // Dicas numéricas para as barras de progresso da tela (valor × limite).
  const metaPorNome = {
    prazoFinanciamento: { tipo: 'max', propostaNum: mProp.prazoFinanciamento, tabelaNum: mTab.prazoFinanciamento, limiteNum: limitePrazo, unidade: 'meses' },
    captacaoAvista: { tipo: 'min', propostaNum: mProp.avPct, tabelaNum: mTab.avPct, limiteNum: limiteAv, unidade: '%' },
    captacaoAteHabitese: { tipo: 'min', propostaNum: mProp.ateHabitesePct, tabelaNum: mTab.ateHabitesePct, limiteNum: limiteHab, unidade: '%' },
    captacaoAteHabiteseMenos1: { tipo: 'min', propostaNum: mProp.ateHabiteseMenos1Pct, tabelaNum: mTab.ateHabiteseMenos1Pct, limiteNum: limiteHabM1, unidade: '%' },
    diferencaAv: { tipo: 'min', propostaNum: difAvPct, tabelaNum: 0, limiteNum: limiteDifAv == null ? null : -limiteDifAv, unidade: '%' },
    captacaoMensal: { tipo: 'max', propostaNum: mProp.mensalParcelaPct, tabelaNum: mTab.mensalParcelaPct, limiteNum: limiteMensalParc, unidade: '%' },
    intercalacao: { tipo: 'bool' },
    equivalenciaFluxo: equivalenciaDesativada
      ? { tipo: 'info' }
      : { tipo: 'min', propostaNum: difFluxo, tabelaNum: 0, limiteNum: -tolFluxo, unidade: 'R$' },
    formasPagamento: { tipo: 'bool' },
  };
  criterios.forEach((c) => { c.meta = metaPorNome[c.nome] || { tipo: 'info' }; });

  const dataRef = parametros?.dataReferenciaCaptacao ? new Date(parametros.dataReferenciaCaptacao) : null;
  const somaAte = (fluxo, limite) => (limite
    ? round2(fluxo.filter((p) => p.data <= limite).reduce((s, p) => s + p.valor, 0))
    : null);

  const comparativo = {
    valorM2: { tabela: mTab.valorM2, proposta: area ? round2(mProp.total / area) : null },
    valorM2Av: { tabela: area ? round2(mTab.total / area) : null, proposta: area ? round2(meta / area) : null },
    captacaoAteHabitese: { tabela: mTab.ateHabitese, proposta: mProp.ateHabitese },
    captacaoAposHabitese: { tabela: mTab.aposHabitese, proposta: mProp.aposHabitese },
    captacaoMetadeObra: { tabela: mTab.metadeObra, proposta: mProp.metadeObra, data: mProp.metadeObraData },
    captacaoAteData: { tabela: somaAte(mTab.fluxo, dataRef), proposta: somaAte(mProp.fluxo, dataRef), data: dataRef },
  };

  const descontoNominal = round2(mProp.total - mTab.total);
  const indicadores = {
    descontoNominal,
    descontoNominalPct: mTab.total ? round2((descontoNominal / mTab.total) * 100) : 0,
    descontoAplicado: desconto,
    taxaAtratividade: taxaLegada,
    taxaAtratividadeAntesHabitese: taxaAntes,
    taxaAtratividadeAposHabitese: taxaApos,
    grl: num(parametros?.grl),
    equivalenciaDesativada,
    valorPresenteTabela: equivalenciaDesativada ? null : vpTabela,
    valorPresenteProposta: equivalenciaDesativada ? null : vpProposta,
    diferencaFluxo: equivalenciaDesativada ? null : difFluxo,
    inicioDaPerda: equivalenciaDesativada ? null : inicioDaPerda,
    pvLiquido: {
      proposta: pvLiquidoProposta,
      tabela: pvLiquidoTabela,
      diferenca: round2(pvLiquidoProposta - pvLiquidoTabela),
      taxa: taxaPv,
    },
  };

  // Desconto nominal dentro do limite => proposta aprovada automaticamente (sem gestor).
  const descontoOk = limiteDesc == null
    ? true
    : indicadores.descontoNominalPct >= -(limiteDesc);
  indicadores.descontoNominalMax = limiteDesc;

  const criteriosOk = criterios.every((c) => c.ok);
  const aprovavel = criteriosOk && descontoOk && formasOk;

  return {
    dataBase,
    dataHabitese,
    totais: { tabela: mTab.total, proposta: mProp.total, meta, descontoAplicado: desconto, diferenca: round2(mProp.total - meta) },
    criterios,
    comparativo,
    indicadores,
    descontoOk,
    formasOk,
    tiposForaDaLista,
    aprovavel,
    inicioDaPerda: indicadores.inicioDaPerda,
    fluxo: montarFluxoDetalhado(propostaSeries || [], { totalTabela: mTab.total, inicioDaPerda: indicadores.inicioDaPerda }),
  };
}

module.exports = {
  round2,
  dateFromMesAno,
  addMonths,
  mesesEntre,
  montarFluxo,
  montarFluxoDetalhado,
  valorPresente,
  valorPresenteFaseado,
  seriesDaUnidade,
  resolverTabela,
  analisar,
};
