const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');

function getTargetImobiliariaId(req) {
  if (req.user.role === 'super_admin') {
    const supplied = req.query.imobiliariaId || req.body?.imobiliariaId;
    return supplied ? Number(supplied) : null;
  }
  return req.user.imobiliariaId;
}

// GET /config - Dados de configuração da imobiliária
router.get('/', authenticate, async (req, res) => {
  try {
    const imobiliariaId = getTargetImobiliariaId(req);
    if (!imobiliariaId) return res.status(400).json({ error: 'Selecione uma imobiliária' });
    let config = await prisma.configImobiliaria.findUnique({
      where: { imobiliariaId },
      include: { imobiliaria: true }
    });

    // Se não existe, cria com defaults
    if (!config) {
      config = await prisma.configImobiliaria.create({
        data: { imobiliariaId },
        include: { imobiliaria: true }
      });
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// PUT /config - Atualizar configuração
router.put('/', authenticate, async (req, res) => {
  try {
    // Only admin can update config
    if (!['super_admin', 'admin_imobiliaria'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }

    const targetImobiliariaId = getTargetImobiliariaId(req);
    if (!targetImobiliariaId) return res.status(400).json({ error: 'Selecione uma imobiliária' });

    const {
      logoUrl, tema, imobiliaria,
      horarioInicio, horarioFim,
      comissaoCorretor, comissaoGerente, comissaoDiretor
    } = req.body;

    const config = await prisma.configImobiliaria.upsert({
      where: { imobiliariaId: targetImobiliariaId },
      update: {
        ...(logoUrl !== undefined && { logoUrl }),
        corPrimaria: '#d4af37',
        corSecundaria: '#1a1a1a',
        ...(tema && { tema }),
        ...(horarioInicio && { horarioInicio }),
        ...(horarioFim && { horarioFim }),
        ...(comissaoCorretor !== undefined && { comissaoCorretor: parseFloat(comissaoCorretor) }),
        ...(comissaoGerente !== undefined && { comissaoGerente: parseFloat(comissaoGerente) }),
        ...(comissaoDiretor !== undefined && { comissaoDiretor: parseFloat(comissaoDiretor) }),
      },
      create: {
        imobiliariaId: targetImobiliariaId,
        ...(logoUrl && { logoUrl }),
        corPrimaria: '#d4af37',
        corSecundaria: '#1a1a1a',
        ...(tema && { tema }),
        ...(horarioInicio && { horarioInicio }),
        ...(horarioFim && { horarioFim }),
      }
    });

    if (imobiliaria) {
      const organizationData = {};
      if (typeof imobiliaria.nome === 'string' && imobiliaria.nome.trim()) organizationData.nome = imobiliaria.nome.trim();
      if (typeof imobiliaria.email === 'string' && imobiliaria.email.trim()) organizationData.email = imobiliaria.email.trim().toLowerCase();
      if (typeof imobiliaria.telefone === 'string') organizationData.telefone = imobiliaria.telefone.trim();
      if (Object.keys(organizationData).length) {
        await prisma.imobiliaria.update({ where: { id: targetImobiliariaId }, data: organizationData });
      }
    }

    const result = await prisma.configImobiliaria.findUnique({
      where: { imobiliariaId: targetImobiliariaId },
      include: { imobiliaria: true }
    });
    res.json(result);
  } catch (error) {
    console.error('Erro config:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

module.exports = router;
