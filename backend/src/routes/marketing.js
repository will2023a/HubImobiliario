const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const { requirePermission } = require('../middlewares/permissions');

const router = express.Router();

router.use(auth);

// Criar material de marketing
router.post('/', requirePermission('marketing', 'criar'), async (req, res) => {
  const {
    tipo,
    empreendimentoId,
    quantidadeInicial,
    descricao
  } = req.body;

  // Validações
  if (!tipo || !empreendimentoId || !quantidadeInicial) {
    return res.status(400).json({ 
      error: 'Campos obrigatórios: tipo, empreendimentoId, quantidadeInicial' 
    });
  }

  if (!['banner', 'folder'].includes(tipo)) {
    return res.status(400).json({ 
      error: 'Tipo deve ser "banner" ou "folder"' 
    });
  }

  try {
    // Verificar se o empreendimento pertence à imobiliária do usuário
    if (req.user.role !== 'super_admin') {
      const empreendimento = await prisma.empreendimento.findUnique({
        where: { id: parseInt(empreendimentoId) },
        select: { imobiliariaId: true }
      });
      
      if (!empreendimento || empreendimento.imobiliariaId !== req.user.imobiliariaId) {
        return res.status(403).json({ 
          error: 'Acesso negado a este empreendimento' 
        });
      }
    }

    const material = await prisma.materialMarketing.create({
      data: {
        tipo,
        empreendimentoId: parseInt(empreendimentoId),
        quantidadeInicial: parseInt(quantidadeInicial),
        quantidadeEstoque: parseInt(quantidadeInicial),
        descricao
      },
      include: {
        empreendimento: { select: { id: true, nome: true } }
      }
    });

    res.status(201).json(material);
  } catch (err) {
    console.error('Erro ao criar material:', err);
    res.status(400).json({ 
      error: 'Erro ao criar material', 
      details: err.message 
    });
  }
});

// Listar materiais (filtrados por empreendimento e imobiliária)
router.get('/', requirePermission('marketing', 'ler'), async (req, res) => {
  const { empreendimentoId } = req.query;
  const where = {};

  // Filtrar por empreendimento se fornecido
  if (empreendimentoId) {
    where.empreendimentoId = parseInt(empreendimentoId);
    
    // Verificar se o empreendimento pertence à imobiliária do usuário
    if (req.user.role !== 'super_admin') {
      const empreendimento = await prisma.empreendimento.findUnique({
        where: { id: parseInt(empreendimentoId) },
        select: { imobiliariaId: true }
      });
      
      if (!empreendimento || empreendimento.imobiliariaId !== req.user.imobiliariaId) {
        return res.status(403).json({ 
          error: 'Acesso negado a este empreendimento' 
        });
      }
    }
  }

  // Filtrar por imobiliária (exceto super_admin)
  if (req.user.role !== 'super_admin' && req.user.imobiliariaId) {
    where.empreendimento = {
      imobiliariaId: req.user.imobiliariaId
    };
  }

  try {
    const materiais = await prisma.materialMarketing.findMany({
      where,
      include: {
        empreendimento: { select: { id: true, nome: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(materiais);
  } catch (err) {
    console.error('Erro ao listar materiais:', err);
    res.status(400).json({ 
      error: 'Erro ao listar materiais', 
      details: err.message 
    });
  }
});

// Buscar material por ID
router.get('/:id', requirePermission('marketing', 'ler'), async (req, res) => {
  try {
    const material = await prisma.materialMarketing.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        empreendimento: true,
        dispensacoes: {
          orderBy: { dataDispensacao: 'desc' }
        }
      }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material não encontrado' });
    }

    res.json(material);
  } catch (err) {
    console.error('Erro ao buscar material:', err);
    res.status(400).json({ 
      error: 'Erro ao buscar material', 
      details: err.message 
    });
  }
});

// Dispensar material
router.post('/:id/dispensar', requirePermission('marketing', 'editar'), async (req, res) => {
  const { quantidade, dispensadoPara, observacoes } = req.body;

  if (!quantidade || !dispensadoPara) {
    return res.status(400).json({ 
      error: 'Campos obrigatórios: quantidade, dispensadoPara' 
    });
  }

  try {
    const material = await prisma.materialMarketing.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material não encontrado' });
    }

    if (material.quantidadeEstoque < quantidade) {
      return res.status(400).json({ 
        error: `Estoque insuficiente. Disponível: ${material.quantidadeEstoque}` 
      });
    }

    // Criar registro de dispensação
    const dispensacao = await prisma.dispensacaoMaterial.create({
      data: {
        materialId: material.id,
        quantidade: parseInt(quantidade),
        dispensadoPara,
        dispensadoPor: req.user.id,
        dataDispensacao: new Date(),
        observacoes
      }
    });

    // Atualizar estoque
    const materialAtualizado = await prisma.materialMarketing.update({
      where: { id: material.id },
      data: {
        quantidadeEstoque: material.quantidadeEstoque - parseInt(quantidade)
      },
      include: {
        empreendimento: { select: { id: true, nome: true } }
      }
    });

    res.json({
      material: materialAtualizado,
      dispensacao
    });
  } catch (err) {
    console.error('Erro ao dispensar material:', err);
    res.status(400).json({ 
      error: 'Erro ao dispensar material', 
      details: err.message 
    });
  }
});

// Histórico de dispensações de um material
router.get('/:id/historico', requirePermission('marketing', 'ler'), async (req, res) => {
  try {
    const dispensacoes = await prisma.dispensacaoMaterial.findMany({
      where: { materialId: parseInt(req.params.id) },
      include: {
        dispensadoPorUser: { select: { id: true, name: true, email: true } }
      },
      orderBy: { dataDispensacao: 'desc' }
    });

    res.json(dispensacoes);
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    res.status(400).json({ 
      error: 'Erro ao buscar histórico', 
      details: err.message 
    });
  }
});

// Atualizar material
router.put('/:id', requirePermission('marketing', 'editar'), async (req, res) => {
  const { descricao } = req.body;

  try {
    const material = await prisma.materialMarketing.update({
      where: { id: parseInt(req.params.id) },
      data: { descricao },
      include: {
        empreendimento: { select: { id: true, nome: true } }
      }
    });

    res.json(material);
  } catch (err) {
    console.error('Erro ao atualizar material:', err);
    res.status(400).json({ 
      error: 'Erro ao atualizar material', 
      details: err.message 
    });
  }
});

// Deletar material
router.delete('/:id', requirePermission('marketing', 'deletar'), async (req, res) => {
  try {
    // Verificar se há dispensações
    const dispensacoes = await prisma.dispensacaoMaterial.count({
      where: { materialId: parseInt(req.params.id) }
    });

    if (dispensacoes > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar material com histórico de dispensações' 
      });
    }

    await prisma.materialMarketing.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.json({ message: 'Material deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar material:', err);
    res.status(400).json({ 
      error: 'Erro ao deletar material', 
      details: err.message 
    });
  }
});

module.exports = router;
