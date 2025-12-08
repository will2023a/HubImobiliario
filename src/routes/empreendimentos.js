const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const multitenant = require('../middlewares/multitenant');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.use(auth);
router.use(multitenant);

// Criar empreendimento
router.post('/', requirePermission('empreendimentos', 'criar'), async (req, res) => {
  const data = { 
    ...req.body, 
    imobiliariaId: req.body.imobiliariaId || req.imobiliariaId 
  };
  
  try {
    const empreendimento = await prisma.empreendimento.create({ data });
    res.json(empreendimento);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar empreendimento', details: err.message });
  }
});

// Listar empreendimentos
router.get('/', requirePermission('empreendimentos', 'ler'), async (req, res) => {
  const where = {};
  if (req.user.role !== 'super_admin') {
    where.imobiliariaId = req.imobiliariaId;
  }
  
  const list = await prisma.empreendimento.findMany({ 
    where,
    include: {
      _count: {
        select: { unidades: true, propostas: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(list);
});

// Buscar empreendimento por ID (dashboard)
router.get('/:id', requirePermission('empreendimentos', 'ler'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const empreendimento = await prisma.empreendimento.findUnique({ 
      where: { id },
      include: {
        unidades: {
          include: {
            _count: { select: { propostas: true } }
          }
        },
        propostas: {
          include: { corretor: true, unidade: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!empreendimento) {
      return res.status(404).json({ error: 'Empreendimento não encontrado' });
    }
    
    // Verificar se pertence à mesma imobiliária
    if (req.user.role !== 'super_admin' && empreendimento.imobiliariaId !== req.imobiliariaId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    res.json(empreendimento);
  } catch (err) {
    console.error('Erro ao buscar empreendimento:', err);
    res.status(500).json({ error: 'Erro ao buscar empreendimento', details: err.message });
  }
});

// Atualizar empreendimento
router.patch('/:id', requirePermission('empreendimentos', 'atualizar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const updated = await prisma.empreendimento.update({ 
      where: { id }, 
      data: req.body 
    });
    res.json(updated);
  } catch (err) {
    console.error('Erro ao atualizar empreendimento:', err);
    res.status(400).json({ error: 'Erro ao atualizar', details: err.message });
  }
});

// Deletar empreendimento
router.delete('/:id', requirePermission('empreendimentos', 'deletar'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    await prisma.empreendimento.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao deletar empreendimento:', err);
    res.status(400).json({ error: 'Erro ao deletar', details: err.message });
  }
});

module.exports = router;
