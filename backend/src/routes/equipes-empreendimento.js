const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');
const { getAccessibleEmpreendimento, getManageableEmpreendimento } = require('../utils/empreendimento-access');

async function manageableLink(req, id) {
  const link = await prisma.empreendimentoEquipe.findUnique({ where: { id: Number(id) } });
  return link && await getManageableEmpreendimento(req.user, link.empreendimentoId) ? link : null;
}

// GET /equipes-empreendimento/:empreendimentoId - Listar equipes vinculadas
router.get('/:empreendimentoId', authenticate, async (req, res) => {
  try {
    if (!await getAccessibleEmpreendimento(req.user, req.params.empreendimentoId)) return res.status(404).json({ error: 'Empreendimento não encontrado' });
    const equipes = await prisma.empreendimentoEquipe.findMany({
      where: { empreendimentoId: parseInt(req.params.empreendimentoId) },
      include: {
        imobiliaria: { select: { id: true, nome: true, cnpj: true, status: true } }
      }
    });
    res.json(equipes);
  } catch (error) {
    console.error('Erro equipes:', error);
    res.status(500).json({ error: 'Erro ao buscar equipes' });
  }
});

// POST /equipes-empreendimento - Vincular equipe a empreendimento
router.post('/', authenticate, async (req, res) => {
  try {
    const { empreendimentoId, imobiliariaId, comissaoPercent } = req.body;

    if (!empreendimentoId || !imobiliariaId) {
      return res.status(400).json({ error: 'empreendimentoId e imobiliariaId são obrigatórios' });
    }
    if (!await getManageableEmpreendimento(req.user, empreendimentoId)) return res.status(404).json({ error: 'Empreendimento não encontrado ou não gerenciável' });
    if (!await prisma.imobiliaria.findFirst({ where: { id: Number(imobiliariaId), status: 'ativa' } })) return res.status(400).json({ error: 'Imobiliária parceira inválida ou inativa' });

    const vinculo = await prisma.empreendimentoEquipe.create({
      data: {
        empreendimentoId: parseInt(empreendimentoId),
        imobiliariaId: parseInt(imobiliariaId),
        comissaoPercent: parseFloat(comissaoPercent) || 5.0
      },
      include: {
        imobiliaria: { select: { id: true, nome: true } }
      }
    });

    res.status(201).json(vinculo);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Equipe já vinculada a este empreendimento' });
    }
    console.error('Erro vincular equipe:', error);
    res.status(500).json({ error: 'Erro ao vincular equipe' });
  }
});

// PUT /equipes-empreendimento/:id - Atualizar comissão ou ativar/desativar
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { comissaoPercent, ativa } = req.body;

    if (!await manageableLink(req, req.params.id)) return res.status(404).json({ error: 'Vínculo não encontrado ou não gerenciável' });
    const vinculo = await prisma.empreendimentoEquipe.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(comissaoPercent !== undefined && { comissaoPercent: parseFloat(comissaoPercent) }),
        ...(ativa !== undefined && { ativa })
      }
    });

    res.json(vinculo);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar vínculo' });
  }
});

// DELETE /equipes-empreendimento/:id - Remover vínculo
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (!await manageableLink(req, req.params.id)) return res.status(404).json({ error: 'Vínculo não encontrado ou não gerenciável' });
    await prisma.empreendimentoEquipe.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Vínculo removido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover vínculo' });
  }
});

module.exports = router;
