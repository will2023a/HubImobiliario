const express = require('express');
const prisma = require('../prisma/client');
const auth = require('../middlewares/auth');
const multitenant = require('../middlewares/multitenant');

const router = express.Router();

router.use(auth);
router.use(multitenant);
const { ensureRole, ensureSameImobiliaria } = require('../middlewares/roles');

// only super_admin or admin can create users
router.post('/', ensureRole('super_admin', 'admin'), ensureSameImobiliaria, async (req, res) => {
  const { name, email, password, role, imobiliariaId } = req.body;
  try{
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(password || '123456', 10);
    const user = await prisma.user.create({ data: { name, email, password: hashed, role, imobiliariaId: imobiliariaId || req.imobiliariaId } });
    res.json(user);
  }catch(err){
    res.status(400).json({ error: 'Create user failed', details: err.message });
  }
});

router.get('/', async (req, res) => {
  const where = {};
  if(req.user.role !== 'super_admin') where.imobiliariaId = req.imobiliariaId;
  const users = await prisma.user.findMany({ where });
  res.json(users);
});

router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
  if(!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

router.patch('/:id', async (req, res) => {
  try{
    const updated = await prisma.user.update({ where: { id: Number(req.params.id) }, data: req.body });
    res.json(updated);
  }catch(err){
    res.status(400).json({ error: 'Update failed', details: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try{
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  }catch(err){
    res.status(400).json({ error: 'Delete failed', details: err.message });
  }
});

module.exports = router;
