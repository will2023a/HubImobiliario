const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const { ensureRole } = require('../middlewares/roles');
const { clearPermissionCache } = require('../middlewares/permissions');

const router = express.Router();

router.use(auth);
router.use(ensureRole('super_admin', 'admin_imobiliaria'));

// Listar todas as permissões
router.get('/', async (req, res) => {
  const where = {};
  if (req.user.role === 'admin_imobiliaria') {
    where.OR = [
      { imobiliariaId: req.user.imobiliariaId },
      { imobiliariaId: null }
    ];
  }
  const permissoes = await prisma.permissao.findMany({ where, orderBy: { role: 'asc' } });
  res.json(permissoes);
});

// Criar ou atualizar permissão
router.post('/', async (req, res) => {
  const { role, recurso, acao, permitido, imobiliariaId } = req.body;
  
  // Admin imobiliária só pode criar para sua imobiliária
  const finalImobiliariaId = req.user.role === 'admin_imobiliaria' 
    ? req.user.imobiliariaId 
    : imobiliariaId;

  try {
    const permissao = await prisma.permissao.upsert({
      where: { 
        role_recurso_acao_imobiliariaId: { 
          role, 
          recurso, 
          acao, 
          imobiliariaId: finalImobiliariaId 
        } 
      },
      update: { permitido },
      create: { role, recurso, acao, permitido, imobiliariaId: finalImobiliariaId }
    });
    clearPermissionCache();
    res.json(permissao);
  } catch (err) {
    res.status(400).json({ error: 'Erro ao salvar permissão', details: err.message });
  }
});

// Deletar permissão
router.delete('/:id', async (req, res) => {
  try {
    await prisma.permissao.delete({ where: { id: Number(req.params.id) } });
    clearPermissionCache();
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: 'Erro ao deletar', details: err.message });
  }
});

module.exports = router;
