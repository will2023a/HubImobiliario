const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const { ensureRole, ensureSameImobiliaria } = require('../middlewares/roles');

const router = express.Router();

// Create imobiliaria (registration by imobiliaria) -> status aguardando_aprovacao
router.post('/', async (req, res) => {
  const { nome, cnpj, email, telefone, nomeAdmin, emailAdmin, senha } = req.body;
  const { validateImobiliariaData } = require('../utils/validators');
  const v = validateImobiliariaData({ nome, cnpj, email, telefone });
  if(!v.ok) return res.status(400).json({ error: v.message });
  const { validateEmail, validatePassword } = require('../utils/validators');
  if (!nomeAdmin?.trim() || !validateEmail(emailAdmin) || !validatePassword(senha)) {
    return res.status(400).json({ error: 'Informe nome, e-mail e senha válida do responsável' });
  }
  try{
    const duplicate = await prisma.imobiliaria.findFirst({ where: { OR: [{ cnpj }, { email }] } });
    if (duplicate || await prisma.user.findUnique({ where: { email: emailAdmin.toLowerCase() } })) {
      return res.status(409).json({ error: 'CNPJ ou e-mail já cadastrado' });
    }
    const bcrypt = require('bcryptjs');
    const defaultPlan = await prisma.plan.findUnique({ where: { code: 'users_10' } });
    const result = await prisma.$transaction(async tx => {
      const owner = await tx.user.create({ data: {
        name: nomeAdmin.trim(), email: emailAdmin.toLowerCase(), password: await bcrypt.hash(senha, 12),
        role: 'admin_imobiliaria', isApproved: false
      } });
      const imob = await tx.imobiliaria.create({ data: {
        nome, cnpj, email: email.toLowerCase(), telefone, status: 'aguardando_aprovacao',
        plan: defaultPlan?.code || 'users_10', planId: defaultPlan?.id, ownerId: owner.id
      } });
      await tx.user.update({ where: { id: owner.id }, data: { imobiliariaId: imob.id } });
      await tx.imobiliariaAdmin.create({ data: { userId: owner.id, imobiliariaId: imob.id } });
      return { imobiliariaId: imob.id, status: imob.status };
    });
    res.status(201).json(result);
  }catch(err){
    res.status(400).json({ error: 'Não foi possível concluir o cadastro' });
  }
});

router.get('/public/plans', async (req, res) => {
  const plans = await prisma.plan.findMany({ where: { active: true }, select: { id: true, code: true, name: true, maxUsers: true, maxImobiliarias: true }, orderBy: { maxUsers: 'asc' } });
  res.json(plans);
});

// Uma imobiliária adicional de um administrador sempre nasce pendente.
router.post('/managed', auth, ensureRole('admin_imobiliaria'), async (req, res) => {
  const { nome, cnpj, email, telefone } = req.body;
  const { validateImobiliariaData } = require('../utils/validators');
  const validation = validateImobiliariaData({ nome, cnpj, email, telefone });
  if (!validation.ok) return res.status(400).json({ error: validation.message });
  try {
    const primary = await prisma.imobiliaria.findUnique({ where: { id: req.user.imobiliariaId }, include: { plano: true } });
    const maxImobiliarias = primary?.plano?.maxImobiliarias || 1;
    const managedCount = await prisma.imobiliariaAdmin.count({ where: { userId: req.user.id, active: true } });
    if (managedCount >= maxImobiliarias) return res.status(409).json({ error: `Seu plano permite administrar até ${maxImobiliarias} imobiliária(s)`, code: 'PLAN_AGENCY_LIMIT' });
    const created = await prisma.imobiliaria.create({ data: {
      nome, cnpj, email: email.toLowerCase(), telefone, status: 'aguardando_aprovacao', ownerId: req.user.id,
      planId: primary?.planId, plan: primary?.plan || 'users_10', admins: { create: { userId: req.user.id } }
    } });
    res.status(201).json(created);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'CNPJ ou e-mail já cadastrado' });
    res.status(400).json({ error: err.message || 'Não foi possível cadastrar a imobiliária' });
  }
});

router.get('/', auth, ensureRole('super_admin'), async (req, res) => {
  const list = await prisma.imobiliaria.findMany({ include: { owner: { select: { id: true, name: true, email: true, isApproved: true, lastSeenAt: true } }, plano: true, _count: { select: { usuarios: true } } } });
  res.json(list);
});

router.get('/:id', auth, ensureSameImobiliaria, async (req, res) => {
  const { id } = req.params;
  const imob = await prisma.imobiliaria.findUnique({ where: { id: Number(id) } });
  if(!imob) return res.status(404).json({ error: 'Not found' });
  res.json(imob);
});

router.patch('/:id', auth, ensureRole('super_admin'), async (req, res) => {
  const { id } = req.params;
  try{
    const data = {};
    if (typeof req.body.nome === 'string') data.nome = req.body.nome.trim();
    if (typeof req.body.telefone === 'string') data.telefone = req.body.telefone.trim();
    if (typeof req.body.email === 'string') data.email = req.body.email.trim().toLowerCase();
    if (req.body.planId) data.planId = Number(req.body.planId);
    const updated = await prisma.imobiliaria.update({ where: { id: Number(id) }, data });
    res.json(updated);
  }catch(err){
    res.status(400).json({ error: 'Update failed', details: err.message });
  }
});

router.delete('/:id', auth, ensureRole('super_admin'), async (req, res) => {
  const { id } = req.params;
  try{
    await prisma.imobiliaria.delete({ where: { id: Number(id) } });
    res.json({ ok: true });
  }catch(err){
    res.status(400).json({ error: 'Delete failed', details: err.message });
  }
});

module.exports = router;
