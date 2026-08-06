const express = require('express');
const prisma = require('../prisma/client');
const { rateLimit } = require('../middlewares/security');

const router = express.Router();
router.use(rateLimit({ windowMs: 60_000, max: 60 }));

router.get('/:token', async (req, res) => {
  const now = new Date();
  const share = await prisma.compartilhamentoEmpreendimento.findFirst({
    where: { token: req.params.token, ativo: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    include: {
      empreendimento: {
        include: {
          galeria: { orderBy: { ordem: 'asc' } },
          documentos: { where: { publico: true }, orderBy: { createdAt: 'desc' } },
          unidades: { select: { id: true, numero: true, identificacao: true, tipo: true, area: true, andar: true, quartos: true, suites: true, vagas: true, status: true, valorTotal: true } },
          tabelasPreco: { where: { ativa: true }, include: { itens: { orderBy: { ordem: 'asc' } } } }
        }
      }
    }
  });
  if (!share) return res.status(404).json({ error: 'Link inválido, revogado ou expirado' });
  await prisma.compartilhamentoEmpreendimento.update({ where: { id: share.id }, data: { visualizacoes: { increment: 1 }, lastViewedAt: now } });
  const empreendimento = { ...share.empreendimento };
  if (!share.permitirUnidades) delete empreendimento.unidades;
  else if (!share.permitirPrecos) empreendimento.unidades = empreendimento.unidades.map(({ valorTotal, ...unidade }) => unidade);
  if (!share.permitirPrecos) delete empreendimento.tabelasPreco;
  res.json({ empreendimento, clienteNome: share.clienteNome, expiresAt: share.expiresAt });
});

module.exports = router;
