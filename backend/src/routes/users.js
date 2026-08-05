const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const multitenant = require('../middlewares/multitenant');

const router = express.Router();

router.use(auth);
router.use(multitenant);
const { ensureRole, ensureSameImobiliaria } = require('../middlewares/roles');
const { validateEmail, validatePassword } = require('../utils/validators');
const { PAGES, defaultAccess } = require('../constants/access');
const { getUserAccess } = require('../middlewares/access');

const publicUserSelect = { id: true, name: true, email: true, role: true, imobiliariaId: true, diretorId: true, gerenteId: true, isApproved: true, approvedAt: true, lastSeenAt: true, createdAt: true };

function canManageUsers(req) {
  return ['super_admin', 'admin_imobiliaria'].includes(req.user.role);
}

async function findAllowedUser(req, id) {
  const user = await prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  if (!user) return null;
  if (req.user.role !== 'super_admin' && user.imobiliariaId !== req.user.imobiliariaId) return false;
  return user;
}

// only super_admin or admin can create users
router.post('/', ensureRole('super_admin', 'admin_imobiliaria'), ensureSameImobiliaria, async (req, res) => {
  const { name, email, password, role, imobiliariaId } = req.body;
  const allowedRoles = req.user.role === 'super_admin'
    ? ['admin_imobiliaria', 'diretor', 'gerente', 'corretor']
    : ['diretor', 'gerente', 'corretor'];
  if (!name || !validateEmail(email) || !validatePassword(password) || !allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Dados de usuário inválidos' });
  }
  try{
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password, 12);
    const targetImobiliariaId = Number(imobiliariaId || req.imobiliariaId);
    if (!targetImobiliariaId) return res.status(400).json({ error: 'Selecione uma imobiliária' });
    const user = await prisma.$transaction(async tx => {
      const imobiliaria = await tx.imobiliaria.findUnique({ where: { id: targetImobiliariaId }, include: { plano: true } });
      if (!imobiliaria || imobiliaria.status !== 'ativa') {
        const error = new Error('Imobiliária não encontrada ou inativa'); error.code = 'AGENCY_INACTIVE'; throw error;
      }
      const currentUsers = await tx.user.count({ where: { imobiliariaId: targetImobiliariaId } });
      const limit = imobiliaria.plano?.maxUsers || 10;
      if (currentUsers >= limit) {
        const error = new Error(`O plano permite até ${limit} usuários`); error.code = 'PLAN_USER_LIMIT'; error.currentUsers = currentUsers; error.limit = limit; throw error;
      }
      return tx.user.create({ data: { name: name.trim(), email: email.toLowerCase(), password: hashed, role, imobiliariaId: targetImobiliariaId, isApproved: true, approvedAt: new Date(), approvedById: req.user.id } });
    });
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, imobiliariaId: user.imobiliariaId });
  }catch(err){
    if (err.code === 'PLAN_USER_LIMIT') return res.status(409).json({ error: err.message, code: err.code, currentUsers: err.currentUsers, limit: err.limit });
    if (err.code === 'AGENCY_INACTIVE') return res.status(400).json({ error: err.message, code: err.code });
    res.status(400).json({ error: 'Create user failed', details: err.message });
  }
});

router.get('/', async (req, res) => {
  const where = {};
  if(req.user.role !== 'super_admin') where.imobiliariaId = req.imobiliariaId;
  if(req.user.role === 'super_admin' && req.query.imobiliariaId) where.imobiliariaId = Number(req.query.imobiliariaId);
  const users = await prisma.user.findMany({ where, select: publicUserSelect });
  res.json(users);
});

router.get('/:id', async (req, res) => {
  const user = await findAllowedUser(req, Number(req.params.id));
  if(!user) return res.status(404).json({ error: 'Not found' });
  if(user === false) return res.status(403).json({ error: 'Forbidden' });
  res.json(user);
});

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const target = await findAllowedUser(req, id);
  if (!target) return res.status(target === false ? 403 : 404).json({ error: target === false ? 'Forbidden' : 'Not found' });
  const isSelf = req.user.id === id;
  if (!isSelf && !canManageUsers(req)) return res.status(403).json({ error: 'Forbidden' });
  const data = {};
  if (typeof req.body.name === 'string' && req.body.name.trim()) data.name = req.body.name.trim();
  if (isSelf && validateEmail(req.body.email)) data.email = req.body.email.toLowerCase();
  if (canManageUsers(req) && ['diretor', 'gerente', 'corretor', 'admin_imobiliaria'].includes(req.body.role)) data.role = req.body.role;
  if (req.body.password) {
    if (!validatePassword(req.body.password)) return res.status(400).json({ error: 'Senha inválida' });
    const bcrypt = require('bcryptjs');
    data.password = await bcrypt.hash(req.body.password, 12);
  }
  try{
    const updated = await prisma.user.update({ where: { id }, data, select: publicUserSelect });
    res.json(updated);
  }catch(err){
    res.status(400).json({ error: 'Update failed', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  if (!canManageUsers(req)) return res.status(403).json({ error: 'Forbidden' });
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário' });
  const target = await findAllowedUser(req, id);
  if (!target) return res.status(target === false ? 403 : 404).json({ error: target === false ? 'Forbidden' : 'Not found' });
  try{
    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  }catch(err){
    res.status(400).json({ error: 'Delete failed', details: err.message });
  }
});

router.get('/:id/access', async (req, res) => {
  const id = Number(req.params.id);
  const target = await findAllowedUser(req, id);
  if (!target) return res.status(target === false ? 403 : 404).json({ error: target === false ? 'Forbidden' : 'Not found' });
  if (req.user.id !== id && !canManageUsers(req)) return res.status(403).json({ error: 'Forbidden' });
  res.json(await getUserAccess(target));
});

router.put('/:id/access', async (req, res) => {
  if (!canManageUsers(req)) return res.status(403).json({ error: 'Forbidden' });
  const id = Number(req.params.id);
  const target = await findAllowedUser(req, id);
  if (!target) return res.status(target === false ? 403 : 404).json({ error: target === false ? 'Forbidden' : 'Not found' });
  if (target.role === 'super_admin') return res.status(400).json({ error: 'Acesso do super admin não pode ser limitado' });
  const rules = Array.isArray(req.body.access) ? req.body.access : [];
  const normalized = PAGES.map(page => {
    const supplied = rules.find(rule => rule.page === page);
    const fallback = defaultAccess(target.role).find(rule => rule.page === page);
    const canView = supplied ? Boolean(supplied.canView) : fallback.canView;
    return { page, canView, canEdit: canView && (supplied ? Boolean(supplied.canEdit) : fallback.canEdit) };
  });
  await prisma.$transaction([
    prisma.userAccess.deleteMany({ where: { userId: id } }),
    prisma.userAccess.createMany({ data: normalized.map(rule => ({ userId: id, ...rule })) })
  ]);
  res.json(normalized);
});

module.exports = router;
