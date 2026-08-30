const prisma = require('../prisma/client');
const { logAudit } = require('./audit.service');

function round2(v) {
  return Math.round((Number(v) || 0) * 100) / 100;
}

// Calcula o novo valorBase de uma unidade conforme o método do job.
function novoValorBase(unidade, job) {
  const base = Number(unidade.valorBase) || 0;
  if (job.metodo === 'percentual') return round2(base * (1 + (Number(job.valorParametro) || 0) / 100));
  if (job.metodo === 'valor_fixo') return round2(base + (Number(job.valorParametro) || 0));
  return base; // manter
}

// Aplica um job de atualização de preço (idempotente por situação).
async function aplicarAtualizacao(jobId) {
  const job = await prisma.atualizacaoPreco.findUnique({ where: { id: Number(jobId) } });
  if (!job || !['agendada', 'processando'].includes(job.situacao)) return job;

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      await tx.atualizacaoPreco.update({ where: { id: job.id }, data: { situacao: 'processando' } });
      const unidades = await tx.unidade.findMany({ where: { empreendimentoId: job.empreendimentoId } });
      const snapshot = [];
      for (const u of unidades) {
        const valorBase = novoValorBase(u, job);
        const valorTotal = round2(valorBase + (Number(u.juros) || 0));
        if (valorBase === u.valorBase && valorTotal === u.valorTotal) continue;
        snapshot.push({ id: u.id, valorBase: u.valorBase, juros: u.juros, valorTotal: u.valorTotal });
        await tx.unidade.update({ where: { id: u.id }, data: { valorBase, valorTotal } });
      }
      return tx.atualizacaoPreco.update({
        where: { id: job.id },
        data: { situacao: 'concluida', executadaEm: new Date(), qtdUnidades: snapshot.length, snapshotJson: snapshot },
      });
    });
    await logAudit({ userId: job.criadoPorId, acao: 'editar', recurso: 'unidade', recursoId: job.empreendimentoId, detalhes: { atualizacaoPrecoId: job.id, metodo: job.metodo, qtdUnidades: resultado.qtdUnidades } });
    return resultado;
  } catch (err) {
    console.error(`Falha ao aplicar atualização de preço #${job.id}:`, err.message);
    return prisma.atualizacaoPreco.update({ where: { id: job.id }, data: { situacao: 'erro', erroMensagem: err.message } }).catch(() => null);
  }
}

// Restaura os preços de um job concluído a partir do snapshot.
async function desfazerAtualizacao(jobId) {
  const job = await prisma.atualizacaoPreco.findUnique({ where: { id: Number(jobId) } });
  if (!job || job.situacao !== 'concluida' || !Array.isArray(job.snapshotJson)) return null;
  await prisma.$transaction(async (tx) => {
    for (const s of job.snapshotJson) {
      await tx.unidade.update({ where: { id: s.id }, data: { valorBase: s.valorBase, juros: s.juros, valorTotal: s.valorTotal } });
    }
    await tx.atualizacaoPreco.update({ where: { id: job.id }, data: { situacao: 'cancelada', erroMensagem: 'Desfeita pelo usuário' } });
  });
  await logAudit({ userId: job.criadoPorId, acao: 'editar', recurso: 'unidade', recursoId: job.empreendimentoId, detalhes: { atualizacaoPrecoId: job.id, acao: 'desfazer' } });
  return true;
}

// Processa jobs agendados cuja data de execução já chegou.
async function processarAgendados() {
  const now = new Date();
  const pendentes = await prisma.atualizacaoPreco.findMany({
    where: { situacao: 'agendada', executarEm: { not: null, lte: now } },
    select: { id: true },
  });
  for (const job of pendentes) {
    // eslint-disable-next-line no-await-in-loop
    await aplicarAtualizacao(job.id);
  }
  return pendentes.length;
}

module.exports = { aplicarAtualizacao, desfazerAtualizacao, processarAgendados, novoValorBase };
