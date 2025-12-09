const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.use(auth);

// Criar proposta
router.post('/', requirePermission('propostas', 'criar'), async (req, res) => {
  const data = { 
    ...req.body,
    corretorId: req.body.corretorId || req.user.id
  };
  
  try {
    const proposta = await prisma.proposta.create({ 
      data,
      include: { corretor: true, unidade: true, empreendimento: true }
    });
    
    // Atualizar status da unidade para reservado
    await prisma.unidade.update({
      where: { id: proposta.unidadeId },
      data: { status: 'reservado' }
    });
    
    res.json(proposta);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao criar proposta', details: err.message });
  }
});

// Listar propostas (filtradas por role)
router.get('/', requirePermission('propostas', 'ler'), async (req, res) => {
  const where = {};
  
  // Corretores só veem suas próprias propostas
  if (req.user.role === 'corretor') {
    where.corretorId = req.user.id;
  }
  // Gerentes veem propostas de seus corretores
  else if (req.user.role === 'gerente') {
    const corretores = await prisma.user.findMany({ 
      where: { gerenteId: req.user.id },
      select: { id: true }
    });
    where.corretorId = { in: corretores.map(c => c.id).concat(req.user.id) };
  }
  // Diretores veem propostas de seus gerentes e corretores
  else if (req.user.role === 'diretor') {
    const gerentes = await prisma.user.findMany({ 
      where: { diretorId: req.user.id },
      select: { id: true }
    });
    const corretores = await prisma.user.findMany({ 
      where: { gerenteId: { in: gerentes.map(g => g.id) } },
      select: { id: true }
    });
    const allIds = [req.user.id, ...gerentes.map(g => g.id), ...corretores.map(c => c.id)];
    where.corretorId = { in: allIds };
  }
  // Admin imobiliária vê todas da sua imobiliária
  else if (req.user.role === 'admin_imobiliaria') {
    where.empreendimento = { imobiliariaId: req.user.imobiliariaId };
  }
  
  const propostas = await prisma.proposta.findMany({ 
    where,
    include: { 
      corretor: { select: { id: true, name: true, email: true } },
      unidade: true,
      empreendimento: { select: { id: true, nome: true, cidade: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(propostas);
});

// Buscar proposta por ID
router.get('/:id', requirePermission('propostas', 'ler'), async (req, res) => {
  const proposta = await prisma.proposta.findUnique({ 
    where: { id: Number(req.params.id) },
    include: { corretor: true, unidade: true, empreendimento: true }
  });
  
  if (!proposta) return res.status(404).json({ error: 'Não encontrada' });
  
  // Verificar permissão baseada em hierarquia
  if (req.user.role === 'corretor' && proposta.corretorId !== req.user.id) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  res.json(proposta);
});

// Atualizar proposta (status, observações)
router.patch('/:id', requirePermission('propostas', 'atualizar'), async (req, res) => {
  try {
    const proposta = await prisma.proposta.update({ 
      where: { id: Number(req.params.id) }, 
      data: req.body,
      include: { corretor: true, unidade: true, empreendimento: true }
    });
    
    // Se foi aprovada, marcar unidade como vendida
    if (req.body.status === 'aprovada') {
      await prisma.unidade.update({
        where: { id: proposta.unidadeId },
        data: { status: 'vendido' }
      });
    }
    // Se foi rejeitada, liberar unidade
    else if (req.body.status === 'rejeitada') {
      await prisma.unidade.update({
        where: { id: proposta.unidadeId },
        data: { status: 'disponivel' }
      });
    }
    
    res.json(proposta);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao atualizar', details: err.message });
  }
});

// Deletar proposta
router.delete('/:id', requirePermission('propostas', 'deletar'), async (req, res) => {
  try {
    const proposta = await prisma.proposta.findUnique({ where: { id: Number(req.params.id) } });
    
    // Liberar unidade
    await prisma.unidade.update({
      where: { id: proposta.unidadeId },
      data: { status: 'disponivel' }
    });
    
    await prisma.proposta.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao deletar', details: err.message });
  }
});

module.exports = router;
