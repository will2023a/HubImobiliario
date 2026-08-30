const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');
const { getManageableEmpreendimento } = require('../utils/empreendimento-access');
const { aplicarAtualizacao, desfazerAtualizacao } = require('../services/price-update.service');

const METODOS = ['manter', 'percentual', 'valor_fixo'];

// GET /atualizacoes-preco/empreendimento/:empreendimentoId - histórico
router.get('/empreendimento/:empreendimentoId', authenticate, async (req, res) => {
  try {
    if (!await getManageableEmpreendimento(req.user, req.params.empreendimentoId)) return res.status(404).json({ error: 'Empreendimento não encontrado ou não gerenciável' });
    const jobs = await prisma.atualizacaoPreco.findMany({
      where: { empreendimentoId: Number(req.params.empreendimentoId) },
      include: { criadoPor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// POST /atualizacoes-preco - cria job; aplica na hora se sem data ou data já passou
router.post('/', authenticate, async (req, res) => {
  try {
    const { empreendimentoId, titulo, justificativa, metodo, valorParametro, executarEm } = req.body;
    if (!empreendimentoId || !titulo?.trim()) return res.status(400).json({ error: 'empreendimentoId e título são obrigatórios' });
    if (!METODOS.includes(metodo)) return res.status(400).json({ error: 'Método inválido' });
    if (metodo !== 'manter' && (valorParametro === undefined || valorParametro === '' || Number.isNaN(Number(valorParametro)))) {
      return res.status(400).json({ error: 'Informe o valor do reajuste' });
    }
    if (!await getManageableEmpreendimento(req.user, empreendimentoId)) return res.status(404).json({ error: 'Empreendimento não encontrado ou não gerenciável' });

    const quando = executarEm ? new Date(executarEm) : null;
    const aplicarAgora = !quando || quando.getTime() <= Date.now();

    const job = await prisma.atualizacaoPreco.create({
      data: {
        empreendimentoId: Number(empreendimentoId),
        titulo: titulo.trim(),
        justificativa: justificativa?.trim() || null,
        metodo,
        valorParametro: metodo === 'manter' ? null : parseFloat(valorParametro),
        executarEm: aplicarAgora ? null : quando,
        situacao: 'agendada',
        criadoPorId: req.user.id,
      },
    });

    const resultado = aplicarAgora ? await aplicarAtualizacao(job.id) : job;
    res.status(201).json(resultado || job);
  } catch (err) {
    console.error('Erro criar atualização de preço:', err);
    res.status(500).json({ error: 'Erro ao criar atualização' });
  }
});

async function loadJob(req) {
  const job = await prisma.atualizacaoPreco.findUnique({ where: { id: Number(req.params.id) } });
  if (!job) return null;
  return await getManageableEmpreendimento(req.user, job.empreendimentoId) ? job : null;
}

// POST /atualizacoes-preco/:id/cancelar - só jobs agendados
router.post('/:id/cancelar', authenticate, async (req, res) => {
  const job = await loadJob(req);
  if (!job) return res.status(404).json({ error: 'Atualização não encontrada' });
  if (job.situacao !== 'agendada') return res.status(409).json({ error: 'Só é possível cancelar atualizações agendadas' });
  const updated = await prisma.atualizacaoPreco.update({ where: { id: job.id }, data: { situacao: 'cancelada' } });
  res.json(updated);
});

// POST /atualizacoes-preco/:id/desfazer - restaura preços de um job concluído
router.post('/:id/desfazer', authenticate, async (req, res) => {
  const job = await loadJob(req);
  if (!job) return res.status(404).json({ error: 'Atualização não encontrada' });
  const ok = await desfazerAtualizacao(job.id);
  if (!ok) return res.status(409).json({ error: 'Não é possível desfazer esta atualização' });
  res.json({ ok: true });
});

module.exports = router;
