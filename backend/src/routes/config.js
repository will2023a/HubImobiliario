const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const prisma = require('../prisma/client');

// GET /config - Dados de configuração da imobiliária
router.get('/', authenticate, async (req, res) => {
  try {
    let config = await prisma.configImobiliaria.findUnique({
      where: { imobiliariaId: req.user.imobiliariaId }
    });

    // Se não existe, cria com defaults
    if (!config) {
      config = await prisma.configImobiliaria.create({
        data: { imobiliariaId: req.user.imobiliariaId }
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

    const {
      logoUrl, corPrimaria, corSecundaria, tema,
      horarioInicio, horarioFim,
      comissaoCorretor, comissaoGerente, comissaoDiretor
    } = req.body;

    const config = await prisma.configImobiliaria.upsert({
      where: { imobiliariaId: req.user.imobiliariaId },
      update: {
        ...(logoUrl !== undefined && { logoUrl }),
        ...(corPrimaria && { corPrimaria }),
        ...(corSecundaria && { corSecundaria }),
        ...(tema && { tema }),
        ...(horarioInicio && { horarioInicio }),
        ...(horarioFim && { horarioFim }),
        ...(comissaoCorretor !== undefined && { comissaoCorretor: parseFloat(comissaoCorretor) }),
        ...(comissaoGerente !== undefined && { comissaoGerente: parseFloat(comissaoGerente) }),
        ...(comissaoDiretor !== undefined && { comissaoDiretor: parseFloat(comissaoDiretor) }),
      },
      create: {
        imobiliariaId: req.user.imobiliariaId,
        ...(logoUrl && { logoUrl }),
        ...(corPrimaria && { corPrimaria }),
        ...(corSecundaria && { corSecundaria }),
        ...(tema && { tema }),
        ...(horarioInicio && { horarioInicio }),
        ...(horarioFim && { horarioFim }),
      }
    });

    res.json(config);
  } catch (error) {
    console.error('Erro config:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

module.exports = router;
