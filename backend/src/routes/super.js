const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');

const router = express.Router();

function ensureSuper(req, res, next) {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Acesso exclusivo do administrador geral' });
  next();
}

router.use(auth, ensureSuper);

router.get('/overview', async (req, res) => {
  const onlineSince = new Date(Date.now() - 5 * 60 * 1000);
  const [users, imobiliarias, plans] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isApproved: true, lastSeenAt: true, createdAt: true, imobiliariaId: true, imobiliaria: { select: { id: true, nome: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.imobiliaria.findMany({
      include: { owner: { select: { id: true, name: true, email: true, isApproved: true } }, plano: true, _count: { select: { usuarios: true } } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.plan.findMany({ where: { active: true }, orderBy: { maxUsers: 'asc' } })
  ]);
  res.json({
    users: users.map(user => ({ ...user, online: Boolean(user.lastSeenAt && user.lastSeenAt >= onlineSince) })),
    imobiliarias,
    plans,
    totals: {
      users: users.length,
      online: users.filter(user => user.lastSeenAt && user.lastSeenAt >= onlineSince).length,
      pendingUsers: users.filter(user => !user.isApproved).length,
      imobiliarias: imobiliarias.length,
      pendingImobiliarias: imobiliarias.filter(item => item.status === 'aguardando_aprovacao').length
    }
  });
});

router.get('/imobiliarias/pendentes', async (req, res) => {
  res.json(await prisma.imobiliaria.findMany({ where: { status: 'aguardando_aprovacao' }, include: { owner: true, plano: true } }));
});

router.patch('/imobiliarias/:id/aprovar', async (req, res) => {
  const id = Number(req.params.id);
  const planId = req.body.planId ? Number(req.body.planId) : undefined;
  try {
    const updated = await prisma.$transaction(async tx => {
      const imobiliaria = await tx.imobiliaria.findUnique({ where: { id } });
      if (!imobiliaria) throw new Error('Imobiliária não encontrada');
      if (planId && !await tx.plan.findFirst({ where: { id: planId, active: true } })) throw new Error('Plano inválido');
      const result = await tx.imobiliaria.update({ where: { id }, data: { status: 'ativa', ...(planId ? { planId } : {}) }, include: { plano: true } });
      const userIds = (await tx.imobiliariaAdmin.findMany({ where: { imobiliariaId: id, active: true }, select: { userId: true } })).map(item => item.userId);
      if (imobiliaria.ownerId) userIds.push(imobiliaria.ownerId);
      if (userIds.length) await tx.user.updateMany({ where: { id: { in: [...new Set(userIds)] } }, data: { isApproved: true, approvedAt: new Date(), approvedById: req.user.id } });
      return result;
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Falha ao aprovar imobiliária' });
  }
});

router.patch('/imobiliarias/:id/status', async (req, res) => {
  const allowed = ['ativa', 'inativa', 'aguardando_aprovacao'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: 'Status inválido' });
  const updated = await prisma.imobiliaria.update({ where: { id: Number(req.params.id) }, data: { status: req.body.status } });
  res.json(updated);
});

router.patch('/users/:id/approval', async (req, res) => {
  const id = Number(req.params.id);
  const isApproved = req.body.isApproved === true;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (target.role === 'super_admin') return res.status(400).json({ error: 'A aprovação do administrador geral não pode ser alterada' });
  if (isApproved && target.imobiliariaId) {
    const imobiliaria = await prisma.imobiliaria.findUnique({ where: { id: target.imobiliariaId }, include: { plano: true } });
    if (!imobiliaria || imobiliaria.status !== 'ativa') return res.status(409).json({ error: 'A imobiliária precisa estar ativa antes de aprovar o usuário' });
    const approvedUsers = await prisma.user.count({ where: { imobiliariaId: target.imobiliariaId, isApproved: true } });
    const limit = imobiliaria.plano?.maxUsers || 10;
    if (!target.isApproved && approvedUsers >= limit) return res.status(409).json({ error: `Limite de ${limit} usuários do plano atingido`, code: 'PLAN_USER_LIMIT' });
  }
  const updated = await prisma.user.update({ where: { id }, data: { isApproved, approvedAt: isApproved ? new Date() : null, approvedById: isApproved ? req.user.id : null }, select: { id: true, name: true, email: true, isApproved: true, approvedAt: true } });
  res.json(updated);
});

module.exports = router;
